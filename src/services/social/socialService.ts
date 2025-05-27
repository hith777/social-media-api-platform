import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { cache } from '../../config/redis';
import {
  calculateSkip,
  createPaginationResult,
  normalizePagination,
  type PaginationResult,
} from '../../utils/pagination';

export class SocialService {
  /**
   * Follow a user
   */
  async followUser(followerId: string, followingId: string): Promise<void> {
    // Prevent self-follow
    if (followerId === followingId) {
      throw new AppError('You cannot follow yourself', 400);
    }

    // Verify the user to follow exists and is not deleted
    const userToFollow = await prisma.user.findFirst({
      where: {
        id: followingId,
        deletedAt: null,
      },
    });

    if (!userToFollow) {
      throw new AppError('User not found', 404);
    }

    // Check if already following
    const existingFollow = await prisma.follow.findFirst({
      where: {
        followerId,
        followingId,
      },
    });

    if (existingFollow) {
      throw new AppError('You are already following this user', 400);
    }

    // Check if user is blocked
    const isBlocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: followingId, blockedId: followerId },
          { blockerId: followerId, blockedId: followingId },
        ],
      },
    });

    if (isBlocked) {
      throw new AppError('Cannot follow this user', 403);
    }

    // Create follow relationship
    await prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    // Invalidate cache for followers/following lists
    await cache.delPattern(`followers:${followingId}:*`);
    await cache.delPattern(`following:${followerId}:*`);
    await cache.delPattern(`feed:${followerId}:*`);
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    // Find the follow relationship
    const follow = await prisma.follow.findFirst({
      where: {
        followerId,
        followingId,
      },
    });

    if (!follow) {
      throw new AppError('You are not following this user', 404);
    }

    // Delete the follow relationship
    await prisma.follow.delete({
      where: {
        id: follow.id,
      },
    });

    // Invalidate cache for followers/following lists
    await cache.delPattern(`followers:${followingId}:*`);
    await cache.delPattern(`following:${followerId}:*`);
    await cache.delPattern(`feed:${followerId}:*`);
  }

  /**
   * Check if a user is following another user
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await prisma.follow.findFirst({
      where: {
        followerId,
        followingId,
      },
    });

    return !!follow;
  }

  /**
   * Get followers of a user
   */
  async getFollowers(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    followers: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const cacheKey = `followers:${userId}:${page}:${limit}`;
    
    // Try cache first
    const cached = await cache.getJSON<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // Verify user exists
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      prisma.follow.findMany({
        where: {
          followingId: userId,
        },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              bio: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }) as any,
      prisma.follow.count({
        where: {
          followingId: userId,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const followersList = followers.map((follow: any) => ({
      ...follow.follower,
      followedAt: follow.createdAt,
    }));

    const result = createPaginationResult(
      followersList,
      total,
      normalizedPage,
      normalizedLimit
    );

    // Cache for 5 minutes
    await cache.setJSON(cacheKey, result, 300);

    return result;
  }

  /**
   * Get users that a user is following
   */
  async getFollowing(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    following: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const cacheKey = `following:${userId}:${page}:${limit}`;
    
    // Try cache first
    const cached = await cache.getJSON<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // Verify user exists
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      prisma.follow.findMany({
        where: {
          followerId: userId,
        },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              bio: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }) as any,
      prisma.follow.count({
        where: {
          followerId: userId,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const followingList = following.map((follow: any) => ({
      ...follow.following,
      followedAt: follow.createdAt,
    }));

    const result = createPaginationResult(
      followingList,
      total,
      normalizedPage,
      normalizedLimit
    );

    // Cache for 5 minutes
    await cache.setJSON(cacheKey, result, 300);

    return result;
  }

  /**
   * Like a post
   */
  async likePost(postId: string, userId: string): Promise<void> {
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

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      throw new AppError('Post already liked', 400);
    }

    // Create like
    await prisma.like.create({
      data: {
        userId,
        postId,
      },
    });
  }

  /**
   * Unlike a post
   */
  async unlikePost(postId: string, userId: string): Promise<void> {
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

    // Check if liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (!existingLike) {
      throw new AppError('Post not liked', 400);
    }

    // Delete like
    await prisma.like.delete({
      where: {
        id: existingLike.id,
      },
    });
  }

  /**
   * Toggle post like (like if not liked, unlike if liked)
   */
  async togglePostLike(postId: string, userId: string): Promise<{ liked: boolean }> {
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

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
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
          postId,
        },
      });
      return { liked: true };
    }
  }
}

export default new SocialService();



