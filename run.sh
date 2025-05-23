#!/bin/bash
# Simple run script for Family Dashboard

cd "$(dirname "$0")"

echo "Starting Family Dashboard..."
echo ""

# Start React app (it will use localStorage fallback if MCP isn't available)
npm start