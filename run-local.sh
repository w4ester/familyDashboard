#!/bin/bash

# Simple script to run the app locally

echo "Starting Family Dashboard..."

# Start React app (it will handle the MCP server fallback)
cd "$(dirname "$0")"
npm start