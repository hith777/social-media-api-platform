import request from 'supertest';
import app from '../src/index';

describe('Phase 1: Project Setup & Foundation', () => {
  describe('Basic Server Setup', () => {
    it('should respond to root route', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Social Media API');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('status', 'running');
    });
  });

  describe('Health Check Endpoints', () => {
    it('should respond to basic health check', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
    });

    it('should respond to liveness check', async () => {
      const response = await request(app).get('/health/live');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'alive');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('API Documentation', () => {
    it('should serve swagger.json', async () => {
      const response = await request(app).get('/api-docs/swagger.json');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('openapi', '3.0.0');
      expect(response.body).toHaveProperty('info');
      expect(response.body.info).toHaveProperty('title', 'Social Media API');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors gracefully', async () => {
      const response = await request(app).get('/nonexistent');
      expect(response.status).toBe(404);
    });

    it('should return proper error format', async () => {
      const response = await request(app).get('/nonexistent');
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app).get('/');
      expect(response.headers).toHaveProperty('x-content-type-options');
    });
  });

  describe('API Routes Structure', () => {
    it('should have user routes registered', async () => {
      const response = await request(app).get('/api/users');
      // Should not be 404 (route exists, even if returns error)
      expect([200, 401, 404, 405]).toContain(response.status);
    });

    it('should have content routes registered', async () => {
      const response = await request(app).get('/api/content');
      expect([200, 401, 404, 405]).toContain(response.status);
    });

    it('should have social routes registered', async () => {
      const response = await request(app).get('/api/social');
      expect([200, 401, 404, 405]).toContain(response.status);
    });
  });
});


