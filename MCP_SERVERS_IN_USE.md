# 🔧 MCP Servers in Family Dashboard

## What is MCP?

MCP (Model Context Protocol) is a standardized way for AI systems to interact with tools and services. Think of it as a universal language that lets AI assistants use different tools safely and efficiently.

## Current MCP Servers

### 1. **Filesystem MCP Server** 📁
**Status**: ✅ Active and Working

**Purpose**: Provides secure file system access for reading/writing family data

**Location**: `server/mcp/`

**Port**: 3030

**Available Tools**:
- `read_file` - Read family data files
- `write_file` - Save family data
- `list_directory` - Browse available files
- `create_directory` - Organize data in folders
- `get_file_info` - Check file details
- `search_files` - Find specific data
- `directory_tree` - View file structure

**Security Features**:
- ✅ Path validation (can't access system files)
- ✅ Allowed directories only (`family-data/`)
- ✅ SSL/HTTPS support available
- ✅ CORS protection
- ✅ Read-only mode option

**How It's Used**:
```javascript
// Family data is stored in family-data/family-data.json
// MCP server provides secure access to this file
// AI tools use it to persist chores, events, etc.
```

### 2. **REST API Bridge** 🌉
The MCP server also provides REST endpoints for compatibility:
- `/api/filesystem/read`
- `/api/filesystem/write`
- `/api/filesystem/list`

This allows the React app to work even if MCP protocol isn't fully supported.

## Starting MCP Servers

### Development Mode:
```bash
# Start MCP server only
cd server/mcp
npm run dev

# Start with exact MCP implementation
npm run dev:exact

# Start everything (React + MCP)
./start-with-exact-mcp.sh
```

### Production Mode:
```bash
# With PM2
pm2 start server/mcp/src/exact-mcp-server.js --name mcp-server

# With Docker
docker-compose up
```

## MCP Dashboard

Access the MCP testing dashboard at:
**http://localhost:3000** → Click "MCP Services" tab

Features:
- Test all MCP tools
- View server status
- Debug tool execution
- See real-time logs

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React App     │────▶│   MCP Client     │────▶│  MCP Server     │
│                 │     │ (Port 3000)      │     │ (Port 3030)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │ family-data.json│
                                                  └─────────────────┘
```

## Data Flow

1. **User Action** → Types in AI Assistant
2. **AI Processes** → Understands intent
3. **Tool Execution** → Calls MCP tool
4. **MCP Server** → Safely accesses file system
5. **Data Update** → Saves to family-data.json
6. **UI Refresh** → Shows updated data

## Available But Not Active MCP Servers

These are mentioned in docs but not currently running:

### Memory Server (Port 3002)
- Would provide conversation memory
- Not implemented yet

### GitHub Server (Port 3003)
- Would allow GitHub integration
- Not implemented yet

### Browser Server (Port 3004)
- Would control browser automation
- Not implemented yet

## Troubleshooting MCP

### Check if MCP server is running:
```bash
curl http://localhost:3030/health
```

### View MCP logs:
```bash
tail -f server/mcp/logs/combined.log
```

### Test MCP tool:
```bash
curl -X POST http://localhost:3030/mcp/tools/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "list_directory",
    "arguments": {
      "path": "./family-data"
    }
  }'
```

## Why MCP?

1. **Standardized** - Works with any AI that supports MCP
2. **Secure** - Built-in security features
3. **Extensible** - Easy to add new tools
4. **Reliable** - Handles errors gracefully
5. **Future-proof** - Industry standard protocol

## For Developers

To add a new MCP tool:

1. Edit `server/mcp/src/exact-mcp-server.ts`
2. Add tool definition to `TOOLS` array
3. Implement handler in switch statement
4. Restart server
5. Test in MCP Dashboard

Example:
```typescript
{
  name: "my_new_tool",
  description: "Does something cool",
  inputSchema: {
    type: "object",
    properties: {
      param1: { type: "string" }
    }
  }
}
```

## Security Notes

- MCP server runs locally only (not exposed to internet)
- All file access is restricted to `family-data/` directory
- No system file access allowed
- Authentication can be enabled for production
- SSL certificates included for HTTPS

---

*The MCP server is the backbone of data persistence in the Family Dashboard, ensuring all family data is stored safely and accessed securely.*