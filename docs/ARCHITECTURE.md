# Architecture Documentation

## Overview

The Social Media API Platform is built using a layered architecture pattern with clear separation of concerns. The system follows RESTful principles and implements microservices-ready patterns for scalability.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Applications                      │
│              (Web, Mobile, Third-party APIs)                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTP/WebSocket
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    API Gateway Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Express    │  │   Socket.IO  │  │   Security   │      │
│  │   Server     │  │   Server     │  │  Middleware  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
│   Routes      │ │ Middleware  │ │ Controllers │
│   Layer       │ │   Layer     │ │   Layer     │
└───────┬───────┘ └──────┬──────┘ └─────┬───────┘
        │                │               │
        └───────────────┼───────────────┘
                        │
                ┌───────▼───────┐
                │  Services     │
                │    Layer      │
                └───────┬───────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
│  PostgreSQL   │ │    Redis    │ │  File      │
│   Database    │ │    Cache    │ │  Storage   │
└───────────────┘ └─────────────┘ └────────────┘
```

## Architecture Layers

### 1. Presentation Layer (Routes)

**Location**: `src/routes/`

**Responsibility**: Define API endpoints and route HTTP requests to appropriate controllers.

**Key Components**:
- `userRoutes.ts` - User and authentication endpoints
- `contentRoutes.ts` - Post management endpoints
- `commentRoutes.ts` - Comment endpoints
- `socialRoutes.ts` - Social interaction endpoints
- `searchRoutes.ts` - Search and discovery endpoints
- `notificationRoutes.ts` - Notification endpoints
- `batchRoutes.ts` - Batch request endpoints

**Pattern**: RESTful routing with clear separation of concerns.

### 2. Middleware Layer

**Location**: `src/middleware/`

**Responsibility**: Cross-cutting concerns like authentication, validation, error handling, and request processing.

**Key Components**:
- `auth.ts` - JWT authentication and authorization
- `validator.ts` - Request validation using Zod
- `errorHandler.ts` - Centralized error handling
- `rateLimiter.ts` - Rate limiting for API protection
- `compression.ts` - Response compression
- `upload.ts` - File upload handling
- `batchHandler.ts` - Batch request processing

**Pattern**: Chain of Responsibility pattern for middleware execution.

### 3. Controller Layer

**Location**: `src/controllers/`

**Responsibility**: Handle HTTP requests, validate input, call services, and format responses.

**Key Components**:
- `userController.ts` - User-related operations
- `contentController.ts` - Post operations
- `socialController.ts` - Social interaction operations
- `searchController.ts` - Search operations
- `notificationController.ts` - Notification operations
- `batchController.ts` - Batch operations

**Pattern**: Thin controllers that delegate business logic to services.

### 4. Service Layer

**Location**: `src/services/`

**Responsibility**: Business logic, data processing, and orchestration of multiple operations.

**Key Components**:
- `user/userService.ts` - User management and authentication logic
- `content/contentService.ts` - Post and content management
- `social/socialService.ts` - Follow, like, and social interactions
- `search/searchService.ts` - Search and trending algorithms
- `notification/notificationService.ts` - Notification management
- `batch/batchService.ts` - Batch operation processing
- `email/emailService.ts` - Email sending

**Pattern**: Service-oriented architecture with single responsibility principle.

### 5. Data Access Layer

**Location**: `src/config/database.ts`, Prisma ORM

**Responsibility**: Database operations, query optimization, and data persistence.

**Key Components**:
- Prisma Client - Type-safe database access
- Connection pooling - Efficient database connections
- Query optimization - N+1 query prevention

**Pattern**: Repository pattern via Prisma ORM.

## Data Flow

### Request Flow

```
1. Client Request
   ↓
2. Express Server (Security Middleware)
   ↓
3. Route Handler
   ↓
4. Authentication Middleware
   ↓
5. Validation Middleware
   ↓
6. Controller
   ↓
7. Service Layer
   ↓
8. Data Access Layer (Prisma)
   ↓
9. Database/Redis
   ↓
10. Response (through middleware chain)
```

### Example: Creating a Post

```
POST /api/posts
  ↓
[Security Middleware] - CORS, Helmet
  ↓
[Rate Limiter] - Check rate limits
  ↓
[Authentication] - Verify JWT token
  ↓
[Validation] - Validate request body
  ↓
contentController.createPost()
  ↓
contentService.createPost()
  ↓
[Cache Check] - Redis
  ↓
[Database] - Prisma create
  ↓
[Cache Update] - Redis
  ↓
[WebSocket] - Emit notification
  ↓
Response to Client
```

## Database Schema

### Core Entities

**Users**
- Authentication and profile information
- Email verification status
- Soft delete support

**Posts**
- Content and media URLs
- Visibility settings (public, private, friends)
- Soft delete support
- Author relationship

**Comments**
- Nested comment support (parent-child relationship)
- Post relationship
- Soft delete support

**Follows**
- Many-to-many relationship between users
- Timestamps for relationship creation

**Likes**
- Polymorphic relationship (posts and comments)
- User relationship

**Notifications**
- Various notification types
- Read/unread status
- User relationship

**Blocks**
- User blocking functionality
- Bidirectional blocking support

## Caching Strategy

### Redis Cache Usage

**Cache Keys Pattern**:
- `post:{postId}:{userId}` - Individual post data
- `feed:{userId}:{page}:{limit}` - User feed
- `user:{userId}` - User profile data
- `followers:{userId}:{page}:{limit}` - Followers list
- `following:{userId}:{page}:{limit}` - Following list
- `search:{type}:{query}:{page}:{limit}` - Search results
- `trending:{timeRange}:{page}:{limit}` - Trending posts

**Cache TTL**:
- Post data: 5 minutes
- Feed data: 2 minutes
- User profiles: 10 minutes
- Search results: 5 minutes
- Trending posts: 15 minutes

**Cache Invalidation**:
- On create/update/delete operations
- Pattern-based invalidation for related data

## Security Architecture

### Authentication Flow

```
1. User Registration/Login
   ↓
