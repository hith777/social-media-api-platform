# Environment Variables Documentation

This document describes all environment variables used in the Social Media API Platform.

## Required Variables

### Database

#### `DATABASE_URL`
- **Type**: String (URL)
- **Required**: Yes
- **Description**: PostgreSQL database connection string
- **Format**: `postgresql://username:password@host:port/database`
- **Example**: `postgresql://postgres:password@localhost:5432/social_media`
- **Notes**: Used by Prisma ORM for database connections

### Authentication

#### `JWT_SECRET`
- **Type**: String
- **Required**: Yes
- **Description**: Secret key for signing JWT access tokens
- **Minimum Length**: 32 characters
- **Example**: `your-super-secret-key-at-least-32-characters-long`
- **Security**: Must be kept secret and use a strong random string in production

#### `JWT_REFRESH_SECRET`
- **Type**: String
- **Required**: Yes
- **Description**: Secret key for signing JWT refresh tokens
- **Minimum Length**: 32 characters
- **Example**: `your-refresh-secret-key-at-least-32-characters-long`
- **Security**: Should be different from JWT_SECRET

## Optional Variables

### Server Configuration

#### `NODE_ENV`
- **Type**: Enum (`development`, `production`, `test`)
- **Required**: No
- **Default**: `development`
- **Description**: Application environment
- **Example**: `production`
- **Notes**: Affects logging, error handling, and feature flags

#### `PORT`
- **Type**: Number
- **Required**: No
- **Default**: `3000`
- **Description**: Port number for the HTTP server
- **Example**: `3000`
- **Notes**: Must be available and not in use

#### `CORS_ORIGIN`
- **Type**: String
- **Required**: No
- **Default**: `*`
- **Description**: Allowed CORS origins (comma-separated for multiple)
- **Example**: `https://example.com,https://www.example.com`
- **Production**: Should be set to specific domains, not `*`

### Database Configuration

#### `DATABASE_POOL_SIZE`
- **Type**: Number
- **Required**: No
- **Description**: Maximum number of database connections in the pool
- **Example**: `10`
- **Notes**: Helps manage database connection resources

#### `DATABASE_CONNECTION_TIMEOUT`
- **Type**: Number (milliseconds)
- **Required**: No
- **Description**: Timeout for database connection attempts
- **Example**: `5000`
- **Default**: Prisma default

#### `DATABASE_QUERY_TIMEOUT`
- **Type**: Number (milliseconds)
- **Required**: No
- **Description**: Timeout for database queries
- **Example**: `30000`
- **Default**: Prisma default

### Redis Configuration

#### `REDIS_URL`
- **Type**: String (URL)
- **Required**: No
- **Default**: `redis://localhost:6379`
- **Description**: Redis connection string
- **Format**: `redis://host:port` or `redis://password@host:port`
- **Example**: `redis://localhost:6379`
- **Notes**: Used for caching and session storage

### JWT Configuration

#### `JWT_EXPIRES_IN`
- **Type**: String
- **Required**: No
- **Default**: `15m`
- **Description**: Access token expiration time
- **Format**: Time string (e.g., `15m`, `1h`, `7d`)
- **Example**: `15m`
- **Notes**: Shorter times improve security

#### `JWT_REFRESH_EXPIRES_IN`
- **Type**: String
- **Required**: No
- **Default**: `7d`
- **Description**: Refresh token expiration time
- **Format**: Time string (e.g., `7d`, `30d`)
- **Example**: `7d`
- **Notes**: Longer than access token expiry

### Email Configuration (Optional)

#### `SMTP_HOST`
- **Type**: String
- **Required**: No
- **Description**: SMTP server hostname
- **Example**: `smtp.gmail.com`
- **Notes**: Required for email functionality

#### `SMTP_PORT`
- **Type**: Number
- **Required**: No
- **Description**: SMTP server port
- **Example**: `587` (TLS) or `465` (SSL)
- **Notes**: Common ports: 587 (TLS), 465 (SSL), 25 (unencrypted)

#### `SMTP_USER`
- **Type**: String
- **Required**: No
- **Description**: SMTP authentication username
- **Example**: `noreply@example.com`
- **Notes**: Usually the email address

#### `SMTP_PASSWORD`
- **Type**: String
- **Required**: No
- **Description**: SMTP authentication password
- **Example**: `your-smtp-password`
- **Security**: Keep secure, use app-specific passwords

