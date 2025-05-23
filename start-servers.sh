#!/bin/bash

# Navigate to the project directory
cd "$(dirname "$0")"

# Start the secure MCP server
echo "Starting secure MCP server..."
cd server/mcp

# Generate SSL certificates if they don't exist
if [ ! -f certs/private-key.pem ]; then
  echo "Generating SSL certificates..."
  bash generate-ssl.sh
fi

# Start the secure server
node src/mcp-filesystem-server-secure.js &
MCP_PID=$!

echo "MCP server started with PID: $MCP_PID"

# Start the React app
cd ../../
echo "Starting React app..."
npm start

# Kill the MCP server when the React app is stopped
trap "kill $MCP_PID" EXIT
