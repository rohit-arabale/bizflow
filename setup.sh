#!/bin/bash
# BizFlow Project Setup Script
# Run this after unzipping: chmod +x setup.sh && ./setup.sh

set -e

echo "=================================================="
echo "  🚀 BizFlow - Local Business Automation Platform"
echo "  Setting up your project..."
echo "=================================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ required. Current: $(node -v)"
  exit 1
fi
echo "✅ Node.js $(node -v) found"

# Check MongoDB
if command -v mongod &> /dev/null; then
  echo "✅ MongoDB found"
else
  echo "⚠️  MongoDB not found locally."
  echo "   Option 1: Install from https://www.mongodb.com/try/download/community"
  echo "   Option 2: Use MongoDB Atlas (free): https://www.mongodb.com/atlas"
  echo "   Update MONGO_URI in backend/.env after setup"
fi

echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install
echo "✅ Backend dependencies installed"

echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install
echo "✅ Frontend dependencies installed"

cd ..

# Setup .env if not exists
if [ ! -f "backend/.env" ]; then
  cp backend/.env.example backend/.env
  echo "✅ Created backend/.env from example"
  echo "⚠️  Please update backend/.env with your MongoDB URI"
else
  echo "✅ backend/.env already exists"
fi

echo ""
echo "=================================================="
echo "  ✅ Setup complete!"
echo ""
echo "  To start the project:"
echo ""
echo "  1. Make sure MongoDB is running:"
echo "     mongod --dbpath /data/db"
echo ""
echo "  2. Seed demo data (optional but recommended):"
echo "     cd backend && npm run seed"
echo ""
echo "  3. Start backend (Terminal 1):"
echo "     cd backend && npm run dev"
echo ""
echo "  4. Start frontend (Terminal 2):"
echo "     cd frontend && npm run dev"
echo ""
echo "  5. Open: http://localhost:5173"
echo ""
echo "  Demo login: ramesh@spicegarden.com / password123"
echo "=================================================="
