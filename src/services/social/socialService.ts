import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

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
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
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
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    // Find the follow relationship
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
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
  }

  /**
   * Check if a user is following another user
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return !!follow;
  }
}

export default new SocialService();



