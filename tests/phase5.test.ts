import request from 'supertest';
import app from '../src/index';
import prisma from '../src/config/database';
import { hashPassword } from '../src/utils/password';
import { cache } from '../src/config/redis';

describe('Phase 5: Social Service - Interactions', () => {
  let testUser1: any;
  let testUser2: any;
  let testUser3: any;
  let accessToken1: string;
  let accessToken2: string;
  let accessToken3: string;
  let testPost1: any;

  beforeAll(async () => {
    // Clean up test data - get user IDs first
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          in: ['testuser1@example.com', 'testuser2@example.com', 'testuser3@example.com'],
        },
      },
      select: { id: true },
    });
    const testUserIds = testUsers.map((u) => u.id);

    if (testUserIds.length > 0) {
      await prisma.notification.deleteMany({
        where: {
          userId: { in: testUserIds },
        },
      });
      await prisma.like.deleteMany({
        where: {
          OR: [
            { userId: { in: testUserIds } },
            { post: { authorId: { in: testUserIds } } },
          ],
        },
      });
      await prisma.follow.deleteMany({
        where: {
          OR: [
            { followerId: { in: testUserIds } },
            { followingId: { in: testUserIds } },
          ],
        },
      });
      await prisma.block.deleteMany({
        where: {
          OR: [
            { blockerId: { in: testUserIds } },
            { blockedId: { in: testUserIds } },
          ],
        },
      });
      await prisma.post.deleteMany({
        where: {
          authorId: { in: testUserIds },
        },
      });
    }

    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['testuser1@example.com', 'testuser2@example.com', 'testuser3@example.com'],
        },
      },
    });

    // Create test users
    const hashedPassword = await hashPassword('Test123!@#');

    testUser1 = await prisma.user.create({
      data: {
        email: 'testuser1@example.com',
        username: 'testuser1',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User1',
        isEmailVerified: true,
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        email: 'testuser2@example.com',
        username: 'testuser2',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User2',
        isEmailVerified: true,
      },
    });

    testUser3 = await prisma.user.create({
      data: {
        email: 'testuser3@example.com',
        username: 'testuser3',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User3',
        isEmailVerified: true,
      },
    });

    // Login users to get tokens
    const login1 = await request(app).post('/api/users/login').send({
      identifier: 'testuser1@example.com',
      password: 'Test123!@#',
    });
    accessToken1 = login1.body.data.accessToken;

    const login2 = await request(app).post('/api/users/login').send({
      identifier: 'testuser2@example.com',
      password: 'Test123!@#',
    });
    accessToken2 = login2.body.data.accessToken;

    const login3 = await request(app).post('/api/users/login').send({
      identifier: 'testuser3@example.com',
      password: 'Test123!@#',
    });
    accessToken3 = login3.body.data.accessToken;

    // Create test posts
    testPost1 = await prisma.post.create({
      data: {
        content: 'This is a test post for likes',
        authorId: testUser1.id,
        visibility: 'public',
      },
    });
  });

  afterAll(async () => {
    // Clean up test data - get user IDs first
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          in: ['testuser1@example.com', 'testuser2@example.com', 'testuser3@example.com'],
        },
      },
      select: { id: true },
    });
    const testUserIds = testUsers.map((u) => u.id);

    if (testUserIds.length > 0) {
      await prisma.notification.deleteMany({
        where: {
          userId: { in: testUserIds },
        },
      });
      await prisma.like.deleteMany({
        where: {
          OR: [
            { userId: { in: testUserIds } },
            { post: { authorId: { in: testUserIds } } },
          ],
        },
      });
      await prisma.follow.deleteMany({
        where: {
          OR: [
            { followerId: { in: testUserIds } },
            { followingId: { in: testUserIds } },
          ],
        },
      });
      await prisma.block.deleteMany({
        where: {
          OR: [
            { blockerId: { in: testUserIds } },
            { blockedId: { in: testUserIds } },
          ],
        },
      });
      await prisma.post.deleteMany({
        where: {
          authorId: { in: testUserIds },
        },
      });
    }

    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['testuser1@example.com', 'testuser2@example.com', 'testuser3@example.com'],
        },
      },
    });
  });

  describe('Follow/Unfollow', () => {
    it('should follow a user', async () => {
      const response = await request(app)
        .post(`/api/social/follow/${testUser2.id}`)
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('followed');
    });

    it('should reject following yourself', async () => {
      const response = await request(app)
        .post(`/api/social/follow/${testUser1.id}`)
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(400);
    });

    it('should reject duplicate follow', async () => {
      const response = await request(app)
        .post(`/api/social/follow/${testUser2.id}`)
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(400);
    });

    it('should unfollow a user', async () => {
      const response = await request(app)
        .delete(`/api/social/follow/${testUser2.id}`)
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('unfollowed');
    });

    it('should reject unfollowing when not following', async () => {
      const response = await request(app)
        .delete(`/api/social/follow/${testUser2.id}`)
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(404);
    });

    it('should require authentication to follow', async () => {
      const response = await request(app)
        .post(`/api/social/follow/${testUser2.id}`);

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent user when following', async () => {
      const response = await request(app)
        .post('/api/social/follow/nonexistent')
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Followers/Following Lists', () => {
    beforeAll(async () => {
      // Set up follow relationships
      await prisma.follow.create({
        data: {
          followerId: testUser1.id,
          followingId: testUser2.id,
        },
      });
      await prisma.follow.create({
        data: {
          followerId: testUser3.id,
          followingId: testUser2.id,
        },
      });
      await prisma.follow.create({
        data: {
          followerId: testUser1.id,
          followingId: testUser3.id,
        },
      });
    });

    it('should get followers of a user', async () => {
      const response = await request(app)
        .get(`/api/social/followers/${testUser2.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.followers).toBeDefined();
      expect(Array.isArray(response.body.data.followers)).toBe(true);
      expect(response.body.data.total).toBeGreaterThanOrEqual(0);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(10); // Default from pagination schema
      expect(response.body.data.totalPages).toBeDefined();
    });

    it('should get following list of a user', async () => {
      const response = await request(app)
        .get(`/api/social/following/${testUser1.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.following).toBeDefined();
      expect(Array.isArray(response.body.data.following)).toBe(true);
      expect(response.body.data.total).toBeGreaterThanOrEqual(0);
    });

    it('should support pagination for followers', async () => {
      const response = await request(app)
        .get(`/api/social/followers/${testUser2.id}?page=1&limit=1`);

      expect(response.status).toBe(200);
      expect(response.body.data.limit).toBe(1);
    });

    it('should work without authentication', async () => {
      const response = await request(app)
        .get(`/api/social/followers/${testUser2.id}`);

      expect(response.status).toBe(200);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/social/followers/nonexistent');

      expect(response.status).toBe(404);
    });
  });

  describe('Post Likes', () => {
    it('should like a post', async () => {
      const response = await request(app)
        .post(`/api/social/posts/${testPost1.id}/like`)
        .set('Authorization', `Bearer ${accessToken2}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('liked');
    });

    it('should reject liking already liked post', async () => {
      const response = await request(app)
        .post(`/api/social/posts/${testPost1.id}/like`)
        .set('Authorization', `Bearer ${accessToken2}`);

      expect(response.status).toBe(400);
    });

    it('should unlike a post', async () => {
      const response = await request(app)
        .delete(`/api/social/posts/${testPost1.id}/like`)
        .set('Authorization', `Bearer ${accessToken2}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('unliked');
    });

    it('should reject unliking not liked post', async () => {
      const response = await request(app)
        .delete(`/api/social/posts/${testPost1.id}/like`)
        .set('Authorization', `Bearer ${accessToken2}`);

      expect(response.status).toBe(400);
    });

    it('should toggle post like', async () => {
      // First toggle - should like
      const likeResponse = await request(app)
        .post(`/api/social/posts/${testPost1.id}/toggle-like`)
        .set('Authorization', `Bearer ${accessToken3}`);

      expect(likeResponse.status).toBe(200);
      expect(likeResponse.body.success).toBe(true);
      expect(likeResponse.body.data.liked).toBe(true);

      // Second toggle - should unlike
      const unlikeResponse = await request(app)
        .post(`/api/social/posts/${testPost1.id}/toggle-like`)
        .set('Authorization', `Bearer ${accessToken3}`);

      expect(unlikeResponse.status).toBe(200);
      expect(unlikeResponse.body.success).toBe(true);
      expect(unlikeResponse.body.data.liked).toBe(false);
    });

    it('should require authentication to like post', async () => {
      const response = await request(app)
        .post(`/api/social/posts/${testPost1.id}/like`);

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent post when liking', async () => {
      const response = await request(app)
        .post('/api/social/posts/nonexistent/like')
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Like Counts on Posts', () => {
    beforeAll(async () => {
      // Like the post
      await prisma.like.create({
        data: {
          userId: testUser2.id,
          postId: testPost1.id,
        },
      });
    });

    it('should include like count in post response', async () => {
      const response = await request(app)
        .get(`/api/posts/${testPost1.id}`)
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.data._count).toBeDefined();
      expect(response.body.data._count.likes).toBeGreaterThanOrEqual(0);
    });

    it('should include isLiked flag for authenticated users', async () => {
      const response = await request(app)
        .get(`/api/posts/${testPost1.id}`)
        .set('Authorization', `Bearer ${accessToken2}`);

      expect(response.status).toBe(200);
      expect(response.body.data.isLiked).toBeDefined();
      expect(typeof response.body.data.isLiked).toBe('boolean');
    });

    it('should show correct like count after multiple likes', async () => {
      // Ensure testUser2's like exists (from beforeAll)
      await prisma.like.upsert({
        where: {
          userId_postId: {
            userId: testUser2.id,
            postId: testPost1.id,
          },
        },
        update: {},
        create: {
          userId: testUser2.id,
          postId: testPost1.id,
        },
      });

      // Add another like for testUser3
      await prisma.like.upsert({
        where: {
          userId_postId: {
            userId: testUser3.id,
            postId: testPost1.id,
          },
        },
        update: {},
        create: {
          userId: testUser3.id,
          postId: testPost1.id,
        },
      });

      // Verify likes exist in database
      const likes = await prisma.like.findMany({
        where: { postId: testPost1.id },
        select: { userId: true },
      });

      // Verify we have at least 2 likes in the database
      expect(likes.length).toBeGreaterThanOrEqual(2);

      // Clear cache for this post to ensure we get fresh data
      await cache.delPattern(`post:${testPost1.id}:*`);

      // Now check the API response
      const response = await request(app)
        .get(`/api/posts/${testPost1.id}`)
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(200);
      
      // Verify the count matches what's in the database
      expect(response.body.data._count.likes).toBe(likes.length);
      // Should have at least 2 likes (testUser2 + testUser3)
      expect(response.body.data._count.likes).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Notifications', () => {
    let notificationId: string;

    it('should get user notifications', async () => {
      // Create a notification first
      const notification = await prisma.notification.create({
        data: {
          userId: testUser1.id,
          type: 'test',
          message: 'Test notification',
        },
      });
      notificationId = notification.id;

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications).toBeDefined();
      expect(Array.isArray(response.body.data.notifications)).toBe(true);
      expect(response.body.data.total).toBeGreaterThanOrEqual(0);
      expect(response.body.data.unreadCount).toBeDefined();
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(10);
    });

    it('should filter unread notifications', async () => {
      const response = await request(app)
        .get('/api/notifications?unreadOnly=true')
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.data.notifications.every((n: any) => !n.isRead)).toBe(true);
    });

    it('should get unread notification count', async () => {
      const response = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.unreadCount).toBeDefined();
      expect(typeof response.body.data.unreadCount).toBe('number');
    });

    it('should mark notification as read', async () => {
      const response = await request(app)
        .put(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify notification is marked as read
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });
      expect(notification?.isRead).toBe(true);
    });

    it('should mark all notifications as read', async () => {
      // Create more unread notifications
      await prisma.notification.createMany({
        data: [
          {
            userId: testUser1.id,
            type: 'test',
            message: 'Test notification 1',
            isRead: false,
          },
          {
            userId: testUser1.id,
            type: 'test',
            message: 'Test notification 2',
            isRead: false,
          },
        ],
      });

      const response = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify all notifications are marked as read
      const unreadCount = await prisma.notification.count({
        where: {
          userId: testUser1.id,
          isRead: false,
        },
      });
      expect(unreadCount).toBe(0);
    });

    it('should delete a notification', async () => {
      const notification = await prisma.notification.create({
        data: {
          userId: testUser1.id,
          type: 'test',
          message: 'Notification to delete',
        },
      });

      const response = await request(app)
        .delete(`/api/notifications/${notification.id}`)
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify notification is deleted
      const deleted = await prisma.notification.findUnique({
        where: { id: notification.id },
      });
      expect(deleted).toBeNull();
    });

    it('should reject accessing other user notifications', async () => {
      const notification = await prisma.notification.create({
        data: {
          userId: testUser2.id,
          type: 'test',
          message: 'Other user notification',
        },
      });

      const response = await request(app)
        .put(`/api/notifications/${notification.id}/read`)
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(404);
    });

    it('should require authentication for notifications', async () => {
      const response = await request(app).get('/api/notifications');

      expect(response.status).toBe(401);
    });
  });

  describe('Edge Cases', () => {
    it('should handle blocked users in follow attempts', async () => {
      // Ensure user1 is not already following user2
      await prisma.follow.deleteMany({
        where: {
          followerId: testUser1.id,
          followingId: testUser2.id,
        },
      });

      // Block user2 (user1 blocks user2)
      await prisma.block.create({
        data: {
          blockerId: testUser1.id,
          blockedId: testUser2.id,
        },
      });

      // Try to follow blocked user
      const response = await request(app)
        .post(`/api/social/follow/${testUser2.id}`)
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(403);

      // Clean up
      await prisma.block.deleteMany({
        where: {
          blockerId: testUser1.id,
          blockedId: testUser2.id,
        },
      });
    });

    it('should handle deleted users in follow attempts', async () => {
      // Create and delete a user
      const tempUser = await prisma.user.create({
        data: {
          email: 'temp@example.com',
          username: 'tempuser',
          password: await hashPassword('Test123!@#'),
          isEmailVerified: true,
        },
      });

      await prisma.user.update({
        where: { id: tempUser.id },
        data: { deletedAt: new Date() },
      });

      const response = await request(app)
        .post(`/api/social/follow/${tempUser.id}`)
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(404);

      // Clean up
      await prisma.user.delete({ where: { id: tempUser.id } });
    });
  });
});

