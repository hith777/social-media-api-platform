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
  async getFeed(userId: string): Promise<any[]> {
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

    const posts = await prisma.post.findMany({
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
    });

    return posts.map((post) => ({
      ...post,
      isLiked: (post as any).likes && (post as any).likes.length > 0,
    }));
  }

  /**
   * Get posts by a specific user
   */
  async getUserPosts(authorId: string, viewerId?: string): Promise<any[]> {
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
        return [];
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

    const posts = await prisma.post.findMany({
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
    });

    return posts.map((post) => ({
      ...post,
      isLiked: (post as any).likes && (post as any).likes.length > 0,
    }));
  }
}

export default new ContentService();
