#!/bin/bash

# Deployment script for staging environment
# Usage: ./deploy-staging.sh

set -e

ENVIRONMENT=staging

echo "Deploying to $ENVIRONMENT environment..."

# Load environment variables
if [ -f ".env.staging" ]; then
  export $(cat .env.staging | grep -v '^#' | xargs)
fi

# Build Docker image
echo "Building Docker image for staging..."
docker build -t social-media-api:staging .

# Run database migrations
echo "Running database migrations..."
docker-compose -f docker-compose.staging.yml run --rm app npx prisma migrate deploy

# Start services
echo "Starting staging services..."
docker-compose -f docker-compose.staging.yml up -d

echo "Staging deployment complete!"

