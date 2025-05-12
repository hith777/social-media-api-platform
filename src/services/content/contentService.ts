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
    } else if (filters.authorId) {
      // When filtering by author, determine visibility based on relationship
      if (userId === filters.authorId) {
        // Viewing own posts - show all visibility levels
        where.visibility = { in: ['public', 'private', 'friends'] as any };
      } else if (userId) {
        // Check if user follows the author
        const follows = await prisma.follow.findFirst({
          where: {
            followerId: userId,
            followingId: filters.authorId,
          },
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
    limit: number = 20
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

    const skip = (page - 1) * limit;

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

    // For each top-level comment, fetch its replies (nested)
    const commentsWithReplies = await Promise.all(
      topLevelComments.map(async (comment) => {
        const replies = await this.getCommentReplies(comment.id, userId);
        return {
          ...comment,
          isLiked: (comment as any).likes && (comment as any).likes.length > 0,
          replies,
        };
      })
    );

    const totalPages = Math.ceil(total / limit);

    return {
      comments: commentsWithReplies,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Recursively get replies for a comment
   */
  private async getCommentReplies(
    parentId: string,
    userId?: string,
    maxDepth: number = 3
  ): Promise<any[]> {
    if (maxDepth <= 0) {
      return [];
    }

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
      take: 10, // Limit direct replies per comment
    });

    // Recursively get nested replies
    const repliesWithNested = await Promise.all(
      replies.map(async (reply) => {
        const nestedReplies = await this.getCommentReplies(
          reply.id,
          userId,
          maxDepth - 1
        );
        return {
          ...reply,
          isLiked: (reply as any).likes && (reply as any).likes.length > 0,
          replies: nestedReplies,
        };
      })
    );

    return repliesWithNested;
  }
}

export default new ContentService();
