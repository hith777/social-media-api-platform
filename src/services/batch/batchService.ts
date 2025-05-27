import { ContentService } from '../content/contentService';
import { UserService } from '../user/userService';
import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { cache } from '../../config/redis';

export class BatchService {
  private contentService: ContentService;
  private userService: UserService;

  constructor() {
    this.contentService = new ContentService();
    this.userService = new UserService();
  }

  /**
   * Batch fetch multiple posts by IDs
   */
  async batchGetPosts(
    postIds: string[],
    userId?: string
  ): Promise<Record<string, any>> {
    if (postIds.length === 0) {
      return {};
    }

    if (postIds.length > 50) {
      throw new AppError('Maximum 50 posts per batch request', 400);
    }

    // Try to get from cache first
    const cacheKeys = postIds.map(
      (id) => `post:${id}:${userId || 'anonymous'}`
    );
    const cachedPosts = await Promise.all(
      cacheKeys.map((key) => cache.getJSON<any>(key))
    );

    // Find which posts are not cached
    const uncachedIndices: number[] = [];
    const results: Record<string, any> = {};

    cachedPosts.forEach((cached, index) => {
      if (cached) {
        results[postIds[index]] = cached;
      } else {
        uncachedIndices.push(index);
      }
    });

    // Fetch uncached posts from database
    if (uncachedIndices.length > 0) {
      const uncachedIds = uncachedIndices.map((idx) => postIds[idx]);

      const posts = await prisma.post.findMany({
        where: {
          id: { in: uncachedIds },
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
                where: { userId },
                select: { userId: true },
              }
            : false,
        },
      });

      // Process and cache posts
      for (const post of posts) {
        const postData = {
          ...post,
          isLiked: (post as any).likes && (post as any).likes.length > 0,
        };
        delete (postData as any).likes;

        results[post.id] = postData;

        // Cache the post
        const cacheKey = `post:${post.id}:${userId || 'anonymous'}`;
        await cache.setJSON(cacheKey, postData, 300); // 5 minutes
      }
    }

    return results;
  }

  /**
   * Batch fetch multiple users by IDs
   */
  async batchGetUsers(
    userIds: string[],
    requesterId?: string
  ): Promise<Record<string, any>> {
    if (userIds.length === 0) {
      return {};
    }

    if (userIds.length > 50) {
      throw new AppError('Maximum 50 users per batch request', 400);
    }

    // Try to get from cache first
    const cacheKeys = userIds.map((id) => `user:${id}`);
    const cachedUsers = await Promise.all(
      cacheKeys.map((key) => cache.getJSON<any>(key))
    );

    // Find which users are not cached
    const uncachedIndices: number[] = [];
    const results: Record<string, any> = {};

    cachedUsers.forEach((cached, index) => {
      if (cached) {
        results[userIds[index]] = cached;
      } else {
        uncachedIndices.push(index);
      }
    });

    // Fetch uncached users from database
    if (uncachedIndices.length > 0) {
      const uncachedIds = uncachedIndices.map((idx) => userIds[idx]);

      const users = await prisma.user.findMany({
        where: {
          id: { in: uncachedIds },
          deletedAt: null,
          isActive: true,
        },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Process and cache users
      for (const user of users) {
        results[user.id] = user;

        // Cache the user
        const cacheKey = `user:${user.id}`;
        await cache.setJSON(cacheKey, user, 600); // 10 minutes
      }
    }

    return results;
  }

  /**
   * Batch fetch multiple comments by IDs
   */
  async batchGetComments(
    commentIds: string[],
    userId?: string
  ): Promise<Record<string, any>> {
    if (commentIds.length === 0) {
      return {};
    }

    if (commentIds.length > 50) {
      throw new AppError('Maximum 50 comments per batch request', 400);
    }

    const comments = await prisma.comment.findMany({
      where: {
        id: { in: commentIds },
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
    });

    const results: Record<string, any> = {};

    for (const comment of comments) {
      results[comment.id] = {
        ...comment,
        isLiked: (comment as any).likes && (comment as any).likes.length > 0,
      };
      delete (results[comment.id] as any).likes;
    }

    return results;
  }
}

