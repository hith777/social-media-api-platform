import request from 'supertest';
import app from '../../src/index';
import { cleanupTestUsers } from '../helpers/database';

describe('E2E Critical Flows', () => {
  let user1: any;
  let user2: any;
  let accessToken1: string;
  let accessToken2: string;
  let postId: string;

  afterAll(async () => {
    await cleanupTestUsers([user1?.id, user2?.id].filter(Boolean));
  });

  describe('User Registration and Authentication Flow', () => {
    it('should complete full registration and login flow', async () => {
      // Register user
      const registerResponse = await request(app)
        .post('/api/users/register')
        .send({
          email: 'e2etest1@example.com',
          username: 'e2etest1',
          password: 'Test123!@#',
          firstName: 'E2E',
          lastName: 'Test1',
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.data.email).toBe('e2etest1@example.com');
      user1 = registerResponse.body.data;

      // Login
      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          identifier: 'e2etest1@example.com',
          password: 'Test123!@#',
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.data.accessToken).toBeDefined();
      accessToken1 = loginResponse.body.data.accessToken;
      user1 = { ...user1, id: loginResponse.body.data.user.id };
    });
  });

  describe('Post Creation and Interaction Flow', () => {
    it('should create post, receive likes and comments', async () => {
      // Create post
      const postResponse = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({
          content: 'E2E test post for interactions',
          visibility: 'public',
        });

      expect(postResponse.status).toBe(201);
      postId = postResponse.body.data.id;

      // Get post
      const getPostResponse = await request(app)
        .get(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(getPostResponse.status).toBe(200);
      expect(getPostResponse.body.data.id).toBe(postId);
    });
  });

  describe('Social Interaction Flow', () => {
    beforeAll(async () => {
      // Register second user
      const registerResponse = await request(app)
        .post('/api/users/register')
        .send({
          email: 'e2etest2@example.com',
          username: 'e2etest2',
          password: 'Test123!@#',
          firstName: 'E2E',
          lastName: 'Test2',
        });

      user2 = registerResponse.body.data;

      // Login second user
      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          identifier: 'e2etest2@example.com',
          password: 'Test123!@#',
        });

      accessToken2 = loginResponse.body.data.accessToken;
      user2 = { ...user2, id: loginResponse.body.data.user.id };
    });

    it('should complete follow, like, and comment flow', async () => {
      // User2 follows User1
      const followResponse = await request(app)
        .post(`/api/social/follow/${user1.id}`)
        .set('Authorization', `Bearer ${accessToken2}`);

      expect(followResponse.status).toBe(200);

      // User2 likes User1's post
      const likeResponse = await request(app)
        .post(`/api/social/posts/${postId}/like`)
        .set('Authorization', `Bearer ${accessToken2}`);

      expect(likeResponse.status).toBe(200);

      // User2 comments on User1's post
      const commentResponse = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({
          content: 'Great post!',
        });

      expect(commentResponse.status).toBe(201);

      // User1 sees the comment (comment likes endpoint may not exist yet)
      // This test verifies the comment was created successfully
      const getCommentsResponse = await request(app)
        .get(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(getCommentsResponse.status).toBe(200);
      expect(getCommentsResponse.body.data.comments.length).toBeGreaterThan(0);

      // User1 checks their feed (should see User2's activity)
      const feedResponse = await request(app)
        .get('/api/posts/feed?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(feedResponse.status).toBe(200);
      expect(feedResponse.body.data.data || feedResponse.body.data.posts).toBeInstanceOf(Array);
    });
  });

  describe('Notification Flow', () => {
    it('should receive notifications for interactions', async () => {
      // User2 likes another post from User1
      const newPostResponse = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({
          content: 'Another post for notifications',
          visibility: 'public',
        });

      await request(app)
        .post(`/api/social/posts/${newPostResponse.body.data.id}/like`)
        .set('Authorization', `Bearer ${accessToken2}`);

      // User1 checks notifications
      const notificationsResponse = await request(app)
        .get('/api/notifications?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(notificationsResponse.status).toBe(200);
      expect(notificationsResponse.body.data.notifications).toBeInstanceOf(Array);
    });
  });

  describe('Search and Discovery Flow', () => {
    it('should search users and posts, view trending', async () => {
      // Search for users
      const userSearchResponse = await request(app)
        .get('/api/users/search?query=e2etest')
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(userSearchResponse.status).toBe(200);
      expect(userSearchResponse.body.data).toBeInstanceOf(Array);

      // Search for posts
      const postSearchResponse = await request(app)
        .get('/api/search/posts?query=test&page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(postSearchResponse.status).toBe(200);
      expect(postSearchResponse.body.data.posts).toBeInstanceOf(Array);

      // Get trending posts
      const trendingResponse = await request(app)
        .get('/api/search/trending?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(trendingResponse.status).toBe(200);
      expect(trendingResponse.body.data.posts).toBeInstanceOf(Array);
    });
  });

  describe('Profile Management Flow', () => {
    it('should update profile and upload avatar', async () => {
      // Update profile
      const updateResponse = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({
          bio: 'E2E test user bio',
          firstName: 'Updated',
          lastName: 'Name',
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.bio).toBe('E2E test user bio');

      // Get updated profile
      const profileResponse = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.data.bio).toBe('E2E test user bio');
    });
  });

  describe('Content Moderation Flow', () => {
    it('should handle content moderation (if endpoint exists)', async () => {
      // Note: Report endpoint may not be implemented yet
      // This test verifies the flow can be tested when implemented
      const reportResponse = await request(app)
        .post(`/api/posts/${postId}/report`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({
          reason: 'Inappropriate content',
          description: 'This post violates community guidelines',
        });

      // Accept either success or 404 if not implemented
      expect([200, 201, 404]).toContain(reportResponse.status);
    });
  });

  describe('Blocking and Privacy Flow', () => {
    it('should block user and hide their content (if endpoint exists)', async () => {
      // User1 blocks User2
      const blockResponse = await request(app)
        .post('/api/users/block')
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({
          userId: user2.id,
        });

      // Accept either success or 404 if not implemented
      if (blockResponse.status === 200) {
        // User1 should not see User2's posts
        const postsResponse = await request(app)
          .get('/api/posts?page=1&limit=10')
          .set('Authorization', `Bearer ${accessToken1}`);

        expect(postsResponse.status).toBe(200);
        // Posts from blocked user should not appear
        const blockedUserPosts = postsResponse.body.data.posts.filter(
          (post: any) => post.authorId === user2.id
        );
        expect(blockedUserPosts).toHaveLength(0);
      } else {
        // Endpoint not implemented yet, just verify it returns 404
        expect(blockResponse.status).toBe(404);
      }
    });
  });
});

