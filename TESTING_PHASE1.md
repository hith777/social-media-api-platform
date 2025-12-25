# Phase 1 Testing Guide

## Overview
Phase 1 includes 15 commits covering project setup and foundation. This document outlines what has been built and how to test it.

## What Was Built

### ✅ Commit 1: Initialize project with TypeScript and ESLint
- TypeScript configuration with strict mode
- ESLint with TypeScript plugin
- Prettier for code formatting
- Package.json with all dependencies

### ✅ Commit 2: Set up Express server with basic middleware
- Express application setup
- CORS configuration
- Body parsing middleware
- Compression middleware
- Environment configuration

### ✅ Commit 3: Configure Prisma with PostgreSQL
- Prisma schema file
- Database connection module
- Prisma scripts in package.json

### ✅ Commit 4: Set up Docker and Docker Compose
- Multi-stage Dockerfile
- Docker Compose with PostgreSQL, Redis, and app services
- Health checks for services

### ✅ Commit 5: Create database schema foundation
- User model
- Post model
- Comment model
- Like model
- Follow model
- Notification model

### ✅ Commit 6: Add environment configuration management
- Zod schema validation for environment variables
- Type-safe environment configuration
- Validation on startup

### ✅ Commit 7: Set up logging with Winston
- File-based logging (error.log, combined.log)
- Console logging with colors
- Log rotation configuration
- Exception and rejection handlers

### ✅ Commit 8: Implement error handling middleware
- Custom AppError class
- Zod error handling
- Prisma error handling
- Async handler wrapper

### ✅ Commit 9: Add request validation with Zod
- Validation middleware
- Common validation schemas
- Helper functions for body/query/params validation

### ✅ Commit 10: Set up API rate limiting
- General API rate limiter
- Auth-specific rate limiter
- Upload rate limiter
- Configurable limits

### ✅ Commit 11: Configure CORS and security headers
- Enhanced Helmet configuration
- Flexible CORS with origin validation
- Security headers (CSP, HSTS, XSS protection)

### ✅ Commit 12: Add health check endpoints
- `/health` - Basic health check
- `/health/detailed` - Detailed with service status
- `/health/ready` - Readiness probe
- `/health/live` - Liveness probe

### ✅ Commit 13: Set up Redis for caching
- Redis client configuration
- Cache helper functions
- JSON serialization helpers
- Connection management

### ✅ Commit 14: Create project structure
- Service layer structure
- Controller placeholders
- Route files
- Common TypeScript types

### ✅ Commit 15: Add initial API documentation setup
- Swagger/OpenAPI setup
- Swagger UI at `/api-docs/swagger`
- API spec at `/api-docs/swagger.json`

## Testing Instructions

### Prerequisites
1. Install Node.js (v20 or higher)
2. Install Docker and Docker Compose (optional, for full testing)
3. Or install PostgreSQL and Redis locally

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Environment
Create a `.env` file:
```bash
NODE_ENV=development
PORT=3000
CORS_ORIGIN=*
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/social_media
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-that-is-at-least-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-key-that-is-at-least-32-characters-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 3: Start Services (Option A - Docker)
```bash
docker-compose up -d
```

### Step 3: Start Services (Option B - Local)
- Start PostgreSQL
- Start Redis

### Step 4: Generate Prisma Client
```bash
npm run prisma:generate
```

### Step 5: Run Database Migrations
```bash
npm run prisma:migrate
```

### Step 6: Build the Project
```bash
npm run build
```

### Step 7: Start the Server
```bash
npm run dev
# or
npm start
```

## Manual Testing Checklist

### ✅ Basic Server
- [ ] Server starts without errors
- [ ] Root route (`GET /`) returns API info
- [ ] Server logs show startup message

### ✅ Health Checks
- [ ] `GET /health` returns 200 with status "ok"
- [ ] `GET /health/live` returns 200 with status "alive"
- [ ] `GET /health/ready` returns 200 (if DB/Redis connected) or 503 (if not)
- [ ] `GET /health/detailed` returns service status

### ✅ API Documentation
- [ ] `GET /api-docs/swagger` shows Swagger UI
- [ ] `GET /api-docs/swagger.json` returns OpenAPI spec
- [ ] Swagger UI displays API information correctly

### ✅ Error Handling
- [ ] Invalid route returns 404
- [ ] Error response has proper format: `{ success: false, message: "..." }`
- [ ] Errors are logged to console/files

### ✅ Security Headers
- [ ] Response includes `X-Content-Type-Options: nosniff`
- [ ] Response includes security headers from Helmet
- [ ] CORS headers are present

### ✅ Rate Limiting
- [ ] Multiple rapid requests trigger rate limit (429)
- [ ] Rate limit headers are present
- [ ] Rate limit message is clear

### ✅ API Routes Structure
- [ ] `GET /api/users` route exists (may return 404/405, but route is registered)
- [ ] `GET /api/content` route exists
- [ ] `GET /api/social` route exists

### ✅ Logging
- [ ] Logs appear in console (development mode)
- [ ] Error logs are written to `logs/error.log`
- [ ] Combined logs are written to `logs/combined.log`

## Automated Testing

Run the test suite:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Expected Results

### ✅ All Tests Should Pass
- Basic server setup
- Health check endpoints
- API documentation
- Error handling
- Security headers
- Route registration

### ✅ Server Should Start Successfully
- No TypeScript compilation errors
- No runtime errors
- All middleware loaded correctly

### ✅ Logs Should Show
- Server startup message
- Port number
- Environment mode

## Troubleshooting

### Issue: "Cannot find module" errors
**Solution**: Run `npm install` to install dependencies

### Issue: Database connection errors
**Solution**: 
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Run `npm run prisma:migrate`

### Issue: Redis connection errors
**Solution**:
- Ensure Redis is running
- Check REDIS_URL in .env
- Redis errors won't prevent server from starting (health check will show "disconnected")

### Issue: Environment validation errors
**Solution**: 
- Ensure all required env vars are set
- JWT_SECRET and JWT_REFRESH_SECRET must be at least 32 characters

## Next Steps

After Phase 1 testing is complete:
1. Fix any issues found
2. Proceed to Phase 2: Authentication & User Service
3. Continue with remaining phases

## Summary

Phase 1 establishes a solid foundation with:
- ✅ TypeScript setup
- ✅ Express server with middleware
- ✅ Database configuration
- ✅ Docker setup
- ✅ Error handling
- ✅ Logging
- ✅ Security
- ✅ API documentation
- ✅ Project structure

All foundation pieces are in place for building the social media API features in subsequent phases.

