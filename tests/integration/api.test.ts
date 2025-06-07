import request from 'supertest';
import app from '../../src/index';
import prisma from '../../src/config/database';
import { hashPassword } from '../../src/utils/password';

describe('API Integration Tests', () => {
  let testUser: any;
  let accessToken: string;
  let refreshToken: string;
  let testPost: any;

  beforeAll(async () => {
    // Clean up existing test data (get user IDs first)
    const existingUsers = await prisma.user.findMany({
      where: {
        email: { in: ['apitest@example.com', 'apitest2@example.com'] },
      },
      select: { id: true },
    });
    const userIds = existingUsers.map(u => u.id);

    if (userIds.length > 0) {
      // Delete related data first (order matters for foreign key constraints)
      await prisma.comment.deleteMany({
        where: {
          OR: [
            { authorId: { in: userIds } },
            { post: { authorId: { in: userIds } } },
          ],
        },
      });

      await prisma.like.deleteMany({
        where: {
          OR: [
            { userId: { in: userIds } },
            { post: { authorId: { in: userIds } } },
            { comment: { authorId: { in: userIds } } },
          ],
        },
      });

      await prisma.follow.deleteMany({
        where: {
          OR: [
            { followerId: { in: userIds } },
            { followingId: { in: userIds } },
          ],
        },
      });

      await prisma.block.deleteMany({
        where: {
          OR: [
            { blockerId: { in: userIds } },
            { blockedId: { in: userIds } },
          ],
        },
      });

      await prisma.notification.deleteMany({
        where: { userId: { in: userIds } },
      });

      await prisma.post.deleteMany({
        where: { authorId: { in: userIds } },
      });

      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }

    // Create test user
    const hashedPassword = await hashPassword('Test123!@#');
    testUser = await prisma.user.create({
      data: {
        email: 'apitest@example.com',
        username: 'apitest',
        password: hashedPassword,
        firstName: 'API',
        lastName: 'Test',
        isEmailVerified: true,
      },
    });
  });

  afterAll(async () => {
    // Get user IDs for cleanup
    const usersToDelete = await prisma.user.findMany({
      where: {
        email: { in: ['apitest@example.com', 'apitest2@example.com'] },
      },
      select: { id: true },
    });
    const userIds = usersToDelete.map(u => u.id);

    if (userIds.length > 0) {
      // Delete related data first (order matters for foreign key constraints)
      await prisma.comment.deleteMany({
        where: {
          OR: [
            { authorId: { in: userIds } },
            { post: { authorId: { in: userIds } } },
          ],
        },
      });

      await prisma.like.deleteMany({
        where: {
          OR: [
            { userId: { in: userIds } },
            { post: { authorId: { in: userIds } } },
            { comment: { authorId: { in: userIds } } },
          ],
        },
      });

      await prisma.follow.deleteMany({
        where: {
          OR: [
            { followerId: { in: userIds } },
            { followingId: { in: userIds } },
          ],
        },
      });

      await prisma.block.deleteMany({
        where: {
          OR: [
            { blockerId: { in: userIds } },
            { blockedId: { in: userIds } },
          ],
        },
      });

      await prisma.notification.deleteMany({
        where: { userId: { in: userIds } },
      });

      await prisma.post.deleteMany({
        where: { authorId: { in: userIds } },
      });

      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }
  });

  describe('Authentication Endpoints', () => {
    describe('POST /api/users/register', () => {
      it('should register a new user', async () => {
        const response = await request(app)
          .post('/api/users/register')
          .send({
            email: 'apitest2@example.com',
            username: 'apitest2',
            password: 'Test123!@#',
            firstName: 'API',
            lastName: 'Test2',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.email).toBe('apitest2@example.com');
        expect(response.body.data.username).toBe('apitest2');
        expect(response.body.data.password).toBeUndefined();
      });

      it('should reject duplicate email', async () => {
        const response = await request(app)
          .post('/api/users/register')
          .send({
            email: 'apitest@example.com',
            username: 'newuser',
            password: 'Test123!@#',
          });

        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
      });

      it('should reject weak password', async () => {
        const response = await request(app)
          .post('/api/users/register')
          .send({
            email: 'newuser@example.com',
            username: 'newuser',
            password: 'weak',
          });

        expect(response.status).toBe(400);
      });
    });

    describe('POST /api/users/login', () => {
      it('should login with email', async () => {
        const response = await request(app)
          .post('/api/users/login')
          .send({
            identifier: 'apitest@example.com',
            password: 'Test123!@#',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.accessToken).toBeDefined();
        expect(response.body.data.refreshToken).toBeDefined();
        expect(response.body.data.user).toBeDefined();

        accessToken = response.body.data.accessToken;
        refreshToken = response.body.data.refreshToken;
      });

      it('should login with username', async () => {
        const response = await request(app)
          .post('/api/users/login')
          .send({
            identifier: 'apitest',
            password: 'Test123!@#',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should reject invalid credentials', async () => {
        const response = await request(app)
          .post('/api/users/login')
          .send({
            identifier: 'apitest@example.com',
            password: 'WrongPassword123!@#',
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/users/refresh-token', () => {
      it('should refresh access token', async () => {
        const response = await request(app)
          .post('/api/users/refresh-token')
          .send({
            refreshToken,
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.accessToken).toBeDefined();
      });

      it('should reject invalid refresh token', async () => {
        const response = await request(app)
          .post('/api/users/refresh-token')
          .send({
            refreshToken: 'invalid-token',
          });

        expect(response.status).toBe(401);
      });
    });
  });

  describe('User Profile Endpoints', () => {
    describe('GET /api/users/me', () => {
      it('should get own profile', async () => {
        const response = await request(app)
          .get('/api/users/me')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(testUser.id);
        expect(response.body.data.email).toBe(testUser.email);
      });

      it('should require authentication', async () => {
        const response = await request(app)
          .get('/api/users/me');

        expect(response.status).toBe(401);
      });
    });

    describe('PUT /api/users/me', () => {
      it('should update own profile', async () => {
        const response = await request(app)
          .put('/api/users/me')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            firstName: 'Updated',
            lastName: 'Name',
            bio: 'Updated bio',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.firstName).toBe('Updated');
        expect(response.body.data.bio).toBe('Updated bio');
      });
    });

    describe('GET /api/users/:id', () => {
      it('should get user profile by ID', async () => {
        const response = await request(app)
          .get(`/api/users/${testUser.id}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(testUser.id);
      });
    });
  });

  describe('Post Endpoints', () => {
    describe('POST /api/posts', () => {
      it('should create a post', async () => {
        const response = await request(app)
          .post('/api/posts')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            content: 'Integration test post',
            visibility: 'public',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.content).toBe('Integration test post');
        expect(response.body.data.authorId).toBe(testUser.id);

        testPost = response.body.data;
      });

      it('should require authentication', async () => {
        const response = await request(app)
          .post('/api/posts')
          .send({
            content: 'Test post',
          });

        expect(response.status).toBe(401);
      });

      it('should reject empty content', async () => {
        const response = await request(app)
          .post('/api/posts')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            content: '   ',
          });

        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/posts/:id', () => {
      it('should get a post by ID', async () => {
        const response = await request(app)
          .get(`/api/posts/${testPost.id}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(testPost.id);
        expect(response.body.data.content).toBe('Integration test post');
      });

      it('should return 404 for non-existent post', async () => {
        const response = await request(app)
          .get('/api/posts/non-existent-id')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(404);
      });
    });

    describe('GET /api/posts', () => {
      it('should get posts list', async () => {
        const response = await request(app)
          .get('/api/posts?page=1&limit=10')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.posts).toBeInstanceOf(Array);
        expect(response.body.data.page).toBe(1);
        expect(response.body.data.limit).toBe(10);
      });
    });

    describe('PUT /api/posts/:id', () => {
      it('should update own post', async () => {
        const response = await request(app)
          .put(`/api/posts/${testPost.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            content: 'Updated post content',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.content).toBe('Updated post content');
      });

      it('should require authentication', async () => {
        const response = await request(app)
          .put(`/api/posts/${testPost.id}`)
          .send({
            content: 'Updated',
          });

        expect(response.status).toBe(401);
      });
    });

    describe('DELETE /api/posts/:id', () => {
      it('should delete own post', async () => {
        const postToDelete = await request(app)
          .post('/api/posts')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            content: 'Post to be deleted',
          });

        const response = await request(app)
          .delete(`/api/posts/${postToDelete.body.data.id}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Comment Endpoints', () => {
    describe('POST /api/posts/:id/comments', () => {
      it('should create a comment', async () => {
        const response = await request(app)
          .post(`/api/posts/${testPost.id}/comments`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            content: 'Test comment',
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.content).toBe('Test comment');
        expect(response.body.data.postId).toBe(testPost.id);
      });

      it('should require authentication', async () => {
        const response = await request(app)
          .post(`/api/posts/${testPost.id}/comments`)
          .send({
            content: 'Test comment',
          });

        expect(response.status).toBe(401);
      });
    });

    describe('GET /api/posts/:id/comments', () => {
      it('should get post comments', async () => {
        const response = await request(app)
          .get(`/api/posts/${testPost.id}/comments`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.comments).toBeInstanceOf(Array);
      });
    });
  });

  describe('Social Endpoints', () => {
    let otherUser: any;
    let otherUserToken: string;

    beforeAll(async () => {
      const hashedPassword = await hashPassword('Test123!@#');
      otherUser = await prisma.user.create({
        data: {
          email: 'otheruser@example.com',
          username: 'otheruser',
          password: hashedPassword,
          isEmailVerified: true,
        },
      });

      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          identifier: 'otheruser@example.com',
          password: 'Test123!@#',
        });

      otherUserToken = loginResponse.body.data.accessToken;
    });

    afterAll(async () => {
      const userToDelete = await prisma.user.findUnique({
        where: { email: 'otheruser@example.com' },
        select: { id: true },
      });

      if (userToDelete) {
        // Delete related data first (order matters for foreign key constraints)
        await prisma.comment.deleteMany({
          where: {
            OR: [
              { authorId: userToDelete.id },
              { post: { authorId: userToDelete.id } },
            ],
          },
        });

        await prisma.like.deleteMany({
          where: {
            OR: [
              { userId: userToDelete.id },
              { post: { authorId: userToDelete.id } },
              { comment: { authorId: userToDelete.id } },
            ],
          },
        });

        await prisma.follow.deleteMany({
          where: {
            OR: [
              { followerId: userToDelete.id },
              { followingId: userToDelete.id },
            ],
          },
        });

        await prisma.block.deleteMany({
          where: {
            OR: [
              { blockerId: userToDelete.id },
              { blockedId: userToDelete.id },
            ],
          },
        });

        await prisma.notification.deleteMany({
          where: { userId: userToDelete.id },
        });

        await prisma.post.deleteMany({
          where: { authorId: userToDelete.id },
        });

        await prisma.user.deleteMany({
          where: { id: userToDelete.id },
        });
      }
    });

    describe('POST /api/social/follow/:userId', () => {
      it('should follow a user', async () => {
        const response = await request(app)
          .post(`/api/social/follow/${otherUser.id}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should reject self-follow', async () => {
        const response = await request(app)
          .post(`/api/social/follow/${testUser.id}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/social/followers/:userId', () => {
      it('should get user followers', async () => {
        const response = await request(app)
          .get(`/api/social/followers/${otherUser.id}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.followers).toBeInstanceOf(Array);
      });
    });

    describe('POST /api/social/posts/:postId/like', () => {
      it('should like a post', async () => {
        const response = await request(app)
          .post(`/api/social/posts/${testPost.id}/like`)
          .set('Authorization', `Bearer ${otherUserToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});

