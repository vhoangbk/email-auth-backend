#!/bin/bash

echo "🚀 Email Authentication System - Quick Start"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  echo "⚠️  .env file not found!"
  echo "📝 Creating .env from .env.example..."
  cp .env.example .env
  echo "✅ Created .env file"
  echo "⚠️  Please edit .env and configure:"
  echo "   - DATABASE_URL (MySQL connection)"
  echo "   - JWT_SECRET (random 32+ character string)"
  echo "   - SMTP credentials (for email)"
  echo ""
  echo "Press Enter after configuring .env to continue..."
  read
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo "✅ Dependencies installed"
  echo ""
fi

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated"
echo ""

# Check if user wants to run migrations
echo "🗄️  Do you want to run database migrations now? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
  echo "📊 Running database migrations..."
  npx prisma migrate dev --name init
  echo "✅ Database migrations complete"
  echo ""
else
  echo "⏭️  Skipping migrations. Run manually with: npx prisma migrate dev"
  echo ""
fi

# Type check
echo "🔍 Running type check..."
npm run type-check
if [ $? -eq 0 ]; then
  echo "✅ Type check passed"
else
  echo "❌ Type check failed - please fix errors before running"
  exit 1
fi
echo ""

# Start development server
echo "🎉 Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Configure SMTP settings in .env for email functionality"
echo "   2. Test the API endpoints (see API_TESTING.md)"
echo "   3. Use Prisma Studio to view data: npx prisma studio"
echo ""
echo "🚀 Starting development server..."
echo "   Access API at: http://localhost:3000"
echo "   Press Ctrl+C to stop"
echo ""

npm run dev
