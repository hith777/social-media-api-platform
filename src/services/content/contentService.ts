import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { cache } from '../../config/redis';
import {
  calculateSkip,
  calculateTotalPages,
  createPaginationResult,
  normalizePagination,
  type PaginationResult,
} from '../../utils/pagination';

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
    // Validate content length (check trimmed length to match what will be stored)
    const trimmedContent = data.content.trim();
    if (trimmedContent.length === 0) {
      throw new AppError('Post content cannot be empty', 400);
    }

    if (trimmedContent.length > 5000) {
      throw new AppError('Post content cannot exceed 5000 characters', 400);
    }

    // Validate media URLs count
    if (data.mediaUrls && data.mediaUrls.length > 10) {
      throw new AppError('Maximum 10 media files allowed per post', 400);
    }

    const post = await prisma.post.create({
      data: {
        content: trimmedContent,
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
    const cacheKey = `post:${postId}:${userId || 'anonymous'}`;
    
    // Try cache first
    const cached = await cache.getJSON<any>(cacheKey);
    if (cached) {
      return cached;
    }

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

    // Check visibility
    const visibility = (post as any).visibility;
    
    if (visibility === 'private') {
      // Private posts are only visible to the author
      if (post.authorId !== userId) {
        throw new AppError('Post not found', 404);
      }
    } else if (visibility === 'friends') {
      // Friends posts are visible to the author and their followers
      if (post.authorId !== userId) {
        if (!userId) {
          // Not authenticated, cannot see friends-only posts
          throw new AppError('Post not found', 404);
        }
        
        // Check if viewer follows the author
        const follows = await prisma.follow.findFirst({
          where: {
            followerId: userId,
            followingId: post.authorId,
          },
        });

        if (!follows) {
          throw new AppError('Post not found', 404);
        }
      }
    }
    // 'public' posts are visible to everyone (no additional check needed)

    const result = {
      ...post,
      isLiked: (post as any).likes && (post as any).likes.length > 0,
    };

    // Cache for 5 minutes
    await cache.setJSON(cacheKey, result, 300);

    return result;
  }

  /**
   * Get user's feed (posts from followed users and own posts)
   */
  async getFeed(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginationResult<any>> {
    const { page: normalizedPage, limit: normalizedLimit } = normalizePagination(page, limit);
    const skip = calculateSkip(normalizedPage, normalizedLimit);
    const cacheKey = `feed:${userId}:${normalizedPage}:${normalizedLimit}`;
    
    // Try cache first (shorter TTL for feeds as they change frequently)
    const cached = await cache.getJSON<any>(cacheKey);
    if (cached) {
      return cached;
    }
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

    const postsWithLikes = posts.map((post) => ({
      ...post,
      isLiked: (post as any).likes && (post as any).likes.length > 0,
    }));

    const result = createPaginationResult(
      postsWithLikes,
      total,
      normalizedPage,
      normalizedLimit
    );

    // Cache for 2 minutes (feeds change frequently)
    await cache.setJSON(cacheKey, result, 120);

    return result;
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
      } else if (filters.authorId) {
        // When filtering by author, determine visibility based on relationship
        if (userId === filters.authorId) {
          // Viewing own posts - show all visibility levels
          where.visibility = { in: ['public', 'private', 'friends'] as any };
        } else if (userId) {
          // Batch check if user follows the author (optimize for potential multiple authors)
          const follows = await prisma.follow.findFirst({
            where: {
              followerId: userId,
              followingId: filters.authorId,
            },
            select: { id: true }, // Only select id for existence check
          });
          if (follows) {
            // Show public and friends posts
            where.visibility = { in: ['public', 'friends'] as any };
          } else {
            // Only show public posts
            where.visibility = 'public';
          }
        } else {
          // Not authenticated - only show public posts
          where.visibility = 'public';
        }
    } else {
      // No author filter - default to public for unauthenticated users
      if (!userId) {
        where.visibility = 'public';
      } else {
        // Authenticated users can see public and friends posts (from their feed)
        where.visibility = { in: ['public', 'friends'] as any };
      }
    }

    if (filters.search) {
      where.content = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    // Exclude blocked users (batch query optimization)
    if (userId) {
      const [blockedAsBlocker, blockedAsBlocked] = await Promise.all([
        prisma.block.findMany({
          where: { blockerId: userId },
          select: { blockedId: true },
        }),
        prisma.block.findMany({
          where: { blockedId: userId },
          select: { blockerId: true },
        }),
      ]);

      const blockedIds = new Set<string>();
      blockedAsBlocker.forEach((b) => blockedIds.add(b.blockedId));
      blockedAsBlocked.forEach((b) => blockedIds.add(b.blockerId));

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

    // Validate content if provided (check trimmed length to match what will be stored)
    let trimmedContent: string | undefined;
    if (data.content !== undefined) {
      trimmedContent = data.content.trim();
      if (trimmedContent.length === 0) {
        throw new AppError('Post content cannot be empty', 400);
      }
      if (trimmedContent.length > 5000) {
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
        ...(trimmedContent !== undefined && {
          content: trimmedContent,
        }),
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
        likes: {
          where: { userId },
          select: { userId: true },
        },
      },
    });

    const result = {
      ...updatedPost,
      isLiked: (updatedPost as any).likes && (updatedPost as any).likes.length > 0,
    };

    // Invalidate cache for this post and feeds
    await cache.delPattern(`post:${postId}:*`);
    await cache.delPattern(`feed:${userId}:*`);

    return result;
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

    // Invalidate cache for this post and feeds
    await cache.delPattern(`post:${postId}:*`);
    await cache.delPattern(`feed:${userId}:*`);
  }

  /**
   * Report a post
   */
  async reportPost(
    postId: string,
    reporterId: string,
    data: {
      reason: string;
      description?: string;
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

    // Check if user already reported this post
    const existingReport = await (prisma as any).report.findFirst({
      where: {
        postId,
        reporterId,
        status: { in: ['pending', 'reviewed'] },
      },
    });

    if (existingReport) {
      throw new AppError('You have already reported this post', 409);
    }

    const report = await (prisma as any).report.create({
      data: {
        postId,
        reporterId,
        reason: data.reason,
        description: data.description,
      },
    });

    return report;
  }

  /**
   * Create a new comment on a post
   */
  async createComment(
    authorId: string,
    postId: string,
    data: {
      content: string;
      parentId?: string;
    }
  ): Promise<any> {
    // Validate content (check trimmed length to match what will be stored)
    const trimmedContent = data.content.trim();
    if (trimmedContent.length === 0) {
      throw new AppError('Comment content cannot be empty', 400);
    }

    if (trimmedContent.length > 2000) {
      throw new AppError('Comment content cannot exceed 2000 characters', 400);
    }

    // Verify post exists and is not deleted
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        isDeleted: false,
      },
    });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    // If parentId is provided, verify parent comment exists
    if (data.parentId) {
      const parentComment = await prisma.comment.findFirst({
        where: {
          id: data.parentId,
          postId: postId,
          isDeleted: false,
        },
      });

      if (!parentComment) {
        throw new AppError('Parent comment not found', 404);
      }
    }

    // Check if user is blocked by post author or vice versa
    const isBlocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: post.authorId, blockedId: authorId },
          { blockerId: authorId, blockedId: post.authorId },
        ],
      },
    });

    if (isBlocked) {
      throw new AppError('Cannot comment on this post', 403);
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content: trimmedContent,
        postId,
        authorId,
        parentId: data.parentId || null,
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
            replies: true,
          },
        },
      },
    });

    return comment;
  }

  /**
   * Get comments for a post with nested replies
   */
  async getPostComments(
    postId: string,
    userId?: string,
    page: number = 1,
    limit: number = 20,
    repliesLimit: number = 10
  ): Promise<{
    comments: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Verify post exists
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        isDeleted: false,
      },
    });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    const { page: normalizedPage, limit: normalizedLimit } = normalizePagination(page, limit);
    const skip = calculateSkip(normalizedPage, normalizedLimit);

    // Get top-level comments (parentId is null)
    const [topLevelComments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          postId,
          parentId: null,
          isDeleted: false,
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
              replies: true,
            },
          },
          likes: userId
            ? {
                where: { userId },
                select: { userId: true },
              }
            : false,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.comment.count({
        where: {
          postId,
          parentId: null,
          isDeleted: false,
        },
      }),
    ]);

    // Batch fetch all replies for top-level comments to avoid N+1 queries
    const topLevelCommentIds = topLevelComments.map((c) => c.id);
    const allReplies = topLevelCommentIds.length > 0
      ? await prisma.comment.findMany({
          where: {
            parentId: { in: topLevelCommentIds },
            isDeleted: false,
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
                replies: true,
              },
            },
            likes: userId
              ? {
                  where: { userId },
                  select: { userId: true },
                }
              : false,
          },
          orderBy: {
            createdAt: 'asc',
          },
        })
      : [];

    // Group replies by parentId
    const repliesByParent = new Map<string, any[]>();
    allReplies.forEach((reply) => {
      if (reply.parentId) {
        if (!repliesByParent.has(reply.parentId)) {
          repliesByParent.set(reply.parentId, []);
        }
        repliesByParent.get(reply.parentId)!.push(reply);
      }
    });

    // Build comment tree efficiently
    const commentsWithReplies = topLevelComments.map((comment) => {
      const replies = repliesByParent.get(comment.id) || [];
      const limitedReplies = replies.slice(0, repliesLimit);
      return {
        ...comment,
        isLiked: (comment as any).likes && (comment as any).likes.length > 0,
        replies: limitedReplies.map((reply: any) => ({
          ...reply,
          isLiked: (reply as any).likes && (reply as any).likes.length > 0,
        })),
        repliesCount: replies.length,
        hasMoreReplies: replies.length > repliesLimit,
      };
    });

    return createPaginationResult(
      commentsWithReplies,
      total,
      normalizedPage,
      normalizedLimit
    );
  }

  /**
   * Recursively get replies for a comment with pagination
   */
  private async getCommentReplies(
    parentId: string,
    userId?: string,
    maxDepth: number = 3,
    limit: number = 10
  ): Promise<{
    replies: any[];
    total: number;
  }> {
    if (maxDepth <= 0) {
      return { replies: [], total: 0 };
    }

    // Get total count of direct replies
    const total = await prisma.comment.count({
      where: {
        parentId,
        isDeleted: false,
      },
    });

    // Get paginated direct replies
    const replies = await prisma.comment.findMany({
      where: {
        parentId,
        isDeleted: false,
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
            replies: true,
          },
        },
        likes: userId
          ? {
              where: { userId },
              select: { userId: true },
            }
          : false,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    });

    // Recursively get nested replies (no pagination for nested levels)
    const repliesWithNested = await Promise.all(
      replies.map(async (reply) => {
        const nestedReplies = await this.getCommentReplies(
          reply.id,
          userId,
          maxDepth - 1,
          limit
        );
        return {
          ...reply,
          isLiked: (reply as any).likes && (reply as any).likes.length > 0,
          replies: nestedReplies.replies,
          repliesCount: nestedReplies.total,
        };
      })
    );

    return {
      replies: repliesWithNested,
      total,
    };
  }

  /**
   * Get paginated replies for a specific comment
   */
  async getCommentRepliesPaginated(
    commentId: string,
    userId?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    replies: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Verify comment exists
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        isDeleted: false,
      },
    });

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    const skip = (page - 1) * limit;

    const [replies, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          parentId: commentId,
          isDeleted: false,
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
              replies: true,
            },
          },
          likes: userId
            ? {
                where: { userId },
                select: { userId: true },
              }
            : false,
        },
        orderBy: {
          createdAt: 'asc',
        },
        skip,
        take: limit,
      }),
      prisma.comment.count({
        where: {
          parentId: commentId,
          isDeleted: false,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const repliesWithLikes = replies.map((reply) => ({
      ...reply,
      isLiked: (reply as any).likes && (reply as any).likes.length > 0,
    }));

    return {
      replies: repliesWithLikes,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Update a comment
   */
  async updateComment(
    commentId: string,
    userId: string,
    data: {
      content: string;
    }
  ): Promise<any> {
    // Find the comment
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        isDeleted: false,
      },
    });

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    // Verify ownership
    if (comment.authorId !== userId) {
      throw new AppError('You can only update your own comments', 403);
    }

    // Validate content (check trimmed length to match what will be stored)
    const trimmedContent = data.content.trim();
    if (trimmedContent.length === 0) {
      throw new AppError('Comment content cannot be empty', 400);
    }

    if (trimmedContent.length > 2000) {
      throw new AppError('Comment content cannot exceed 2000 characters', 400);
    }

    // Update comment
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: trimmedContent,
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
            replies: true,
          },
        },
      },
    });

    return updatedComment;
  }

  /**
   * Delete a comment (soft delete)
   */
  async deleteComment(commentId: string, userId: string): Promise<void> {
    // Find the comment
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        isDeleted: false,
      },
    });

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    // Verify ownership
    if (comment.authorId !== userId) {
      throw new AppError('You can only delete your own comments', 403);
    }

    // Soft delete the comment
    await prisma.comment.update({
      where: { id: commentId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Like a comment
   */
  async likeComment(commentId: string, userId: string): Promise<void> {
    // Verify comment exists
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        isDeleted: false,
      },
    });

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    if (existingLike) {
      throw new AppError('Comment already liked', 400);
    }

    // Create like
    await prisma.like.create({
      data: {
        userId,
        commentId,
      },
    });
  }

  /**
   * Unlike a comment
   */
  async unlikeComment(commentId: string, userId: string): Promise<void> {
    // Verify comment exists
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        isDeleted: false,
      },
    });

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    // Check if liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    if (!existingLike) {
      throw new AppError('Comment not liked', 400);
    }

    // Delete like
    await prisma.like.delete({
      where: {
        id: existingLike.id,
      },
    });
  }

  /**
   * Toggle comment like (like if not liked, unlike if liked)
   */
  async toggleCommentLike(commentId: string, userId: string): Promise<{ liked: boolean }> {
    // Verify comment exists
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        isDeleted: false,
      },
    });

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });
      return { liked: false };
    } else {
      // Like
      await prisma.like.create({
        data: {
          userId,
          commentId,
        },
      });
      return { liked: true };
    }
  }
}

export default new ContentService();