#### `EMAIL_FROM`
- **Type**: String (Email)
- **Required**: No
- **Description**: Default sender email address
- **Example**: `noreply@example.com`
- **Notes**: Must be a valid email address

### File Upload Configuration

#### `MAX_FILE_SIZE`
- **Type**: Number (bytes)
- **Required**: No
- **Default**: `5242880` (5MB)
- **Description**: Maximum file size for uploads
- **Example**: `10485760` (10MB)
- **Notes**: Applies to avatar and post media uploads

#### `UPLOAD_DIR`
- **Type**: String (Path)
- **Required**: No
- **Default**: `uploads`
- **Description**: Directory for storing uploaded files
- **Example**: `uploads`
- **Notes**: Relative to project root

### Rate Limiting Configuration

#### `RATE_LIMIT_WINDOW_MS`
- **Type**: Number (milliseconds)
- **Required**: No
- **Default**: `900000` (15 minutes)
- **Description**: Time window for rate limiting
- **Example**: `900000`
- **Notes**: Window resets after this time

#### `RATE_LIMIT_MAX_REQUESTS`
- **Type**: Number
- **Required**: No
- **Default**: `100`
- **Description**: Maximum requests per window
- **Example**: `100`
- **Notes**: Adjust based on API usage patterns

### Monitoring and Error Tracking

#### `SENTRY_DSN`
- **Type**: String (URL)
- **Required**: No
- **Description**: Sentry DSN for error tracking
- **Format**: `https://key@sentry.io/project-id`
- **Example**: `https://abc123@o123456.ingest.sentry.io/123456`
- **Notes**: Optional, but recommended for production

## Environment-Specific Configurations

### Development

```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=*
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/social_media
REDIS_URL=redis://localhost:6379
JWT_SECRET=development-secret-key-at-least-32-characters-long
JWT_REFRESH_SECRET=development-refresh-secret-key-at-least-32-characters-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Staging

```env
NODE_ENV=staging
PORT=3001
CORS_ORIGIN=https://staging.example.com
DATABASE_URL=postgresql://user:pass@staging-db:5432/social_media_staging
REDIS_URL=redis://staging-redis:6379
JWT_SECRET=staging-secret-key-change-in-production
JWT_REFRESH_SECRET=staging-refresh-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
SENTRY_DSN=https://key@sentry.io/staging-project
```

### Production

```env
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://api.example.com,https://www.example.com
DATABASE_URL=postgresql://user:pass@prod-db:5432/social_media
REDIS_URL=redis://prod-redis:6379
JWT_SECRET=<strong-random-secret-32-chars-min>
JWT_REFRESH_SECRET=<strong-random-secret-32-chars-min>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=<secure-password>
EMAIL_FROM=noreply@example.com
MAX_FILE_SIZE=10485760
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SENTRY_DSN=https://key@sentry.io/production-project
```

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong, random secrets** for JWT keys (minimum 32 characters)
3. **Use different secrets** for different environments
4. **Rotate secrets regularly** in production
5. **Use environment-specific values** for CORS_ORIGIN
6. **Store sensitive values** in secure secret management systems
7. **Use connection strings** with proper authentication
8. **Limit database pool size** to prevent resource exhaustion

## Validation

All environment variables are validated on application startup using Zod schema validation. Invalid or missing required variables will cause the application to exit with an error message.

## Example .env File

Create a `.env` file in the project root:

```env
# Server
NODE_ENV=development
PORT=3000
CORS_ORIGIN=*

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/social_media
DATABASE_POOL_SIZE=10

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-at-least-32-characters-long-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-at-least-32-characters-long-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email (Optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=your-password
EMAIL_FROM=noreply@example.com

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring (Optional)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

## Troubleshooting

### Common Issues

1. **Database connection errors**: Check `DATABASE_URL` format and credentials
2. **Redis connection errors**: Verify `REDIS_URL` and Redis server status
3. **JWT validation errors**: Ensure `JWT_SECRET` is at least 32 characters
4. **CORS errors**: Check `CORS_ORIGIN` matches your frontend domain
5. **Email sending fails**: Verify SMTP credentials and port settings

### Validation Errors

If you see validation errors on startup, check:
- Required variables are set
- String lengths meet minimum requirements
- URLs are properly formatted
- Numbers are valid integers
- Enums match allowed values

