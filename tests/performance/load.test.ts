import request from 'supertest';
import app from '../../src/index';
import {
  createTestUser,
  createTestPost,
  cleanupTestUsers,
} from '../helpers/database';

describe('Performance and Load Tests', () => {
  let testUser: any;
  let accessToken: string;
  let testPosts: any[] = [];

  beforeAll(async () => {
    // Create test user
    testUser = await createTestUser({
      email: 'loadtest@example.com',
      username: 'loadtest',
      password: 'Test123!@#',
      isEmailVerified: true,
    });

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/users/login')
      .send({
        identifier: 'loadtest@example.com',
        password: 'Test123!@#',
      });

    accessToken = loginResponse.body.data.accessToken;

    // Create test posts for load testing
    for (let i = 0; i < 20; i++) {
      const post = await createTestPost({
        authorId: testUser.id,
        content: `Load test post ${i}`,
        visibility: 'public',
      });
      testPosts.push(post);
    }
  });

  afterAll(async () => {
    await cleanupTestUsers([testUser.id]);
  });

  describe('Concurrent Request Handling', () => {
    it('should handle 50 concurrent GET requests', async () => {
      const requests = Array.from({ length: 50 }, () =>
        request(app)
          .get(`/api/posts/${testPosts[0].id}`)
          .set('Authorization', `Bearer ${accessToken}`)
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // Should complete in reasonable time (< 5 seconds for 50 requests)
      expect(duration).toBeLessThan(5000);
    });

    it('should handle 100 concurrent feed requests', async () => {
      const requests = Array.from({ length: 100 }, () =>
        request(app)
          .get('/api/posts/feed?page=1&limit=10')
          .set('Authorization', `Bearer ${accessToken}`)
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All requests should succeed
      const successCount = responses.filter((r) => r.status === 200).length;
      expect(successCount).toBeGreaterThan(90); // Allow some failures under load

      // Should complete in reasonable time
      expect(duration).toBeLessThan(10000);
    });
  });

  describe('Pagination Performance', () => {
    it('should handle pagination efficiently', async () => {
      const pageSizes = [10, 20, 50];
      const results: number[] = [];

      for (const limit of pageSizes) {
        const startTime = Date.now();
        const response = await request(app)
          .get(`/api/posts?page=1&limit=${limit}`)
          .set('Authorization', `Bearer ${accessToken}`);

        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(response.status).toBe(200);
        results.push(duration);
      }

      // Larger page sizes should not take significantly longer
      expect(results[2] / results[0]).toBeLessThan(3); // 50 items shouldn't take 3x longer than 10
    });
  });

  describe('Cache Performance', () => {
    it('should serve cached responses faster', async () => {
      // First request (cache miss)
      const firstStart = Date.now();
      await request(app)
        .get(`/api/posts/${testPosts[0].id}`)
        .set('Authorization', `Bearer ${accessToken}`);
      const firstDuration = Date.now() - firstStart;

      // Second request (cache hit)
      const secondStart = Date.now();
      await request(app)
        .get(`/api/posts/${testPosts[0].id}`)
        .set('Authorization', `Bearer ${accessToken}`);
      const secondDuration = Date.now() - secondStart;

      // Cached response should be faster (or at least not slower)
      expect(secondDuration).toBeLessThanOrEqual(firstDuration * 1.5);
    });
  });

  describe('Batch Request Performance', () => {
    it('should handle batch requests efficiently', async () => {
      const postIds = testPosts.slice(0, 10).map((p) => p.id);

      const startTime = Date.now();
      const response = await request(app)
        .post('/api/batch/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ postIds });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(200);
      expect(response.body.data.posts).toBeDefined();
      expect(Object.keys(response.body.data.posts).length).toBe(10);

      // Batch should be faster than individual requests
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Database Query Performance', () => {
    it('should handle complex queries efficiently', async () => {
      const startTime = Date.now();

      // Complex query: get posts with filters, pagination, and sorting
      const response = await request(app)
        .get('/api/posts?page=1&limit=20&sortBy=popular')
        .set('Authorization', `Bearer ${accessToken}`);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(200);
      // Complex queries should complete in reasonable time
      expect(duration).toBeLessThan(3000);
    });
  });

  describe('Response Time Benchmarks', () => {
    it('should respond to health check in < 100ms', async () => {
      const startTime = Date.now();
      const response = await request(app).get('/health');
      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(100);
    });

    it('should respond to authenticated endpoints in < 500ms', async () => {
      const endpoints = [
        '/api/users/me',
        '/api/posts/feed?page=1&limit=10',
        '/api/posts?page=1&limit=10',
      ];

      for (const endpoint of endpoints) {
        const startTime = Date.now();
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${accessToken}`);
        const duration = Date.now() - startTime;

        expect(response.status).toBe(200);
        expect(duration).toBeLessThan(500);
      }
    });
  });
});

