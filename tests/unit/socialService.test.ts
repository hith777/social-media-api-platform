import { SocialService } from '../../src/services/social/socialService';
import prisma from '../../src/config/database';
import {
  createTestUser,
  createTestPost,
  cleanupTestUsers,
} from '../helpers/database';

describe('Social Service Unit Tests', () => {
  let socialService: SocialService;
  let user1: any;
  let user2: any;
  let user3: any;
  let post1: any;
  let post2: any;

  beforeAll(async () => {
    socialService = new SocialService();

    // Create test users
    user1 = await createTestUser({
      email: 'socialtest1@example.com',
      username: 'socialtest1',
      password: 'Test123!@#',
      isEmailVerified: true,
    });

    user2 = await createTestUser({
      email: 'socialtest2@example.com',
      username: 'socialtest2',
      password: 'Test123!@#',
      isEmailVerified: true,
    });

    user3 = await createTestUser({
      email: 'socialtest3@example.com',
      username: 'socialtest3',
      password: 'Test123!@#',
      isEmailVerified: true,
    });

    // Create test posts
    post1 = await createTestPost({
      authorId: user1.id,
      content: 'Test post 1',
      visibility: 'public',
    });

    post2 = await createTestPost({
      authorId: user2.id,
      content: 'Test post 2',
      visibility: 'public',
    });
  });

  afterAll(async () => {
    await cleanupTestUsers([user1.id, user2.id, user3.id]);
  });

  describe('followUser', () => {
    it('should follow a user', async () => {
      await socialService.followUser(user1.id, user2.id);

      const follow = await prisma.follow.findFirst({
        where: {
          followerId: user1.id,
          followingId: user2.id,
        },
      });

      expect(follow).toBeDefined();
      expect(follow?.followerId).toBe(user1.id);
      expect(follow?.followingId).toBe(user2.id);
    });

    it('should throw error for self-follow', async () => {
      await expect(
        socialService.followUser(user1.id, user1.id)
      ).rejects.toThrow('You cannot follow yourself');
    });

    it('should throw error for duplicate follow', async () => {
      await expect(
        socialService.followUser(user1.id, user2.id)
      ).rejects.toThrow('You are already following this user');
    });

    it('should throw error when user is blocked', async () => {
      // Block user2
      await prisma.block.create({
        data: {
          blockerId: user1.id,
          blockedId: user2.id,
        },
      });

      await expect(
        socialService.followUser(user1.id, user2.id)
      ).rejects.toThrow('Cannot follow this user');

      // Cleanup block
      await prisma.block.deleteMany({
        where: {
          blockerId: user1.id,
          blockedId: user2.id,
        },
      });
    });
  });

  describe('unfollowUser', () => {
    it('should unfollow a user', async () => {
      // First follow
      await socialService.followUser(user1.id, user3.id);

      // Then unfollow
      await socialService.unfollowUser(user1.id, user3.id);

      const follow = await prisma.follow.findFirst({
        where: {
          followerId: user1.id,
          followingId: user3.id,
        },
      });

      expect(follow).toBeNull();
    });

    it('should throw error when not following', async () => {
      await expect(
        socialService.unfollowUser(user1.id, user3.id)
      ).rejects.toThrow('You are not following this user');
    });
  });

  describe('getFollowers', () => {
    it('should get user followers', async () => {
      // user1 follows user2
      await socialService.followUser(user2.id, user1.id);

      const result = await socialService.getFollowers(user1.id, 1, 10);

      expect(result).toBeDefined();
      expect(result.followers).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThanOrEqual(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should return empty array for user with no followers', async () => {
      const newUser = await createTestUser({
        email: 'nofollowers@example.com',
        username: 'nofollowers',
        password: 'Test123!@#',
        isEmailVerified: true,
      });

      const result = await socialService.getFollowers(newUser.id, 1, 10);

      expect(result.followers).toHaveLength(0);
      expect(result.total).toBe(0);

      await cleanupTestUsers([newUser.id]);
    });
  });

  describe('getFollowing', () => {
    it('should get users that a user is following', async () => {
      const result = await socialService.getFollowing(user1.id, 1, 10);

      expect(result).toBeDefined();
      expect(result.following).toBeInstanceOf(Array);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  describe('likePost', () => {
    it('should like a post', async () => {
      await socialService.likePost(user1.id, post2.id);

      const like = await prisma.like.findFirst({
        where: {
          userId: user1.id,
          postId: post2.id,
        },
      });

      expect(like).toBeDefined();
      expect(like?.userId).toBe(user1.id);
      expect(like?.postId).toBe(post2.id);
    });

    it('should throw error for duplicate like', async () => {
      await expect(
        socialService.likePost(user1.id, post2.id)
      ).rejects.toThrow('Post already liked');
    });

    it('should throw error for non-existent post', async () => {
      await expect(
        socialService.likePost(user1.id, 'non-existent-id')
      ).rejects.toThrow('Post not found');
    });
  });

  describe('unlikePost', () => {
    it('should unlike a post', async () => {
      // First like
      await socialService.likePost(user2.id, post1.id);

      // Then unlike
      await socialService.unlikePost(user2.id, post1.id);

      const like = await prisma.like.findFirst({
        where: {
          userId: user2.id,
          postId: post1.id,
        },
      });

      expect(like).toBeNull();
    });

    it('should throw error when not liked', async () => {
      await expect(
        socialService.unlikePost(user2.id, post1.id)
      ).rejects.toThrow('Post not liked');
    });
  });

  describe('togglePostLike', () => {
    it('should like a post if not liked', async () => {
      const result = await socialService.togglePostLike(user3.id, post1.id);

      expect(result.liked).toBe(true);

      const like = await prisma.like.findFirst({
        where: {
          userId: user3.id,
          postId: post1.id,
        },
      });

      expect(like).toBeDefined();
    });

    it('should unlike a post if already liked', async () => {
      // Post is already liked from previous test
      const result = await socialService.togglePostLike(user3.id, post1.id);

      expect(result.liked).toBe(false);

      const like = await prisma.like.findFirst({
        where: {
          userId: user3.id,
          postId: post1.id,
        },
      });

      expect(like).toBeNull();
    });
  });
});

