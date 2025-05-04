// Test setup file
// This file runs before all tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.CORS_ORIGIN = '*';
// Use the same database as development (tests clean up after themselves)
// In production, use a separate test database
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://hitheshk@localhost:5432/social_media';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long-for-testing';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-that-is-at-least-32-characters-long-for-testing';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX_REQUESTS = '100';

// Increase timeout for tests that might need to connect to services
jest.setTimeout(10000);


