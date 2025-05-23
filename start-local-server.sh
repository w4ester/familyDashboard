#!/bin/bash

echo "🏠 Family Dashboard Local Server Setup"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we need to generate SSL certificates
if [ ! -f "server/mcp/certs/server.crt" ]; then
    echo -e "${YELLOW}SSL certificates not found. Generating...${NC}"
    cd server/mcp
    ./generate-ssl.sh
    cd ../..
    echo -e "${GREEN}SSL certificates generated!${NC}"
else
    echo -e "${GREEN}SSL certificates found.${NC}"
fi

# Check if .env file exists
if [ ! -f "server/mcp/.env" ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp server/mcp/.env.example server/mcp/.env
    echo -e "${YELLOW}Please edit server/mcp/.env to customize your settings${NC}"
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
cd server/mcp
npm install
cd ../..

# Create data directories
echo -e "${YELLOW}Creating data directories...${NC}"
mkdir -p server/mcp/data
mkdir -p server/mcp/family-data
mkdir -p server/mcp/uploads

# Start the secure server
echo -e "${GREEN}Starting secure MCP server...${NC}"
echo -e "${GREEN}Your data will be stored in: server/mcp/family-data/${NC}"
echo ""
echo -e "${GREEN}Server URLs:${NC}"
echo -e "HTTP:  http://localhost:3030"
echo -e "HTTPS: https://localhost:3443 (recommended)"
echo ""
echo -e "${YELLOW}Note: You may see a security warning in your browser for the self-signed certificate.${NC}"
echo -e "${YELLOW}This is normal - just click 'Advanced' and 'Proceed' to continue.${NC}"
echo ""

cd server/mcp
npm run start:secure