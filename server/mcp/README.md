# Family Dashboard MCP Server

This is the Model Context Protocol (MCP) server for the Family Dashboard application, providing secure file system access capabilities.

## Features

- **File System Operations**: Read, write, list, create, and delete files/directories
- **MCP Protocol Support**: Compatible with Claude Code and similar LLM interfaces
- **REST API**: Direct API endpoints for file system operations
- **Security**: Path validation, optional read-only mode, API key authentication

## Getting Started

### Prerequisites

- Node.js 16.x or later
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the server directory:
   ```bash
   cd server/mcp
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
5. Configure your environment settings in the `.env` file

### Running the Server

Development mode with automatic reloading:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## Configuration

The server is configured using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Port number for the server | 3030 |
| NODE_ENV | Environment (development/production) | development |
| LOG_LEVEL | Logging level (debug/info/warn/error) | info |
| ALLOWED_DIRS | Comma-separated list of allowed directories | ./data,./uploads |
| ROOT_DIR | Root directory for file operations | ./ |
| READ_ONLY | Set to "true" for read-only mode | false |
| API_KEY | API key for authentication | (none) |
| CORS_ORIGIN | Allowed CORS origin | * |

## API Endpoints

### MCP Protocol Endpoints

- `GET /mcp/tools` - List available MCP tools
- `POST /mcp/tools/invoke` - Invoke an MCP tool
- `GET /mcp/health` - MCP server health check

### RESTful API Endpoints

- `GET /api/filesystem/list?path=<path>` - List files in a directory
- `GET /api/filesystem/read?path=<path>` - Read file content
- `POST /api/filesystem/write` - Write to a file
- `POST /api/filesystem/mkdir` - Create a directory
- `DELETE /api/filesystem/delete` - Delete a file or directory

## MCP Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| read_file | Read contents of a file | path: string |
| write_file | Write content to a file | path: string, content: string |
| list_directory | List contents of a directory | path: string (optional) |
| create_directory | Create a new directory | path: string |
| delete | Delete a file or directory | path: string, recursive: boolean (optional) |

## Security

- All file paths are validated to ensure they're within allowed directories
- Optional read-only mode prevents any write operations
- API key authentication can be enabled for all endpoints
- All routes use proper error handling and logging

## Integration with Family Dashboard

The MCP server is designed to be used with the Family Dashboard frontend, allowing it to:

1. Access file storage for family documents
2. Provide structured data storage for application features
3. Connect with Claude Code and other LLM clients
4. Enable AI-powered features through the MCP protocol