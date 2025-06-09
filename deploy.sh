#!/bin/bash

# Deployment script for social media API
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}

echo "Deploying to $ENVIRONMENT environment..."

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
  export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
fi

# Build Docker image
echo "Building Docker image..."
docker build -t social-media-api:$ENVIRONMENT .

# Run database migrations
echo "Running database migrations..."
docker-compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy

# Start services
echo "Starting services..."
docker-compose -f docker-compose.prod.yml up -d

echo "Deployment complete!"