2. Generate JWT Access Token (15min expiry)
   ↓
3. Generate JWT Refresh Token (7 days expiry)
   ↓
4. Store refresh token in database
   ↓
5. Client stores both tokens
   ↓
6. Access token used for API requests
   ↓
7. On expiry, use refresh token to get new access token
```

### Authorization

- Role-based access control (RBAC) ready
- Resource ownership validation
- Visibility-based access control for posts
- Blocked user filtering

### Security Measures

- Helmet.js for HTTP headers
- CORS configuration
- Rate limiting
- Input validation (Zod)
- SQL injection prevention (Prisma)
- XSS protection
- Password hashing (bcrypt)
- JWT token security

## Real-time Communication

### WebSocket Architecture

**Technology**: Socket.IO

**Use Cases**:
- Real-time notifications
- Live updates for likes, comments, follows

**Connection Flow**:
```
1. Client connects to /socket.io
   ↓
2. Server authenticates via JWT
   ↓
3. Join user-specific room
   ↓
4. Listen for events
   ↓
5. Server emits events to user room
   ↓
6. Client receives and displays notification
```

## Performance Optimizations

### Database Optimizations

1. **Connection Pooling**: Prisma connection pool configuration
2. **Query Optimization**: Batch queries to prevent N+1 problems
3. **Indexing**: Database indexes on frequently queried fields
4. **Pagination**: Efficient pagination for large datasets

### Caching Strategy

1. **Redis Caching**: Frequently accessed data
2. **Cache Warming**: Pre-load hot data
3. **Cache Invalidation**: Smart invalidation on updates

### Application Optimizations

1. **Response Compression**: Gzip compression for large responses
2. **Image Optimization**: Sharp for image resizing and format conversion
3. **Batch Requests**: Combine multiple requests into one
4. **Lazy Loading**: Load data on demand

## Scalability Considerations

### Horizontal Scaling

- Stateless API design
- Redis for shared state
- Database connection pooling
- Load balancer ready

### Vertical Scaling

- Efficient memory usage
- Connection pooling
- Query optimization
- Caching strategy

### Future Microservices Migration

The current architecture is designed to be easily split into microservices:

- **User Service**: Authentication and user management
- **Content Service**: Posts and comments
- **Social Service**: Follows, likes, relationships
- **Notification Service**: Real-time notifications
- **Search Service**: Search and discovery
- **Analytics Service**: Metrics and analytics

## Error Handling

### Error Types

1. **Validation Errors** (400): Invalid input data
2. **Authentication Errors** (401): Missing or invalid token
3. **Authorization Errors** (403): Insufficient permissions
4. **Not Found Errors** (404): Resource not found
5. **Conflict Errors** (409): Duplicate entries
6. **Server Errors** (500): Unexpected errors

### Error Flow

```
Error Occurs
  ↓
Error Handler Middleware
  ↓
Log Error (Winston)
  ↓
Send to Sentry (if configured)
  ↓
Format Error Response
  ↓
Return to Client
```

## Monitoring and Observability

### Logging

- **Winston Logger**: Structured logging
- **Log Levels**: Error, Warn, Info, Debug
- **Log Files**: Separate files for errors and combined logs

### Error Tracking

- **Sentry Integration**: Production error tracking
- **Error Context**: Request details, user info, stack traces

### Health Checks

- `/health` - Basic health check
- `/health/live` - Liveness probe
- `/health/detailed` - Detailed system status

## Deployment Architecture

### Development

- Local PostgreSQL and Redis
- Hot reload with tsx
- Development environment variables

### Staging

- Docker Compose setup
- Separate database
- Staging environment variables

### Production

- Docker containers
- Production database
- Load balancer
- CDN for static assets
- Monitoring and alerting

## API Design Principles

1. **RESTful**: Follow REST conventions
2. **Stateless**: No server-side session state
3. **Versioning**: Ready for API versioning
4. **Pagination**: All list endpoints support pagination
5. **Filtering**: Search and filter capabilities
6. **Sorting**: Multiple sort options
7. **Error Handling**: Consistent error responses
8. **Documentation**: OpenAPI/Swagger documentation

## Testing Strategy

### Test Types

1. **Unit Tests**: Service and utility functions
2. **Integration Tests**: API endpoint testing
3. **E2E Tests**: Complete user flows
4. **Performance Tests**: Load and stress testing

### Test Coverage

- Target: 70% code coverage
- Critical paths: 100% coverage
- Service layer: High coverage
- Controllers: Integration test coverage

## Future Enhancements

1. **GraphQL API**: Alternative to REST
2. **Message Queue**: Bull/Redis for background jobs
3. **Microservices**: Split into separate services
4. **API Gateway**: Centralized API management
5. **CDN Integration**: Media file delivery
6. **Analytics**: User behavior tracking
7. **Recommendation Engine**: Content recommendations

