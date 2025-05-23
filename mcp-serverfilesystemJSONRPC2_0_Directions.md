# MCP Filesystem Server: JSON-RPC 2.0 Implementation Guide

## Introduction

The Model Context Protocol (MCP) Filesystem Server enables AI assistants like Claude to interact with files and directories on your local system using the JSON-RPC 2.0 protocol. This document provides comprehensive guidance on implementing, configuring, and using the MCP filesystem server.

## JSON-RPC 2.0 Overview

[JSON-RPC 2.0](https://www.jsonrpc.org/specification) is a stateless, lightweight remote procedure call (RPC) protocol that uses JSON for data encoding. Key characteristics:

- **Request objects** contain: `method`, `params`, `id`, and `jsonrpc: "2.0"`
- **Response objects** contain: `result` or `error`, `id`, and `jsonrpc: "2.0"`
- **Notification objects** (no response expected): `method`, `params`, and `jsonrpc: "2.0"`

## MCP Filesystem Server Setup

### Installation

```bash
# Global installation
npm install -g @modelcontextprotocol/server-filesystem

# Project installation
npm install --save @modelcontextprotocol/server-filesystem
```

### Basic Server Configuration

Create an `.env` file with the following settings:

```
PORT=3030                         # HTTP port (default)
SECURE_PORT=3443                  # HTTPS port (if using SSL)
ALLOWED_DIRS=./data,./uploads     # Comma-separated list of allowed directories
ROOT_DIR=./                       # Base directory for relative paths
API_KEY=your_secure_api_key       # Authentication key (optional but recommended)
READ_ONLY=false                   # Set to true to prevent file modifications
USE_SSL=false                     # Set to true to enable HTTPS
CERT_PATH=./certs/cert.pem        # Path to SSL certificate (if USE_SSL=true)
KEY_PATH=./certs/key.pem          # Path to SSL key (if USE_SSL=true)
```

### Starting the Server

```bash
# Start with default configuration
npx @modelcontextprotocol/server-filesystem /path/to/allowed/directory

# Start with multiple directories
npx @modelcontextprotocol/server-filesystem /path1 /path2 /path3

# Using environment variables
PORT=4040 npx @modelcontextprotocol/server-filesystem /path/to/directory
```

### Integration with Claude and Other AI Assistants

Add to Claude's configuration:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/path/to/directory1",
        "/path/to/directory2"
      ],
      "env": {
        "API_KEY": "your_secure_api_key",
        "READ_ONLY": "false"
      }
    }
  }
}
```

## JSON-RPC 2.0 Request/Response Format

### Request Structure

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "TOOL_NAME",
    "arguments": {
      "ARGUMENT1": "VALUE1",
      "ARGUMENT2": "VALUE2"
    }
  }
}
```

### Response Structure

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "RESPONSE_CONTENT"
      }
    ]
  }
}
```

### Error Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32603,
    "message": "ERROR_MESSAGE"
  }
}
```

## Available Methods (Tools)

### 1. `read_file`

Reads the contents of a file.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "read_file",
    "arguments": {
      "path": "/path/to/file.txt"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "File contents..."
      }
    ]
  }
}
```

### 2. `write_file`

Creates or overwrites a file with the specified content.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "write_file",
    "arguments": {
      "path": "/path/to/file.txt",
      "content": "File contents to write..."
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Successfully wrote to /path/to/file.txt"
      }
    ]
  }
}
```

### 3. `list_directory`

Lists files and directories in the specified path.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "list_directory",
    "arguments": {
      "path": "/path/to/directory"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "[DIR] subdirectory\n[FILE] file1.txt\n[FILE] file2.jpg"
      }
    ]
  }
}
```

### 4. `create_directory`

Creates a new directory.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "create_directory",
    "arguments": {
      "path": "/path/to/new_directory"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Directory created: /path/to/new_directory"
      }
    ]
  }
}
```

### 5. `get_file_info`

Retrieves metadata about a file or directory.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "get_file_info",
    "arguments": {
      "path": "/path/to/file.txt"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"size\": 1024,\n  \"created\": \"2025-05-13T14:30:00Z\",\n  \"modified\": \"2025-05-13T15:45:00Z\",\n  \"isDirectory\": false,\n  \"permissions\": \"rw-r--r--\"\n}"
      }
    ]
  }
}
```

### 6. `move_file`

Moves or renames a file or directory.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "tools/call",
  "params": {
    "name": "move_file",
    "arguments": {
      "source": "/path/to/source.txt",
      "destination": "/path/to/destination.txt"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "File moved from /path/to/source.txt to /path/to/destination.txt"
      }
    ]
  }
}
```

### 7. `search_files`

Searches for files matching a pattern.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "search_files",
    "arguments": {
      "path": "/path/to/directory",
      "pattern": "*.md"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "/path/to/directory/file1.md\n/path/to/directory/subdirectory/file2.md"
      }
    ]
  }
}
```

### 8. `directory_tree`

Returns a hierarchical tree of directories and files.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 8,
  "method": "tools/call",
  "params": {
    "name": "directory_tree",
    "arguments": {
      "path": "/path/to/directory"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 8,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"name\": \"directory\",\n  \"type\": \"directory\",\n  \"children\": [\n    {\n      \"name\": \"file1.txt\",\n      \"type\": \"file\"\n    },\n    {\n      \"name\": \"subdirectory\",\n      \"type\": \"directory\",\n      \"children\": [\n        {\n          \"name\": \"file2.md\",\n          \"type\": \"file\"\n        }\n      ]\n    }\n  ]\n}"
      }
    ]
  }
}
```

## Error Codes

