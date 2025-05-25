# 🔌 MCP (Model Context Protocol) Integration

## Overview
MCP integration provides a standardized way for AI systems to interact with the Family Dashboard's file system and tools, enabling secure and controlled access to family data.

## Location in Codebase
- **MCP Server**: `server/mcp/src/exact-mcp-server.ts`
- **Client Service**: `src/services/mcp-integration.ts`
- **API Bridge**: `src/services/mcp-api.ts`
- **Dashboard UI**: `src/components/McpDashboard.tsx`

## Architecture

### MCP Server Structure
```typescript
// JSON-RPC 2.0 Protocol Implementation
interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: any;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}
```

### Available MCP Tools
```typescript
const TOOLS = [
  {
    name: "read_file",
    description: "Read a file from the filesystem",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to the file" }
      },
      required: ["path"]
    }
  },
  {
    name: "write_file",
    description: "Write content to a file",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to the file" },
        content: { type: "string", description: "Content to write" }
      },
      required: ["path", "content"]
    }
  },
  {
    name: "list_directory",
    description: "List contents of a directory",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path to the directory" }
      },
      required: ["path"]
    }
  },
  {
    name: "create_directory",
    description: "Create a new directory",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path for the new directory" }
      },
      required: ["path"]
    }
  },
  {
    name: "search_files",
    description: "Search for files matching a pattern",
    inputSchema: {
      type: "object",
      properties: {
        pattern: { type: "string", description: "Search pattern" },
        path: { type: "string", description: "Starting directory" }
      },
      required: ["pattern"]
    }
  }
];
```

## Server Implementation

### Request Handler
```typescript
app.post("/", async (req: express.Request, res: express.Response) => {
  const { jsonrpc, id, method, params } = req.body;
  
  // Validate JSON-RPC 2.0
  if (jsonrpc !== "2.0") {
    return res.json({
      jsonrpc: "2.0",
      id: id || null,
      error: {
        code: -32600,
        message: "Invalid Request: jsonrpc must be '2.0'"
      }
    });
  }
  
  // Handle methods
  switch (method) {
    case "initialize":
      result = await handleInitialize(params);
      break;
      
    case "tools/list":
      result = { tools: TOOLS };
      break;
      
    case "tools/call":
      const { name, arguments: args } = params;
      result = await executeT ool(name, args);
      break;
      
    default:
      return res.json({
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`
        }
      });
  }
  
  res.json({
    jsonrpc: "2.0",
    id,
    result
  });
});
```

### Security Layer
```typescript
// Path validation
function isPathAllowed(filepath: string): boolean {
  const absolutePath = path.resolve(filepath);
  
  // Check against allowed directories
  for (const dir of allowedAbsoluteDirs) {
    if (absolutePath === dir || absolutePath.startsWith(dir + path.sep)) {
      return true;
    }
  }
  
  return false;
}

// Apply to all file operations
async function readFile(args: any) {
  const { path: filePath } = args;
  
  if (!isPathAllowed(filePath)) {
    throw new Error("Access denied: Path not allowed");
  }
  
  // ... read file
}
```

## Client Integration

### MCP Client Service
```typescript
// src/services/mcp-integration.ts
export class MCPClient {
  private serverUrl = 'http://localhost:3030';
  
  async initialize() {
    const response = await this.request('initialize', {
      protocolVersion: '0.1.0',
      capabilities: {}
    });
    
    return response.result;
  }
  
  async listTools() {
    const response = await this.request('tools/list');
    return response.result.tools;
  }
  
  async executeTool(toolName: string, args: any) {
    const response = await this.request('tools/call', {
      name: toolName,
      arguments: args
    });
    
    return response.result;
  }
  
