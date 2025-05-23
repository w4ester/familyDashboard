#!/bin/bash
# Start both the exact MCP server and React frontend

# Navigate to project directory
cd "$(dirname "$0")"

# Make sure the family-data directory exists
mkdir -p family-data/uploads

# Kill any existing processes on ports
echo "Clearing ports..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3030 | xargs kill -9 2>/dev/null || true

# Start the MCP server
echo "Starting MCP filesystem server..."
cd server/mcp
npm run dev:exact &
MCP_PID=$!

# Wait for MCP server to start
sleep 3
echo "MCP filesystem server started (PID: $MCP_PID)"

# Start the React frontend
cd ../..
echo "Starting React app..."
PORT=3000 npm start &
REACT_PID=$!

echo "React app starting (PID: $REACT_PID)"
echo ""
echo "Services running:"
echo "- MCP Server: http://localhost:3030"
echo "- React App: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Set up trap to kill both processes on exit
trap "echo 'Stopping services...'; kill $MCP_PID $REACT_PID; exit" INT TERM EXIT

# Wait for processes
wait $MCP_PID $REACT_PID