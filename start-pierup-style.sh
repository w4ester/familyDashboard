#!/bin/bash

echo "🚀 Starting Family Dashboard with PierUP-style AI Tools"
echo "======================================================="

# Kill any existing processes on our ports
echo "🧹 Cleaning up old processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3030 | xargs kill -9 2>/dev/null || true
lsof -ti:3031 | xargs kill -9 2>/dev/null || true

# Install dependencies for tools API if needed
echo "📦 Installing Tools API dependencies..."
cd server/tools-api
npm install
cd ../..

# Start the tools API server
echo "🔧 Starting Tools API server on port 3031..."
cd server/tools-api
node server.js &
TOOLS_PID=$!
cd ../..

# Give the tools server time to start
sleep 2

# Start the React app
echo "🎨 Starting React app on port 3000..."
npm start &
REACT_PID=$!

echo ""
echo "✅ All services started!"
echo "========================"
echo "🎨 React App: http://localhost:3000"
echo "🔧 Tools API: http://localhost:3031"
echo ""
echo "📝 Test the AI by saying:"
echo "   'Create a chore for Dado to unload dishes worth 5 points'"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "echo '🛑 Shutting down...'; kill $TOOLS_PID $REACT_PID 2>/dev/null; exit" INT
wait