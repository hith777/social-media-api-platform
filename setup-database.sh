#!/bin/bash

# Script to set up the database for the project

echo "🗄️  Database Setup Script"
echo "========================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if using Docker or local PostgreSQL
read -p "Are you using Docker Compose? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Using Docker Compose...${NC}"
    echo ""
    echo "1. Start Docker Compose services:"
    echo "   docker-compose up -d postgres"
    echo ""
    echo "2. Wait for PostgreSQL to be ready (about 10 seconds)"
    echo ""
    echo "3. The database 'social_media' will be created automatically"
    echo ""
    echo "4. Update your .env file:"
    echo "   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/social_media"
    echo ""
    echo "5. Run migrations:"
    echo "   npm run prisma:migrate"
    exit 0
fi

echo -e "${YELLOW}Using local PostgreSQL...${NC}"
echo ""

# Try to connect and create database
echo "Attempting to create database 'social_media'..."

# Try different connection methods
DB_CREATED=false

# Method 1: Try with default postgres user
if psql -U postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw social_media; then
    echo -e "${GREEN}✅ Database 'social_media' already exists${NC}"
    DB_CREATED=true
elif psql -U postgres -c "CREATE DATABASE social_media;" 2>/dev/null; then
    echo -e "${GREEN}✅ Database 'social_media' created successfully${NC}"
    DB_CREATED=true
else
    # Method 2: Try with current user
    CURRENT_USER=$(whoami)
    if psql -U "$CURRENT_USER" -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw social_media; then
        echo -e "${GREEN}✅ Database 'social_media' already exists${NC}"
        DB_CREATED=true
    elif psql -U "$CURRENT_USER" -c "CREATE DATABASE social_media;" 2>/dev/null; then
        echo -e "${GREEN}✅ Database 'social_media' created successfully${NC}"
        DB_CREATED=true
    else
        echo -e "${RED}❌ Could not create database automatically${NC}"
        echo ""
        echo "Please create it manually:"
        echo ""
        echo "Option 1: Using psql"
        echo "  psql -U postgres"
        echo "  CREATE DATABASE social_media;"
        echo ""
        echo "Option 2: Using createdb command"
        echo "  createdb -U postgres social_media"
        echo ""
        echo "Option 3: Check your PostgreSQL connection"
        echo "  psql -U postgres -l"
        echo ""
        echo "If you get permission errors, you may need to:"
        echo "  1. Use a different PostgreSQL user"
        echo "  2. Update DATABASE_URL in .env file"
        echo "  3. Or use Docker Compose instead"
        exit 1
    fi
fi

if [ "$DB_CREATED" = true ]; then
    echo ""
    echo -e "${GREEN}✅ Database setup complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Verify your .env file has the correct DATABASE_URL"
    echo "2. Run: npm run prisma:generate"
    echo "3. Run: npm run prisma:migrate"
fi


