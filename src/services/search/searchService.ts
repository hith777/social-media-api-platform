import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { cache } from '../../config/redis';
import crypto from 'crypto';

export class SearchService {
  // Cache TTL in seconds (5 minutes)
  private readonly CACHE_TTL = 300;

  // Generate cache key for search queries
  private generateCacheKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    const hash = crypto.createHash('md5').update(sortedParams).digest('hex');
    return `search:${prefix}:${hash}`;
  }
  /**
   * Full-text search for posts with filters and sorting
   */
  async searchPosts(
    query: string,
    page: number = 1,
    limit: number = 20,
    userId?: string,
    filters?: {
      visibility?: 'public' | 'private' | 'friends';
      authorId?: string;
      minLikes?: number;
      minComments?: number;
      dateFrom?: Date;
      dateTo?: Date;
    },
    sortBy?: 'newest' | 'oldest' | 'popular' | 'relevance'
  ): Promise<{
    posts: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    if (!query || query.trim().length === 0) {
      throw new AppError('Search query is required', 400);
    }

    if (query.length > 200) {
      throw new AppError('Search query cannot exceed 200 characters', 400);
    }

    const searchQuery = query.trim();
    const skip = (page - 1) * limit;

    // Generate cache key
    const cacheKey = this.generateCacheKey('posts', {
      q: searchQuery,
      page,
      limit,
      userId: userId || 'anonymous',
      filters,
      sortBy,
    });

    // Try to get from cache
    const cached = await cache.getJSON<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // Build visibility filter
    const visibilityFilter: any[] = ['public'];
    if (userId) {
      visibilityFilter.push('friends');
    }

    // Apply custom visibility filter if provided
    if (filters?.visibility) {
      visibilityFilter.length = 0;
      visibilityFilter.push(filters.visibility);
    }

    // Use PostgreSQL full-text search with ILIKE for case-insensitive matching
    // For better performance, we can use PostgreSQL's full-text search features
    const where: any = {
      isDeleted: false as any,
      visibility: { in: visibilityFilter },
      OR: [
        {
          content: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
        {
          author: {
            username: {
              contains: searchQuery,
              mode: 'insensitive',
            },
          },
        },
      ],
    };

    // Apply additional filters
    if (filters?.authorId) {
      where.authorId = filters.authorId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    // Exclude blocked users
    if (userId) {
      const blocked = await prisma.block.findMany({
        where: {
          OR: [
            { blockerId: userId },
            { blockedId: userId },
          ],
        },
        select: {
          blockerId: true,
          blockedId: true,
        },
      });

      const blockedIds = new Set<string>();
      blocked.forEach((b) => {
        if (b.blockerId === userId) blockedIds.add(b.blockedId);
        if (b.blockedId === userId) blockedIds.add(b.blockerId);
      });

      if (blockedIds.size > 0) {
        if (where.authorId && typeof where.authorId === 'string') {
          // If authorId filter exists and is blocked, return empty results
          if (blockedIds.has(where.authorId)) {
            return {
              posts: [],
              total: 0,
              page,
              limit,
              totalPages: 0,
            };
          }
        } else {
          // Exclude blocked users
          where.authorId = {
            notIn: Array.from(blockedIds),
          };
        }
      }
    }

    // Build orderBy based on sortBy parameter
    let orderBy: any = { createdAt: 'desc' }; // Default: newest first
    if (sortBy === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (sortBy === 'popular') {
      // For popular, we'll sort by engagement (likes + comments) after fetching
      orderBy = { createdAt: 'desc' };
    } else if (sortBy === 'relevance') {
      // For relevance, prioritize posts with query in content over author username
      orderBy = { createdAt: 'desc' };
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
          likes: userId
            ? {
                where: { userId },
                select: { userId: true },
              }
            : false,
        },
        orderBy,
        skip,
        take: limit,
      }) as any,
      prisma.post.count({ where }),
    ]);

    // Apply engagement filters (minLikes, minComments) after fetching
    let filteredPosts = posts;
    if (filters?.minLikes !== undefined || filters?.minComments !== undefined) {
      filteredPosts = posts.filter((post: any) => {
        const likesCount = post._count?.likes || 0;
        const commentsCount = post._count?.comments || 0;
        if (filters.minLikes !== undefined && likesCount < filters.minLikes) {
          return false;
        }
        if (filters.minComments !== undefined && commentsCount < filters.minComments) {
          return false;
        }
        return true;
      });
    }

    // Apply sorting for 'popular' and 'relevance'
    if (sortBy === 'popular') {
      filteredPosts.sort((a: any, b: any) => {
        const aEngagement = (a._count?.likes || 0) + (a._count?.comments || 0);
        const bEngagement = (b._count?.likes || 0) + (b._count?.comments || 0);
        if (bEngagement !== aEngagement) {
          return bEngagement - aEngagement;
        }
        // If engagement is equal, sort by newest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else if (sortBy === 'relevance') {
      // Sort by relevance: posts with query in content first, then by author username
      filteredPosts.sort((a: any, b: any) => {
        const aContentMatch = a.content.toLowerCase().includes(searchQuery.toLowerCase());
        const bContentMatch = b.content.toLowerCase().includes(searchQuery.toLowerCase());
        if (aContentMatch && !bContentMatch) return -1;
        if (!aContentMatch && bContentMatch) return 1;
        // If both match or both don't match, sort by newest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    const postsWithLikes = filteredPosts.map((post: any) => ({
      ...post,
      isLiked: post.likes && post.likes.length > 0,
    }));

    const result = {
      posts: postsWithLikes,
      total: filteredPosts.length,
      page,
      limit,
      totalPages: Math.ceil(filteredPosts.length / limit),
    };

    // Cache the result
    await cache.setJSON(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  /**
   * Search users by username, firstName, lastName, or email with filters and sorting
   */
  async searchUsers(
    query: string,
    page: number = 1,
    limit: number = 20,
    userId?: string,
    filters?: {
      verifiedOnly?: boolean;
      hasBio?: boolean;
    },
    sortBy?: 'relevance' | 'newest' | 'oldest' | 'username'
  ): Promise<{
    users: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    if (!query || query.trim().length === 0) {
      throw new AppError('Search query is required', 400);
    }

    if (query.length > 200) {
      throw new AppError('Search query cannot exceed 200 characters', 400);
    }

    const searchQuery = query.trim();
    const skip = (page - 1) * limit;

    // Generate cache key
    const cacheKey = this.generateCacheKey('users', {
      q: searchQuery,
      page,
      limit,
      userId: userId || 'anonymous',
      filters,
      sortBy,
    });

    // Try to get from cache
    const cached = await cache.getJSON<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // Build search condition
    const where: any = {
      AND: [
        {
          OR: [
            { username: { contains: searchQuery, mode: 'insensitive' } },
            { firstName: { contains: searchQuery, mode: 'insensitive' } },
            { lastName: { contains: searchQuery, mode: 'insensitive' } },
            { email: { contains: searchQuery, mode: 'insensitive' } },
          ],
        },
        { isActive: true },
        { deletedAt: null },
      ],
    };

    // Apply filters
    if (filters?.verifiedOnly) {
      where.AND.push({ isEmailVerified: true });
    }

    if (filters?.hasBio) {
      where.AND.push({
        bio: {
          not: null,
        },
      });
    }

    // Exclude blocked users if authenticated
    if (userId) {
      const blocked = await prisma.block.findMany({
        where: {
          OR: [
            { blockerId: userId },
            { blockedId: userId },
          ],
        },
        select: {
          blockerId: true,
          blockedId: true,
        },
      });

      const blockedIds = new Set<string>();
      blocked.forEach((b) => {
        if (b.blockerId === userId) blockedIds.add(b.blockedId);
        if (b.blockedId === userId) blockedIds.add(b.blockerId);
      });

      if (blockedIds.size > 0) {
        where.AND.push({
          id: {
            notIn: Array.from(blockedIds),
          },
        });
      }

      // Exclude self from search results
      where.AND.push({
        id: {
          not: userId,
        },
      });
    }

    // Build orderBy based on sortBy parameter
    let orderBy: any[] = [
      { isEmailVerified: 'desc' }, // Verified users first by default
      { username: 'asc' }, // Then alphabetically
    ];

    if (sortBy === 'newest') {
      orderBy = [{ createdAt: 'desc' }, { username: 'asc' }];
    } else if (sortBy === 'oldest') {
      orderBy = [{ createdAt: 'asc' }, { username: 'asc' }];
    } else if (sortBy === 'username') {
      orderBy = [{ username: 'asc' }];
    } else if (sortBy === 'relevance') {
      // For relevance, we'll sort after fetching based on match quality
      orderBy = [{ isEmailVerified: 'desc' }, { username: 'asc' }];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
          isEmailVerified: true,
          createdAt: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Apply relevance sorting if needed
    let sortedUsers = users;
    if (sortBy === 'relevance') {
      sortedUsers = users.sort((a, b) => {
        // Prioritize exact username matches
        const aUsernameMatch = a.username.toLowerCase() === searchQuery.toLowerCase();
        const bUsernameMatch = b.username.toLowerCase() === searchQuery.toLowerCase();
        if (aUsernameMatch && !bUsernameMatch) return -1;
        if (!aUsernameMatch && bUsernameMatch) return 1;

        // Then prioritize username starts with query
        const aUsernameStarts = a.username.toLowerCase().startsWith(searchQuery.toLowerCase());
        const bUsernameStarts = b.username.toLowerCase().startsWith(searchQuery.toLowerCase());
        if (aUsernameStarts && !bUsernameStarts) return -1;
        if (!aUsernameStarts && bUsernameStarts) return 1;

        // Then prioritize verified users
        if (a.isEmailVerified && !b.isEmailVerified) return -1;
        if (!a.isEmailVerified && b.isEmailVerified) return 1;

        // Finally, alphabetical
        return a.username.localeCompare(b.username);
      });
    }

    const totalPages = Math.ceil(total / limit);

    const result = {
      users: sortedUsers,
      total,
      page,
      limit,
      totalPages,
    };

    // Cache the result
    await cache.setJSON(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  /**
   * Get trending posts based on engagement and recency
   * Algorithm considers: likes, comments, and recency (time decay)
   */
  async getTrendingPosts(
    page: number = 1,
    limit: number = 20,
    userId?: string,
    timeRange: 'day' | 'week' | 'month' | 'all' = 'week'
  ): Promise<{
    posts: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    // Generate cache key
    const cacheKey = this.generateCacheKey('trending', {
      page,
      limit,
      userId: userId || 'anonymous',
      timeRange,
    });

    // Try to get from cache
    const cached = await cache.getJSON<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // Calculate time threshold based on timeRange
    const now = new Date();
    let timeThreshold: Date;
    switch (timeRange) {
      case 'day':
        timeThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        timeThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        timeThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        timeThreshold = new Date(0); // All time
    }

    // Build visibility filter
    const visibilityFilter: any[] = ['public'];
    if (userId) {
      visibilityFilter.push('friends');
    }

    const where: any = {
      isDeleted: false as any,
      visibility: { in: visibilityFilter },
      createdAt: {
        gte: timeThreshold,
      },
    };

    // Exclude blocked users
    if (userId) {
      const blocked = await prisma.block.findMany({
        where: {
          OR: [
            { blockerId: userId },
            { blockedId: userId },
          ],
        },
        select: {
          blockerId: true,
          blockedId: true,
        },
      });

      const blockedIds = new Set<string>();
      blocked.forEach((b) => {
        if (b.blockerId === userId) blockedIds.add(b.blockedId);
        if (b.blockedId === userId) blockedIds.add(b.blockerId);
      });

      if (blockedIds.size > 0) {
        where.authorId = {
          notIn: Array.from(blockedIds),
        };
      }
    }

    // Get all posts with their engagement metrics
    const posts = await prisma.post.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        likes: userId
          ? {
              where: { userId },
              select: { userId: true },
            }
          : false,
      },
    }) as any;

    // Calculate trending score for each post
    // Score = (likes * 2 + comments * 3) / (hours_since_creation + 1)
    // This gives more weight to comments and applies time decay
    const postsWithScore = posts.map((post: any) => {
      const hoursSinceCreation =
        (now.getTime() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
      const likesCount = post._count.likes || 0;
      const commentsCount = post._count.comments || 0;
      const engagementScore = likesCount * 2 + commentsCount * 3;
      const trendingScore = engagementScore / (hoursSinceCreation + 1);

      return {
        ...post,
        trendingScore,
        isLiked: post.likes && post.likes.length > 0,
      };
    });

    // Sort by trending score (descending)
    postsWithScore.sort((a: any, b: any) => b.trendingScore - a.trendingScore);

    // Apply pagination
    const total = postsWithScore.length;
    const paginatedPosts = postsWithScore.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit);

    // Remove trendingScore from response (it was just for sorting)
    const finalPosts = paginatedPosts.map(({ trendingScore, ...post }: any) => post);

    const result = {
      posts: finalPosts,
      total,
      page,
      limit,
      totalPages,
    };

    // Cache the result
    await cache.setJSON(cacheKey, result, this.CACHE_TTL);

    return result;
  }
}

export default new SearchService();



