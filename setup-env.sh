#!/bin/bash

# Script to create .env file for the project

ENV_FILE=".env"

if [ -f "$ENV_FILE" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled. Existing .env file preserved."
        exit 0
    fi
fi

echo "🔧 Creating .env file..."

cat > "$ENV_FILE" << 'EOF'
# Server Configuration
NODE_ENV=development
PORT=3000
CORS_ORIGIN=*

# Database Configuration
# For Docker Compose: postgresql://postgres:postgres@postgres:5432/social_media
# For local PostgreSQL: postgresql://postgres:postgres@localhost:5432/social_media
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/social_media

# Redis Configuration
# For Docker Compose: redis://redis:6379
# For local Redis: redis://localhost:6379
REDIS_URL=redis://localhost:6379

# JWT Configuration
# IMPORTANT: Change these to secure random strings in production!
# Generate secure secrets: openssl rand -base64 32
JWT_SECRET=development-jwt-secret-key-change-in-production-min-32-chars
JWT_REFRESH_SECRET=development-refresh-secret-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (Optional - for future email features)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASSWORD=your-app-password
# EMAIL_FROM=noreply@example.com

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

echo "✅ .env file created successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Review the .env file and update DATABASE_URL if needed"
echo "2. Update REDIS_URL if using Docker Compose"
echo "3. For production, generate secure JWT secrets:"
echo "   openssl rand -base64 32"
echo ""
echo "📖 See SETUP_ENV.md for detailed configuration options"

