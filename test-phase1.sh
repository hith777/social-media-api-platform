#!/bin/bash

echo "🧪 Testing Phase 1: Project Setup & Foundation"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Dependencies installed${NC}"
fi

# Create test .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating test .env file...${NC}"
    cat > .env << EOF
NODE_ENV=test
PORT=3000
CORS_ORIGIN=*
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/social_media_test
REDIS_URL=redis://localhost:6379
JWT_SECRET=test-secret-key-that-is-at-least-32-characters-long
JWT_REFRESH_SECRET=test-refresh-secret-key-that-is-at-least-32-characters-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
    echo -e "${GREEN}✅ Test .env file created${NC}"
fi

# Check TypeScript compilation
echo -e "\n${YELLOW}Checking TypeScript compilation...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ TypeScript compilation failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ TypeScript compilation successful${NC}"

# Check linting
echo -e "\n${YELLOW}Running linter...${NC}"
npm run lint
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Linter found issues (this is okay for now)${NC}"
else
    echo -e "${GREEN}✅ Linting passed${NC}"
fi

echo -e "\n${GREEN}✅ Phase 1 setup verification complete!${NC}"
echo -e "\n${YELLOW}Note: Full integration tests require:${NC}"
echo "  - PostgreSQL database running"
echo "  - Redis server running"
echo "  - Or use: docker-compose up -d"

