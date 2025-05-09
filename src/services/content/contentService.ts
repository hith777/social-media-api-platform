import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export class ContentService {
  /**
   * Create a new post
   */
  async createPost(
    authorId: string,
    data: {
      content: string;
      mediaUrls?: string[];
      visibility?: 'public' | 'private' | 'friends';
    }
  ): Promise<any> {
    // Validate content length
    if (!data.content || data.content.trim().length === 0) {
      throw new AppError('Post content cannot be empty', 400);
    }

    if (data.content.length > 5000) {
      throw new AppError('Post content cannot exceed 5000 characters', 400);
    }

    // Validate media URLs count
    if (data.mediaUrls && data.mediaUrls.length > 10) {
      throw new AppError('Maximum 10 media files allowed per post', 400);
    }

    const post = await prisma.post.create({
      data: {
        content: data.content.trim(),
        authorId,
        mediaUrls: (data.mediaUrls || []) as any,
        visibility: (data.visibility || 'public') as any,
      },
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
      },
    });

    return post;
  }

  /**
   * Get a single post by ID
   */
  async getPostById(postId: string, userId?: string): Promise<any> {
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        isDeleted: false as any,
      },
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
              where: {
                userId,
              },
              select: {
                userId: true,
              },
            }
          : false,
      },
    });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    // Check visibility
    if ((post as any).visibility === 'private' && post.authorId !== userId) {
      throw new AppError('Post not found', 404);
    }

    // Check if user is blocked
    if (userId && userId !== post.authorId) {
      const isBlocked = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: userId, blockedId: post.authorId },
            { blockerId: post.authorId, blockedId: userId },
          ],
        },
      });

      if (isBlocked) {
        throw new AppError('Post not found', 404);
      }
    }

    return {
      ...post,
      isLiked: (post as any).likes && (post as any).likes.length > 0,
    };
  }

  /**
   * Get user's feed (posts from followed users and own posts)
   */
  async getFeed(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    posts: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    // Get user's following list
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    followingIds.push(userId); // Include own posts

    // Get blocked users
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

    // Filter out blocked users
    const allowedAuthorIds = followingIds.filter((id) => !blockedIds.has(id));

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          authorId: { in: allowedAuthorIds },
          isDeleted: false as any,
          visibility: { in: ['public', 'friends'] as any },
        },
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
          likes: {
            where: { userId },
            select: { userId: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.post.count({
        where: {
          authorId: { in: allowedAuthorIds },
          isDeleted: false as any,
          visibility: { in: ['public', 'friends'] as any },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      posts: posts.map((post) => ({
        ...post,
        isLiked: (post as any).likes && (post as any).likes.length > 0,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get posts by a specific user
   */
  async getUserPosts(
    authorId: string,
    viewerId?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    posts: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    // Check if viewer is blocked
    if (viewerId && viewerId !== authorId) {
      const isBlocked = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: viewerId, blockedId: authorId },
            { blockerId: authorId, blockedId: viewerId },
          ],
        },
      });

      if (isBlocked) {
        return {
          posts: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }
    }

    // Determine visibility filter
    const visibilityFilter: any[] = ['public'];
    if (viewerId === authorId) {
      visibilityFilter.push('private', 'friends');
    } else if (viewerId) {
      // Check if viewer follows author
      const follows = await prisma.follow.findFirst({
        where: {
          followerId: viewerId,
          followingId: authorId,
        },
      });
      if (follows) {
        visibilityFilter.push('friends');
      }
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          authorId,
          isDeleted: false as any,
          visibility: { in: visibilityFilter },
        },
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
          likes: viewerId
            ? {
                where: { userId: viewerId },
                select: { userId: true },
              }
            : false,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.post.count({
        where: {
          authorId,
          isDeleted: false as any,
          visibility: { in: visibilityFilter },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      posts: posts.map((post) => ({
        ...post,
        isLiked: (post as any).likes && (post as any).likes.length > 0,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get posts with filtering and sorting
   */
  async getPosts(
    filters: {
      authorId?: string;
      visibility?: 'public' | 'private' | 'friends';
      search?: string;
    },
    sortBy: 'newest' | 'oldest' | 'popular' = 'newest',
    page: number = 1,
    limit: number = 10,
    userId?: string
  ): Promise<{
    posts: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const where: any = {
      isDeleted: false as any,
    };

    if (filters.authorId) {
      where.authorId = filters.authorId;
    }

    if (filters.visibility) {
      where.visibility = filters.visibility;
    } else if (!userId || userId !== filters.authorId) {
      // Default to public if not viewing own posts
      where.visibility = 'public';
    }

    if (filters.search) {
      where.content = {
        contains: filters.search,
        mode: 'insensitive',
      };
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
        where.authorId = {
          notIn: Array.from(blockedIds),
        };
      }
    }

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (sortBy === 'popular') {
      // Sort by like count (would need aggregation in production)
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
      }),
      prisma.post.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      posts: posts.map((post) => ({
        ...post,
        isLiked: (post as any).likes && (post as any).likes.length > 0,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Update a post
   */
  async updatePost(
    postId: string,
    userId: string,
    data: {
      content?: string;
      mediaUrls?: string[];
      visibility?: 'public' | 'private' | 'friends';
    }
  ): Promise<any> {
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        isDeleted: false as any,
      },
    });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    if (post.authorId !== userId) {
      throw new AppError('You can only update your own posts', 403);
    }

    // Validate content if provided
    if (data.content !== undefined) {
      if (data.content.trim().length === 0) {
        throw new AppError('Post content cannot be empty', 400);
      }
      if (data.content.length > 5000) {
        throw new AppError('Post content cannot exceed 5000 characters', 400);
      }
    }

    // Validate media URLs count
    if (data.mediaUrls && data.mediaUrls.length > 10) {
      throw new AppError('Maximum 10 media files allowed per post', 400);
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        ...(data.content !== undefined && { content: data.content.trim() }),
        ...(data.mediaUrls !== undefined && { mediaUrls: data.mediaUrls as any }),
        ...(data.visibility !== undefined && { visibility: data.visibility as any }),
      },
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
      },
    });

    return updatedPost;
  }

  /**
   * Delete a post (soft delete)
   */
  async deletePost(postId: string, userId: string): Promise<void> {
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        isDeleted: false as any,
      },
    });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    if (post.authorId !== userId) {
      throw new AppError('You can only delete your own posts', 403);
    }

    await prisma.post.update({
      where: { id: postId },
      data: {
        isDeleted: true as any,
        deletedAt: new Date() as any,
      },
    });
  }
}

export default new ContentService();
