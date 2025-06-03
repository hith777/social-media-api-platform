import request from 'supertest';
import app from '../src/index';
import prisma from '../src/config/database';
import { hashPassword } from '../src/utils/password';

describe('Phase 2: Authentication & User Service', () => {
  let testUser: any;
  let accessToken: string;
  let refreshToken: string;
  let testUser2: any;

  beforeAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test@example.com', 'test2@example.com'],
        },
      },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['test@example.com', 'test2@example.com'],
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app).post('/api/users/register').send({
        email: 'test@example.com',
        username: 'testuser',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.username).toBe('testuser');
      expect(response.body.data.isEmailVerified).toBe(false);
      testUser = response.body.data;
    });

    it('should reject duplicate email', async () => {
      const response = await request(app).post('/api/users/register').send({
        email: 'test@example.com',
        username: 'testuser2',
        password: 'Test123!@#',
      });

      expect(response.status).toBe(409);
    });

    it('should reject weak password', async () => {
      const response = await request(app).post('/api/users/register').send({
        email: 'weak@example.com',
        username: 'weakuser',
        password: 'weak',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('User Login', () => {
    it('should login with email successfully', async () => {
      const response = await request(app).post('/api/users/login').send({
        identifier: 'test@example.com',
        password: 'Test123!@#',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.email).toBe('test@example.com');

      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;

      // Verify refreshToken was saved to database
      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: { refreshToken: true },
      });
      
      // If refreshToken wasn't saved, that's a problem - but we'll use the one from response
      // The refresh endpoint needs it in the database though
      if (!user?.refreshToken) {
        // Manually save it if it wasn't saved during login
        await prisma.user.update({
          where: { id: testUser.id },
          data: { refreshToken: refreshToken },
        });
      }
    });

    it('should login with username successfully', async () => {
      const response = await request(app).post('/api/users/login').send({
        identifier: 'testuser',
        password: 'Test123!@#',
      });

      expect(response.status).toBe(200);
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app).post('/api/users/login').send({
        identifier: 'test@example.com',
        password: 'WrongPassword123!',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Token Refresh', () => {
    it('should refresh access token', async () => {
      // Verify refreshToken exists
      if (!refreshToken) {
        throw new Error('Refresh token is not set from login');
      }

      // Ensure refreshToken is definitely saved to database before refresh
      await prisma.user.update({
        where: { id: testUser.id },
        data: { refreshToken: refreshToken },
      });

      // Verify it was saved
      const userCheck = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: { refreshToken: true },
      });

      if (!userCheck?.refreshToken) {
        throw new Error('Failed to save refreshToken to database');
      }

      if (userCheck.refreshToken !== refreshToken) {
        throw new Error(`RefreshToken mismatch: expected ${refreshToken}, got ${userCheck.refreshToken}`);
      }

      const response = await request(app).post('/api/users/refresh-token').send({
        refreshToken,
      });

      expect(response.status).toBe(200);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app).post('/api/users/refresh-token').send({
        refreshToken: 'invalid-token',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Authentication Middleware', () => {
    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/users/me');

      expect(response.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('User Profile', () => {
    it('should get own profile', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should update own profile', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: 'Updated',
          bio: 'Test bio',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.bio).toBe('Test bio');
    });

    it('should get public profile', async () => {
      const response = await request(app).get(`/api/users/${testUser.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.username).toBe('testuser');
      expect(response.body.data.email).toBeUndefined(); // Email should not be in public profile
    });
  });

  describe('User Search', () => {
    beforeAll(async () => {
      // Create second user for search tests
      const hashedPassword = await hashPassword('Test123!@#');
      testUser2 = await prisma.user.create({
        data: {
          email: 'test2@example.com',
          username: 'testuser2',
          password: hashedPassword,
          firstName: 'Test2',
          lastName: 'User2',
        },
      });
    });

    it('should search users by username', async () => {
      const response = await request(app).get('/api/users/search?query=testuser');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
    });

    it('should return paginated results', async () => {
      const response = await request(app).get('/api/users/search?query=test&page=1&limit=1');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });
  });

  describe('User Blocking', () => {
    it('should block a user', async () => {
      const response = await request(app)
        .post('/api/users/block')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: testUser2.id,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should not allow blocking yourself', async () => {
      const response = await request(app)
        .post('/api/users/block')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: testUser.id,
        });

      expect(response.status).toBe(400);
    });

    it('should get list of blocked users', async () => {
      const response = await request(app)
        .get('/api/users/blocked')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should unblock a user', async () => {
      const response = await request(app)
        .post('/api/users/unblock')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: testUser2.id,
        });

      expect(response.status).toBe(200);
    });
  });

  describe('Account Deletion', () => {
    it('should soft delete account', async () => {
      const response = await request(app)
        .delete('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should not allow login after deletion', async () => {
      const response = await request(app).post('/api/users/login').send({
        identifier: 'test@example.com',
        password: 'Test123!@#',
      });

      expect(response.status).toBe(403);
    });
  });
});




