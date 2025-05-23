# Final Instructions to Run Family Dashboard

## One-Command Start

```bash
./start-with-exact-mcp.sh
```

This starts both the MCP server and React app. Open http://localhost:3000

## Manual Steps

### Terminal 1 - Start MCP Server:
```bash
cd /Users/willf/smartIndex/siguy/family-dashboard/server/mcp
npm run dev:exact
```

### Terminal 2 - Start React App:
```bash
cd /Users/willf/smartIndex/siguy/family-dashboard
npm start
```

## What You Get

1. **React App**: http://localhost:3000
   - Welcome page with onboarding
   - Chore tracking with points
   - Calendar and assignments
   - File gallery
   - AI Guide (Buddy)

2. **MCP Server**: http://localhost:3030
   - JSON-RPC 2.0 protocol
   - Filesystem access for data persistence
   - Automatic fallback to localStorage when offline

## Important Notes

1. **Browser Access**: Go to exactly http://localhost:3000 (no paths)
2. **Data Storage**: All data saved to `family-data/` folder or localStorage
3. **First Run**: May take a moment to compile TypeScript

## Troubleshooting

### "Site can't be reached"
```bash
# Check if React is running
lsof -i :3000

# Kill any stuck processes
pkill -f "react-scripts"

# Start fresh
npm start
```

### MCP Server Issues
```bash
# Check if MCP is running
lsof -i :3030

# Test MCP server
curl -X POST http://localhost:3030 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Quick Reset
```bash
# Stop everything
pkill -f "node"

# Clear and restart
rm -rf node_modules
npm install
./start-with-exact-mcp.sh
```

The app works with or without the MCP server - it automatically falls back to browser storage if the server isn't available.