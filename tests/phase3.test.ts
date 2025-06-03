import request from 'supertest';
import app from '../src/index';
import prisma from '../src/config/database';
import { hashPassword } from '../src/utils/password';

describe('Phase 3: Content Service - Posts', () => {
  let testUser1: any;
  let testUser2: any;
  let accessToken1: string;
  let accessToken2: string;
  let testPost1: any;
  let testPost2: any;
  let testPost3: any;

  beforeAll(async () => {
    // Clean up test data
    await prisma.post.deleteMany({
      where: {
        author: {
          email: {
            in: ['testuser1@example.com', 'testuser2@example.com'],
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['testuser1@example.com', 'testuser2@example.com'],
        },
      },
    });

    // Create test users
    const hashedPassword1 = await hashPassword('Test123!@#');
    const hashedPassword2 = await hashPassword('Test123!@#');

    testUser1 = await prisma.user.create({
      data: {
        email: 'testuser1@example.com',
        username: 'testuser1',
        password: hashedPassword1,
        firstName: 'Test',
        lastName: 'User1',
        isEmailVerified: true,
      },
    });

    testUser2 = await prisma.user.create({
      data: {
        email: 'testuser2@example.com',
        username: 'testuser2',
        password: hashedPassword2,
        firstName: 'Test',
        lastName: 'User2',
        isEmailVerified: true,
      },
    });

    // Login to get tokens
    const login1 = await request(app).post('/api/users/login').send({
      identifier: 'testuser1@example.com',
      password: 'Test123!@#',
    });
    if (!login1.body.data || !login1.body.data.accessToken) {
      throw new Error(`Login failed for user1: ${JSON.stringify(login1.body)}`);
    }
    accessToken1 = login1.body.data.accessToken;

    const login2 = await request(app).post('/api/users/login').send({
      identifier: 'testuser2@example.com',
      password: 'Test123!@#',
    });
    if (!login2.body.data || !login2.body.data.accessToken) {
      throw new Error(`Login failed for user2: ${JSON.stringify(login2.body)}`);
    }
    accessToken2 = login2.body.data.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.post.deleteMany({
      where: {
        author: {
          email: {
            in: ['testuser1@example.com', 'testuser2@example.com'],
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['testuser1@example.com', 'testuser2@example.com'],
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('Post Creation', () => {
    it('should create a post successfully', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({
          content: 'This is my first test post!',
          visibility: 'public',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('This is my first test post!');
      expect(response.body.data.visibility).toBe('public');
      expect(response.body.data.author.id).toBe(testUser1.id);
      expect(response.body.data._count).toBeDefined();
      testPost1 = response.body.data;
    });

    it('should create a post with media URLs', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({
          content: 'Post with media URLs',
          mediaUrls: [
            'https://example.com/image1.jpg',
            'https://example.com/image2.jpg',
          ],
          visibility: 'public',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.mediaUrls).toHaveLength(2);
    });

    it('should create a private post', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({
          content: 'This is a private post',
          visibility: 'private',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.visibility).toBe('private');
      testPost2 = response.body.data;
    });

    it('should create a friends post', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({
          content: 'This is a friends-only post',
          visibility: 'friends',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.visibility).toBe('friends');
      testPost3 = response.body.data;
    });

    it('should reject empty content', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({
          content: '',
          visibility: 'public',
        });

      expect(response.status).toBe(400);
    });

    it('should reject content exceeding 5000 characters', async () => {
      const longContent = 'a'.repeat(5001);
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({
          content: longContent,
          visibility: 'public',
        });

      expect(response.status).toBe(400);
    });

    it('should reject more than 10 media URLs', async () => {
      const manyUrls = Array.from({ length: 11 }, (_, i) => `https://example.com/img${i}.jpg`);
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({
          content: 'Post with too many URLs',
          mediaUrls: manyUrls,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Post Retrieval', () => {
    it('should get a single post by ID', async () => {
      const response = await request(app)
        .get(`/api/posts/${testPost1.id}`)
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(testPost1.id);
      expect(response.body.data.content).toBe(testPost1.content);
      expect(response.body.data.author).toBeDefined();
    });

    it('should not get private post as non-author', async () => {
      const response = await request(app)
        .get(`/api/posts/${testPost2.id}`)
        .set('Authorization', `Bearer ${accessToken2}`);

      expect(response.status).toBe(404);
    });

    it('should get private post as author', async () => {
      const response = await request(app)
        .get(`/api/posts/${testPost2.id}`)
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(testPost2.id);
    });

    it('should get user feed', async () => {
      const response = await request(app)
        .get('/api/posts/feed?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.data.posts).toBeDefined();
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(10);
    });

    it('should get user posts with pagination', async () => {
      const response = await request(app)
        .get(`/api/posts/user/${testUser1.id}?page=1&limit=10`)
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.data.posts).toBeDefined();
      expect(response.body.data.total).toBeGreaterThan(0);
      expect(Array.isArray(response.body.data.posts)).toBe(true);
    });
  });

  describe('Post Update', () => {
    it('should update own post', async () => {
      const response = await request(app)
        .put(`/api/posts/${testPost1.id}`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({
          content: 'Updated post content',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.content).toBe('Updated post content');
    });

    it('should not allow updating other user post', async () => {
      const response = await request(app)
        .put(`/api/posts/${testPost1.id}`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({
          content: 'Trying to update someone else post',
        });

      expect(response.status).toBe(403);
    });

    it('should update post visibility', async () => {
      const response = await request(app)
        .put(`/api/posts/${testPost1.id}`)
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({
          visibility: 'private',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.visibility).toBe('private');
    });
  });

  describe('Post Deletion', () => {
    it('should soft delete own post', async () => {
      // Create a post to delete
      const createResponse = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({
          content: 'Post to be deleted',
          visibility: 'public',
        });

      const postId = createResponse.body.data.id;

      const deleteResponse = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.message).toBe('Post deleted successfully');

      // Verify post is not accessible
      const getResponse = await request(app)
        .get(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(getResponse.status).toBe(404);
    });

    it('should not allow deleting other user post', async () => {
      const response = await request(app)
        .delete(`/api/posts/${testPost1.id}`)
        .set('Authorization', `Bearer ${accessToken2}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Post Filtering and Sorting', () => {
    it('should filter posts by author', async () => {
      const response = await request(app)
        .get(`/api/posts?authorId=${testUser1.id}&page=1&limit=10`)
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.data.posts).toBeDefined();
      response.body.data.posts.forEach((post: any) => {
        expect(post.authorId).toBe(testUser1.id);
      });
    });

    it('should filter posts by visibility', async () => {
      const response = await request(app)
        .get('/api/posts?visibility=public&page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(200);
      response.body.data.posts.forEach((post: any) => {
        expect(post.visibility).toBe('public');
      });
    });

    it('should search posts by content', async () => {
      const response = await request(app)
        .get('/api/posts?search=test&page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.data.posts).toBeDefined();
    });

    it('should sort posts by newest', async () => {
      const response = await request(app)
        .get('/api/posts?sortBy=newest&page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(200);
      const posts = response.body.data.posts;
      if (posts.length > 1) {
        expect(new Date(posts[0].createdAt).getTime()).toBeGreaterThanOrEqual(
          new Date(posts[1].createdAt).getTime()
        );
      }
    });

    it('should sort posts by oldest', async () => {
      const response = await request(app)
        .get('/api/posts?sortBy=oldest&page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(200);
      const posts = response.body.data.posts;
      if (posts.length > 1) {
        expect(new Date(posts[0].createdAt).getTime()).toBeLessThanOrEqual(
          new Date(posts[1].createdAt).getTime()
        );
      }
    });
  });

  describe('Post Visibility', () => {
    it('should show public posts to everyone', async () => {
      // Create a new public post for this test (testPost1 was updated to private)
      const createResponse = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({
          content: 'Public post for visibility test',
          visibility: 'public',
        });

      const publicPostId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/posts/${publicPostId}`)
        .set('Authorization', `Bearer ${accessToken2}`);

      expect(response.status).toBe(200);
      expect(response.body.data.visibility).toBe('public');
    });

    it('should not show private posts to non-author', async () => {
      const response = await request(app)
        .get(`/api/posts/${testPost2.id}`)
        .set('Authorization', `Bearer ${accessToken2}`);

      expect(response.status).toBe(404);
    });

    it('should show friends posts to followers', async () => {
      // First, make user2 follow user1 (directly via Prisma since follow endpoint is Phase 5)
      await prisma.follow.create({
        data: {
          followerId: testUser2.id,
          followingId: testUser1.id,
        },
      });

      const response = await request(app)
        .get(`/api/posts/${testPost3.id}`)
        .set('Authorization', `Bearer ${accessToken2}`);

      expect(response.status).toBe(200);

      // Cleanup
      await prisma.follow.deleteMany({
        where: {
          followerId: testUser2.id,
          followingId: testUser1.id,
        },
      });
    });

    it('should not show friends posts to non-followers', async () => {
      // Create a new user who doesn't follow
      const hashedPassword = await hashPassword('Test123!@#');
      const newUser = await prisma.user.create({
        data: {
          email: 'testuser3@example.com',
          username: 'testuser3',
          password: hashedPassword,
          isEmailVerified: true,
        },
      });

      const login = await request(app).post('/api/users/login').send({
        identifier: 'testuser3@example.com',
        password: 'Test123!@#',
      });
      const token = login.body.data.accessToken;

      const response = await request(app)
        .get(`/api/posts/${testPost3.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);

      // Cleanup
      await prisma.user.delete({ where: { id: newUser.id } });
    });
  });

  describe('Post Reporting', () => {
    it('should report a post successfully', async () => {
      const response = await request(app)
        .post(`/api/posts/${testPost1.id}/report`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({
          reason: 'Spam',
          description: 'This post contains spam content',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Post reported successfully');
    });

    it('should not allow duplicate reports', async () => {
      const response = await request(app)
        .post(`/api/posts/${testPost1.id}/report`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({
          reason: 'Spam',
        });

      expect(response.status).toBe(409);
    });

    it('should reject empty reason', async () => {
      const response = await request(app)
        .post(`/api/posts/${testPost1.id}/report`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({
          reason: '',
        });

      expect(response.status).toBe(400);
    });

    it('should reject reason exceeding 200 characters', async () => {
      const longReason = 'a'.repeat(201);
      const response = await request(app)
        .post(`/api/posts/${testPost1.id}/report`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({
          reason: longReason,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Post Pagination', () => {
    it('should return paginated results', async () => {
      const response = await request(app)
        .get('/api/posts?page=1&limit=5')
        .set('Authorization', `Bearer ${accessToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(5);
      expect(response.body.data.totalPages).toBeDefined();
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.posts.length).toBeLessThanOrEqual(5);
    });

    it('should enforce maximum limit', async () => {
      const response = await request(app)
        .get('/api/posts?page=1&limit=100')
        .set('Authorization', `Bearer ${accessToken1}`);

      // Should default to max limit (50 for posts)
      expect(response.status).toBe(400);
    });
  });
});

