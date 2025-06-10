# Social Media API Platform

A comprehensive, production-ready social media and community platform API built with Node.js, TypeScript, Express, PostgreSQL, and Redis.

## Features

-  **Authentication & Authorization**: JWT-based authentication with refresh tokens, email verification, and password reset
-  **Content Management**: Create, update, and delete posts with media support
-  **Comments & Replies**: Nested comment system with pagination
-  **Social Interactions**: Like posts, follow users, and manage relationships
-  **Real-time Notifications**: WebSocket-based notifications for user interactions
-  **Search & Discovery**: Full-text search for posts and users, trending algorithm
-  **Performance Optimized**: Redis caching, connection pooling, query optimization
-  **Production Ready**: Docker support, CI/CD pipelines, error tracking with Sentry
-  **Well Documented**: Complete OpenAPI/Swagger documentation

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Real-time**: Socket.IO
- **Authentication**: JWT
- **File Upload**: Multer with Sharp for image optimization
- **Validation**: Zod
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest, Supertest

## Prerequisites

- Node.js 20 or higher
- PostgreSQL 15 or higher
- Redis 7 or higher
- npm or yarn

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd project-6
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Server
NODE_ENV=development
PORT=3000
CORS_ORIGIN=*

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/social_media

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-at-least-32-characters-long
JWT_REFRESH_SECRET=your-refresh-secret-key-at-least-32-characters-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email (Optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
EMAIL_FROM=noreply@example.com

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Sentry (Optional)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### 4. Set Up Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed database
npm run prisma:seed
```

### 5. Start Redis

```bash
# Using Docker
docker run -d -p 6379:6379 redis:7-alpine

# Or using local Redis
redis-server
```

### 6. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

The API will be available at `http://localhost:3000`

## API Documentation

Once the server is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:3000/api-docs/swagger
- **OpenAPI JSON**: http://localhost:3000/api-docs/swagger.json

## Docker Setup

### Using Docker Compose

```bash
# Start all services (PostgreSQL, Redis, API)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Build Docker Image

```bash
docker build -t social-media-api .
docker run -p 3000:3000 --env-file .env social-media-api
```

## Project Structure

```
project-6/
├── src/
│   ├── config/          # Configuration files (database, redis, logger, etc.)
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── index.ts         # Application entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
├── tests/               # Test files
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   ├── e2e/            # End-to-end tests
│   └── performance/    # Performance tests
├── docs/               # Documentation
├── uploads/            # Uploaded files
└── dist/               # Compiled JavaScript (production)
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `POST /api/users/refresh-token` - Refresh access token

### Users
- `GET /api/users/me` - Get own profile
- `PUT /api/users/me` - Update own profile
- `GET /api/users/:id` - Get user profile
- `GET /api/users/search` - Search users

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/feed` - Get user feed
- `GET /api/posts/:id` - Get post by ID
- `POST /api/posts` - Create post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Comments
- `GET /api/posts/:id/comments` - Get post comments
- `POST /api/posts/:id/comments` - Create comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

### Social
- `POST /api/social/follow/:id` - Follow user
- `DELETE /api/social/follow/:id` - Unfollow user
- `GET /api/social/followers/:id` - Get user followers
- `GET /api/social/following/:id` - Get users following
- `POST /api/social/posts/:id/like` - Like post
- `DELETE /api/social/posts/:id/like` - Unlike post

### Search
- `GET /api/search/posts` - Search posts
- `GET /api/search/users` - Search users
- `GET /api/search/trending` - Get trending posts

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

For complete API documentation, see [API Usage Examples](./docs/API_USAGE_EXAMPLES.md) or visit the Swagger UI.

## Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage
```

## Environment Variables

See [Environment Variables Documentation](./docs/ENVIRONMENT_VARIABLES.md) for a complete list of environment variables.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@example.com or open an issue in the repository.

## Acknowledgments

- Built with [Express.js](https://expressjs.com/)
- Database management with [Prisma](https://www.prisma.io/)
- Real-time features with [Socket.IO](https://socket.io/)

