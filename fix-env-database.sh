#!/bin/bash

# Script to fix DATABASE_URL in .env file

ENV_FILE=".env"
CURRENT_USER=$(whoami)

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env file not found!"
    exit 1
fi

echo "🔧 Updating DATABASE_URL in .env file..."
echo "   Changing from: postgresql://postgres:postgres@localhost:5432/social_media"
echo "   Changing to:   postgresql://${CURRENT_USER}@localhost:5432/social_media"
echo ""

# Check if database exists
if psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw social_media; then
    echo "✅ Database 'social_media' exists"
    
    # Update DATABASE_URL
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|DATABASE_URL=postgresql://postgres:postgres@localhost:5432/social_media|DATABASE_URL=postgresql://${CURRENT_USER}@localhost:5432/social_media|g" "$ENV_FILE"
    else
        # Linux
        sed -i "s|DATABASE_URL=postgresql://postgres:postgres@localhost:5432/social_media|DATABASE_URL=postgresql://${CURRENT_USER}@localhost:5432/social_media|g" "$ENV_FILE"
    fi
    
    echo "✅ Updated .env file"
    echo ""
    echo "New DATABASE_URL: postgresql://${CURRENT_USER}@localhost:5432/social_media"
    echo ""
    echo "Now you can run:"
    echo "  npm run prisma:migrate"
else
    echo "❌ Database 'social_media' does not exist"
    echo "Creating it now..."
    createdb social_media
    if [ $? -eq 0 ]; then
        echo "✅ Database created"
        # Update DATABASE_URL
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|DATABASE_URL=postgresql://postgres:postgres@localhost:5432/social_media|DATABASE_URL=postgresql://${CURRENT_USER}@localhost:5432/social_media|g" "$ENV_FILE"
        else
            sed -i "s|DATABASE_URL=postgresql://postgres:postgres@localhost:5432/social_media|DATABASE_URL=postgresql://${CURRENT_USER}@localhost:5432/social_media|g" "$ENV_FILE"
        fi
        echo "✅ Updated .env file"
    fi
fi


