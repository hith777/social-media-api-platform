# Environment Setup Guide

## Quick Setup

The `.env` file has been created with default development values. Here's what you need to know:

## Required Variables

### ✅ Already Configured (Default Values)
- `NODE_ENV=development`
- `PORT=3000`
- `CORS_ORIGIN=*`
- `DATABASE_URL` - Set for local PostgreSQL
- `REDIS_URL` - Set for local Redis
- `JWT_SECRET` - Development secret (32+ characters)
- `JWT_REFRESH_SECRET` - Development secret (32+ characters)
- `RATE_LIMIT_WINDOW_MS=900000` (15 minutes)
- `RATE_LIMIT_MAX_REQUESTS=100`

## Configuration Options

### Option 1: Using Docker Compose (Recommended)

If you're using Docker Compose, update these in `.env`:

```bash
# Database URL for Docker Compose
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/social_media

# Redis URL for Docker Compose
REDIS_URL=redis://redis:6379
```

### Option 2: Using Local Services

If you have PostgreSQL and Redis running locally:

```bash
# Database URL for local PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/social_media

# Redis URL for local Redis
REDIS_URL=redis://localhost:6379
```

**Note**: Adjust the username, password, and database name if your local setup differs.

## Generating Secure JWT Secrets (For Production)

For production, generate secure random secrets:

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate JWT_REFRESH_SECRET
openssl rand -base64 32
```

Then update your `.env` file with these values.

## Database Setup

### Using Docker Compose
```bash
docker-compose up -d postgres redis
```

### Using Local PostgreSQL
1. Install PostgreSQL
2. Create database:
   ```sql
   CREATE DATABASE social_media;
   ```
3. Update `DATABASE_URL` in `.env` with your credentials

### Run Migrations
After setting up the database:
```bash
npm run prisma:generate
npm run prisma:migrate
```

## Redis Setup

### Using Docker Compose
```bash
docker-compose up -d redis
```

### Using Local Redis
1. Install Redis
2. Start Redis server:
   ```bash
   redis-server
   ```

**Note**: The server will start even if Redis is not available, but caching features won't work.

## Verification

After setting up your `.env` file:

1. **Check environment validation**:
   ```bash
   npm run build
   ```
   This will validate your environment variables on startup.

2. **Start the server**:
   ```bash
   npm run dev
   ```

3. **Test health endpoints**:
   - `GET http://localhost:3000/health` - Should return 200
   - `GET http://localhost:3000/health/detailed` - Shows service status

## Troubleshooting

### Error: "DATABASE_URL is required"
- Ensure `.env` file exists in the project root
- Check that `DATABASE_URL` is set and not empty

### Error: "JWT_SECRET must be at least 32 characters"
- Ensure `JWT_SECRET` is at least 32 characters long
- The default value in `.env` should work for development

### Error: Database connection failed
- Check if PostgreSQL is running
- Verify `DATABASE_URL` is correct
- Ensure database exists: `CREATE DATABASE social_media;`

### Error: Redis connection failed
- Server will still start, but caching won't work
- Check if Redis is running
- Verify `REDIS_URL` is correct

## Security Notes

⚠️ **Important for Production**:
- Never commit `.env` file to git (it's in `.gitignore`)
- Use strong, randomly generated secrets for JWT
- Use environment-specific configurations
- Consider using a secrets management service

## Next Steps

Once your `.env` is configured:
1. Install dependencies: `npm install`
2. Generate Prisma client: `npm run prisma:generate`
3. Run migrations: `npm run prisma:migrate`
4. Start the server: `npm run dev`

