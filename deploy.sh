#!/bin/bash

# Family Dashboard Production Deployment Script

echo "🚀 Starting Family Dashboard Production Deployment"
echo "================================================"

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production not found!"
    echo "Please copy .env.production.example to .env.production and configure it."
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production
npm install -g pm2

# Install server dependencies
cd server/tools-api
npm install --production
cd ../..

# Build the React app
echo "🔨 Building React app..."
npm run build

# Test the build
echo "🧪 Testing production build..."
NODE_ENV=production node server/production-server.js &
SERVER_PID=$!
sleep 5

# Check if server is running
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Server health check passed"
    kill $SERVER_PID
else
    echo "❌ Server health check failed"
    kill $SERVER_PID
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p family-data/uploads

# Set up PM2
echo "🔧 Setting up PM2..."
pm2 delete family-dashboard 2>/dev/null || true
pm2 start server/production-server.js --name family-dashboard \
    --log logs/app.log \
    --error logs/error.log \
    --time \
    --env production

# Save PM2 configuration
pm2 save
pm2 startup

echo ""
echo "✅ Deployment Complete!"
echo "======================"
echo "🌐 App is running at: http://localhost:${PORT:-3001}"
echo "📊 View logs: pm2 logs family-dashboard"
echo "📈 Monitor: pm2 monit"
echo ""
echo "🔒 Don't forget to:"
echo "   1. Set up SSL/HTTPS with Let's Encrypt"
echo "   2. Configure your firewall"
echo "   3. Set up regular backups"
echo "   4. Configure monitoring alerts"