  private async request(method: string, params?: any) {
    const response = await fetch(this.serverUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
      })
    });
    
    return response.json();
  }
}
```

### REST API Bridge
For compatibility with non-MCP clients:

```typescript
// Additional REST endpoints
app.post('/api/filesystem/read', async (req, res) => {
  try {
    const result = await readFile(req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/filesystem/write', async (req, res) => {
  try {
    const result = await writeFile(req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
```

## MCP Dashboard Component

### Testing Interface
```typescript
// src/components/McpDashboard.tsx
export default function McpDashboard() {
  const [tools, setTools] = useState<any[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [toolParams, setToolParams] = useState<Record<string, any>>({});
  const [result, setResult] = useState<any>(null);
  
  const loadTools = async () => {
    const client = new MCPClient();
    await client.initialize();
    const toolList = await client.listTools();
    setTools(toolList);
  };
  
  const executeTool = async () => {
    const client = new MCPClient();
    try {
      const response = await client.executeTool(selectedTool, toolParams);
      setResult(response);
    } catch (error) {
      setResult({ error: error.message });
    }
  };
  
  return (
    <div>
      <h2>MCP Tool Tester</h2>
      
      {/* Tool selector */}
      <select 
        value={selectedTool} 
        onChange={e => setSelectedTool(e.target.value)}
      >
        <option value="">Select a tool</option>
        {tools.map(tool => (
          <option key={tool.name} value={tool.name}>
            {tool.name} - {tool.description}
          </option>
        ))}
      </select>
      
      {/* Dynamic parameter inputs */}
      {selectedTool && (
        <div>
          {Object.entries(getToolSchema(selectedTool).properties).map(([key, schema]) => (
            <input
              key={key}
              type="text"
              placeholder={key}
              value={toolParams[key] || ''}
              onChange={e => setToolParams({
                ...toolParams,
                [key]: e.target.value
              })}
            />
          ))}
        </div>
      )}
      
      <button onClick={executeTool}>Execute</button>
      
      {/* Result display */}
      {result && (
        <pre>{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}
```

## Configuration

### Server Startup
```typescript
// package.json scripts
{
  "start:exact": "node dist/exact-mcp-server.js /path/to/family-data",
  "dev:exact": "node src/exact-mcp-server.js /path/to/family-data"
}

// Command line usage
npx server-filesystem /Users/willf/family-dashboard/family-data
```

### Environment Variables
```env
PORT=3030
MCP_API_KEY=optional-security-key
ALLOWED_ORIGINS=http://localhost:3000
READ_ONLY_MODE=false
```

## Use Cases

### 1. AI Tool Integration
```typescript
// AI can use MCP to manage family data
const result = await mcpClient.executeTool('write_file', {
  path: './family-data/family-data.json',
  content: JSON.stringify(updatedData)
});
```

### 2. Backup Automation
```typescript
// Automated backups via MCP
const files = await mcpClient.executeTool('list_directory', {
  path: './family-data'
});

for (const file of files) {
  const content = await mcpClient.executeTool('read_file', {
    path: file.path
  });
  // ... create backup
}
```

### 3. Search Functionality
```typescript
// Search across family data
const results = await mcpClient.executeTool('search_files', {
  pattern: 'birthday',
  path: './family-data'
});
```

## Security Considerations

### 1. Path Restrictions
- Only allowed directories accessible
- No parent directory traversal
- Absolute path resolution

### 2. Authentication (Optional)
```typescript
// API key validation
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (process.env.MCP_API_KEY && apiKey !== process.env.MCP_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

### 3. CORS Configuration
```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['POST'],
  allowedHeaders: ['Content-Type', 'X-API-Key']
}));
```

## Benefits
1. **Standardization**: Industry-standard protocol
2. **Security**: Built-in path validation
3. **Flexibility**: Multiple client options
4. **Extensibility**: Easy to add new tools
5. **AI-Ready**: Direct AI integration support

## Future Enhancements
1. **WebSocket Support**: Real-time updates
2. **Batch Operations**: Multiple tool calls
3. **Streaming**: Large file handling
4. **Permissions**: User-based access control
5. **Audit Logging**: Track all operations