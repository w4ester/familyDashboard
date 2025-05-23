#!/bin/bash

# Navigate to project directory
cd "$(dirname "$0")"

echo "Starting Family Dashboard locally..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Kill any existing processes on port 3000
echo "Checking port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start the React app
echo "Starting React app on http://localhost:3000"
BROWSER=none npm start