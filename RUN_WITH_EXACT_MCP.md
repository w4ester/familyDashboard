# Running Family Dashboard with Exact MCP Implementation

This guide shows how to run the Family Dashboard with the exact MCP filesystem server implementation that matches the official MCP protocol.

## Quick Start (One Command)

```bash
./start-with-exact-mcp.sh
```

This will start both the MCP server and React app. Open http://localhost:3000 in your browser.

## Manual Steps

### 1. Start the MCP Server

Open a terminal and run:

```bash
cd /Users/willf/smartIndex/siguy/family-dashboard/server/mcp
npm run dev:exact
```

The server will start on http://localhost:3030

### 2. Start the React App

Open another terminal and run:

```bash
cd /Users/willf/smartIndex/siguy/family-dashboard
npm start
```

The app will open at http://localhost:3000

## What's Different About the Exact MCP Implementation?

1. **Protocol**: Uses JSON-RPC 2.0 protocol exactly as specified by MCP
2. **Endpoints**: Single root endpoint (`/`) instead of multiple REST endpoints
3. **Tool Names**: Matches official MCP tool names (read_file, write_file, etc.)
4. **Error Handling**: Proper JSON-RPC error codes and messages
5. **Arguments**: Uses command-line arguments to specify allowed directories

## Directory Structure

```
family-dashboard/
├── family-data/          # All your data files
│   ├── family-data.json  # Main data file
│   └── uploads/          # Uploaded files
├── server/
│   └── mcp/
│       └── src/
│           └── exact-mcp-server.ts  # Exact MCP implementation
└── src/
    └── services/
        ├── mcp-client.ts           # Client for exact MCP
        └── data-persistence-mcp.ts # Service using MCP client
```

## Troubleshooting

### "MCP server not available" message
- Check that the MCP server is running on port 3030
- Try running `curl http://localhost:3030` to test connectivity

### Data not persisting
- Check the browser console for errors
- Verify the `family-data` directory exists
- Make sure the MCP server shows it's running with the correct directories

### Port already in use
- Kill existing processes: `lsof -ti:3030 | xargs kill -9`
- Or use a different port: `PORT=3031 npm run dev:exact`

## Development

To modify the MCP server:
1. Edit `/server/mcp/src/exact-mcp-server.ts`
2. Restart the server
3. The React app will automatically use the updated server

## Architecture

1. **React App** → 2. **MCP Client** → 3. **MCP Server** → 4. **Local Filesystem**

When MCP server is unavailable:
1. **React App** → 2. **localStorage** (automatic fallback)

## Benefits of Exact MCP Implementation

- Compatible with Claude Desktop and other MCP clients
- Standard protocol for AI assistants to access files
- Secure file access with directory restrictions
- Can be extended with additional MCP tools
- Works with both local and remote deployments