MCP Filesystem Server uses standard JSON-RPC 2.0 error codes plus custom codes:

| Code | Message | Description |
|------|---------|-------------|
| -32700 | Parse error | Invalid JSON |
| -32600 | Invalid request | Request object not conforming to spec |
| -32601 | Method not found | Method does not exist |
| -32602 | Invalid params | Invalid method parameters |
| -32603 | Internal error | Internal JSON-RPC error |
| -32000 | Server error | File not found |
| -32001 | Server error | Permission denied |
| -32002 | Server error | Path outside allowed directories |
| -32003 | Server error | Read-only mode enabled |

## Security Considerations

### 1. Path Validation

The server validates all paths to ensure they're within allowed directories:

```javascript
function isPathAllowed(path) {
  const absolutePath = require('path').resolve(path);
  return ALLOWED_DIRS.some(dir => absolutePath.startsWith(dir));
}
```

### 2. API Key Authentication

When enabled, all requests must include a valid API key:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "apiKey": "your_secure_api_key",
    "name": "read_file",
    "arguments": {
      "path": "/path/to/file.txt"
    }
  }
}
```

### 3. Read-Only Mode

When `READ_ONLY=true`, any methods that modify the filesystem are disabled:

- `write_file`
- `create_directory`
- `move_file`

### 4. Rate Limiting

The server implements basic rate limiting to prevent abuse:

```javascript
const MAX_REQUESTS_PER_MINUTE = 60;
const requestCounts = new Map();

function rateLimit(clientId) {
  const now = Date.now();
  const minute = Math.floor(now / 60000);
  
  const key = `${clientId}:${minute}`;
  const count = (requestCounts.get(key) || 0) + 1;
  
  requestCounts.set(key, count);
  return count <= MAX_REQUESTS_PER_MINUTE;
}
```

## Practical Implementation Examples

### Example 1: Reading and Updating a Configuration File

```javascript
// 1. Read the config file
const readRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "read_file",
    arguments: {
      path: "/path/to/config.json"
    }
  }
};

// 2. Parse and modify the content
const config = JSON.parse(response.result.content[0].text);
config.setting = "new_value";

// 3. Write the updated config
const writeRequest = {
  jsonrpc: "2.0",
  id: 2,
  method: "tools/call",
  params: {
    name: "write_file",
    arguments: {
      path: "/path/to/config.json",
      content: JSON.stringify(config, null, 2)
    }
  }
};
```

### Example 2: Searching and Categorizing Files

```javascript
// 1. Search for markdown files
const searchRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "search_files",
    arguments: {
      path: "/path/to/docs",
      pattern: "*.md"
    }
  }
};

// 2. Read each file and categorize by content
for (const file of files) {
  const readRequest = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "read_file",
      arguments: {
        path: file
      }
    }
  };
  
  // Process content...
}
```

## Troubleshooting

### Common Error Scenarios

| Error | Possible Causes | Solution |
|-------|----------------|----------|
| Path not allowed | Path outside permitted directories | Ensure path is within ALLOWED_DIRS |
| File not found | Incorrect path or file doesn't exist | Check file path and existence |
| Permission denied | Insufficient file permissions | Check file permissions |
| Invalid JSON | Malformed request | Verify JSON syntax |
| Method not found | Incorrect method name | Check available methods |
| Read-only mode | Attempting to modify files in read-only mode | Set READ_ONLY=false |

### Debugging Tips

1. **Enable debug logs**:
   ```bash
   DEBUG=mcp:* npx @modelcontextprotocol/server-filesystem /path
   ```

2. **Test with curl**:
   ```bash
   curl -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"read_file","arguments":{"path":"/path/to/file.txt"}}}' http://localhost:3030
   ```

3. **Verify allowed directories**:
   ```bash
   curl -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"list_allowed_directories","params":{}}' http://localhost:3030
   ```

## Advanced Configuration

### Custom Middleware

```javascript
const { createServer } = require('@modelcontextprotocol/server-filesystem');

const customMiddleware = (req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}`);
  next();
};

const server = createServer({
  port: 3030,
  allowedDirs: ['/path/to/directory'],
  middleware: [customMiddleware]
});

server.start();
```

### SSL Configuration

```javascript
const fs = require('fs');
const { createServer } = require('@modelcontextprotocol/server-filesystem');

const server = createServer({
  port: 3443,
  useSSL: true,
  sslOptions: {
    key: fs.readFileSync('/path/to/key.pem'),
    cert: fs.readFileSync('/path/to/cert.pem')
  },
  allowedDirs: ['/path/to/directory']
});

server.start();
```

### Custom Authentication

```javascript
const { createServer } = require('@modelcontextprotocol/server-filesystem');

const customAuth = (req, res, next) => {
  const token = req.headers['authorization'];
  if (token !== 'Bearer your_token') {
    return res.status(401).json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32000,
        message: 'Unauthorized'
      }
    });
  }
  next();
};

const server = createServer({
  port: 3030,
  allowedDirs: ['/path/to/directory'],
  middleware: [customAuth]
});

server.start();
```

## Conclusion

The MCP Filesystem Server provides a secure, standards-compliant way for AI assistants and other applications to interact with your local filesystem. By using the JSON-RPC 2.0 protocol, it ensures clear communication patterns, reliable error handling, and consistent responses.

Remember to always:
1. Keep security in mind when configuring allowed directories
2. Use API key authentication in production
3. Consider read-only mode for sensitive applications
4. Monitor logs for suspicious activity

For more information and advanced topics, refer to the [official documentation](https://github.com/modelcontextprotocol/server-filesystem) and [JSON-RPC 2.0 specification](https://www.jsonrpc.org/specification).
