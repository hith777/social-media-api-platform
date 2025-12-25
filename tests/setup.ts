// Test setup file
// This file runs before all tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.CORS_ORIGIN = '*';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/social_media_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long-for-testing';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-that-is-at-least-32-characters-long-for-testing';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX_REQUESTS = '100';

// Increase timeout for tests that might need to connect to services
jest.setTimeout(10000);

