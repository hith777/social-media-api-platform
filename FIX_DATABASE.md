# Fixing Database Connection Issues

## Problem
You're getting: `Error: P1010: User 'postgres' was denied access on the database 'social_media.public'`

## Solutions

### Option 1: Use Docker Compose (Recommended)

1. **Start PostgreSQL container:**
   ```bash
   docker-compose up -d postgres
   ```

2. **Wait for it to be ready** (about 10-15 seconds)

3. **Update your .env file:**
   ```bash
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/social_media
   ```

4. **Run migrations:**
   ```bash
   npm run prisma:migrate
   ```

### Option 2: Use Local PostgreSQL

#### Step 1: Create the Database

Try one of these methods:

**Method A: Using psql**
```bash
psql -U postgres
```
Then in psql:
```sql
CREATE DATABASE social_media;
\q
```

**Method B: Using createdb command**
```bash
createdb -U postgres social_media
```

**Method C: Using your system user**
```bash
createdb social_media
```

#### Step 2: Update .env File

If you used a different user, update your `.env`:
```bash
# For default postgres user
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/social_media

# For your system user (replace 'yourusername')
DATABASE_URL=postgresql://yourusername@localhost:5432/social_media

# If you have a password
DATABASE_URL=postgresql://username:password@localhost:5432/social_media
```

#### Step 3: Test Connection

```bash
psql $DATABASE_URL -c "SELECT 1;"
```

If this works, proceed with migrations.

#### Step 4: Run Migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

### Option 3: Check PostgreSQL Status

**Check if PostgreSQL is running:**
```bash
# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql

# Or check if it's listening
lsof -i :5432
```

**Start PostgreSQL if needed:**
```bash
# macOS
brew services start postgresql@14

# Linux
sudo systemctl start postgresql
```

### Option 4: Fix Permissions

If you're getting permission errors:

1. **Check what databases exist:**
   ```bash
   psql -U postgres -l
   ```

2. **Check your PostgreSQL user:**
   ```bash
   psql -U postgres -c "\du"
   ```

3. **Grant permissions (if needed):**
   ```sql
   psql -U postgres
   GRANT ALL PRIVILEGES ON DATABASE social_media TO postgres;
   ```

## Quick Setup Script

Run the setup script:
```bash
chmod +x setup-database.sh
./setup-database.sh
```

## Verify Setup

After setup, verify everything works:

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Check database
npm run prisma:studio
```

## Common Issues

### Issue: "database does not exist"
**Solution:** Create the database first (see Option 2, Step 1)

### Issue: "password authentication failed"
**Solution:** 
- Check your password in DATABASE_URL
- Or use a user without password: `postgresql://username@localhost:5432/social_media`

### Issue: "connection refused"
**Solution:**
- PostgreSQL is not running
- Start it: `brew services start postgresql@14` (macOS) or `sudo systemctl start postgresql` (Linux)

### Issue: "permission denied"
**Solution:**
- Use a different user in DATABASE_URL
- Or grant permissions to the user

## Recommended: Use Docker Compose

For the easiest setup, use Docker Compose:

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs postgres

# Stop services
docker-compose down
```

This automatically creates the database and handles all setup!


