# Family Dashboard Architecture: MCP and OpenAPI Integration

## Overview

This document describes the architecture of the Family Dashboard's MCP (Model Context Protocol) and OpenAPI integration, which enables LLMs to interact with the system's filesystem and services.

## Architecture Components

### 1. MCP Filesystem Server

The MCP server is a JavaScript service that provides secure, controlled access to the filesystem for LLMs like Claude. It acts as a bridge between AI models and your local file system.

**Purpose:**
- Enable LLMs to read, write, create, and delete files/directories
- Provide secure access to specific directories only
- Allow both LLM access (via MCP protocol) and frontend access (via REST API)

**Key Features:**
- Path validation to prevent access outside allowed directories
- Read-only mode option for safety
- API key authentication
- Both MCP tool endpoints and REST API endpoints

**Usage by LLMs:**
```
User: "Create a new family schedule file and save our activities"
LLM:
1. Uses `list_directory` to see existing files
2. Uses `write_file` to create the schedule
3. Uses `read_file` to verify contents
```

### 2. OpenAPI Server

The OpenAPI server is a Python FastAPI service that provides structured APIs for LLM integration and follows the OpenAPI specification.

**Purpose:**
- Integrate with cloud LLMs (OpenAI) and local LLMs (Ollama)
- Provide family-specific AI capabilities
- Offer REST APIs with clear documentation
- Help LLMs understand available operations

**Key Features:**
- LLM model switching (OpenAI, Ollama)
- Family activity suggestions
- Schedule organization help
- OpenAPI spec for auto-documentation

**Usage by LLMs:**
```
User: "Give me activity suggestions for this weekend"
LLM:
1. Calls `/api/family/activity-suggestions` endpoint
2. Provides family member details and preferences
3. Returns personalized suggestions
```

## Communication Flow

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │  LLM (Claude)   │       │  MCP Server    │
└────────┬────────┘       └────────┬────────┘       └────────┬────────┘
         │                         │                          │
         │ "Update family file"    │                          │
         │─────────────────────────>                          │
         │                         │                          │
         │                         │ list_directory tool      │
         │                         │─────────────────────────>│
         │                         │                          │
         │                         │ <──────[directory list]──│
         │                         │                          │
         │                         │ write_file tool          │
         │                         │─────────────────────────>│
         │                         │                          │
         │                         │ <────[success response]──│
         │                         │                          │
         │ <────"File updated"─────│                          │
         │                         │                          │
```

## MCP Tools Available to LLMs

1. **read_file**
   - Parameters: `path` (string)
   - Description: Read contents of a file

2. **write_file**
   - Parameters: `path` (string), `content` (string)
   - Description: Write content to a file

3. **list_directory**
   - Parameters: `path` (string, optional)
   - Description: List files and directories

4. **create_directory**
   - Parameters: `path` (string)
   - Description: Create a new directory

5. **delete**
   - Parameters: `path` (string), `recursive` (boolean, optional)
   - Description: Delete a file or directory

## OpenAPI Endpoints Available

1. **/api/llm/chat**
   - Method: POST
   - Description: Generate text completion from an LLM
   - Used for general AI responses

2. **/api/llm/models**
   - Method: GET
   - Description: List available LLM models
   - Shows both OpenAI and Ollama models

3. **/api/family/activity-suggestions**
   - Method: POST
   - Description: Get personalized family activity suggestions
   - Considers family members, ages, and preferences

4. **/api/family/schedule-help**
   - Method: POST
   - Description: Get help organizing family schedule
   - Analyzes conflicts and suggests optimizations

## Security Considerations

### MCP Server Security
- **Path Validation**: All file paths are validated to ensure they're within allowed directories
- **API Key Protection**: Optional API key authentication for all endpoints
- **Read-Only Mode**: Can be configured to prevent any write operations
- **CORS**: Configured to allow only specific origins

### OpenAPI Server Security
- **API Key Authentication**: Protects endpoints from unauthorized access
- **Input Validation**: All inputs are validated using Pydantic models
- **Error Handling**: Sensitive information is not exposed in error messages
- **Rate Limiting**: Can be added for production deployments

## Environment Configuration

### MCP Server (.env)
```
PORT=3030
NODE_ENV=development
LOG_LEVEL=info
ALLOWED_DIRS=./data,./uploads
ROOT_DIR=./
READ_ONLY=false
API_KEY=your_mcp_api_key
CORS_ORIGIN=http://localhost:3000
```

### OpenAPI Server (.env)
```
PORT=3040
ENVIRONMENT=development
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000
OPENAI_API_KEY=your_openai_key
OLLAMA_URL=http://localhost:11434
API_KEY=your_api_key
```

## Integration Points

### Frontend Integration
The frontend can access both servers directly:
- MCP Server: For file operations via REST API
- OpenAPI Server: For AI features and LLM interactions

### LLM Integration
LLMs access the system through:
- MCP Protocol: Direct filesystem operations
- OpenAPI: Structured API calls for specific features

### Claude Configuration
To enable Claude to use the MCP server, add to Claude's configuration:
```json
{
  "mcpServers": {
    "family-dashboard": {
      "url": "http://localhost:3030",
      "apiKey": "your_mcp_api_key"
    }
  }
}
```

## Example Workflows

### 1. LLM Managing Family Files
```
User: "Create a new document for our family trip plans"
LLM Actions:
1. list_directory("data/documents")
2. write_file("data/documents/trip-plans.md", "# Family Trip Plans...")
3. read_file("data/documents/trip-plans.md") 
```

### 2. Getting Activity Suggestions
```
User: "We need weekend activity ideas"
LLM Actions:
1. Call /api/family/activity-suggestions with family details
2. Present formatted suggestions to user
3. Optionally save suggestions to a file using MCP
```

## Development and Testing

### Starting the Servers
```bash
# Terminal 1: MCP Server
cd server/mcp
npm install
npm run dev

# Terminal 2: OpenAPI Server
cd server/openapi
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py

# Terminal 3: Frontend
npm start
```

### Testing MCP Tools
```bash
# Test list directory
curl http://localhost:3030/mcp/tools/invoke \
  -H "Content-Type: application/json" \
  -d '{"tool": "list_directory", "parameters": {"path": "data"}}'

# Test write file
curl http://localhost:3030/mcp/tools/invoke \
  -H "Content-Type: application/json" \
  -d '{"tool": "write_file", "parameters": {"path": "data/test.txt", "content": "Hello from MCP!"}}'
```

### Testing OpenAPI Endpoints
```bash
# Test LLM chat
curl http://localhost:3040/api/llm/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, how can you help?"}'

# Test family activities
curl http://localhost:3040/api/family/activity-suggestions \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Weekend activities for kids", "family_members": [{"name": "Emma", "age": 7}]}'
```

## Conclusion

This architecture provides a comprehensive system where:
1. LLMs can interact with your filesystem securely through MCP
2. AI capabilities are exposed through well-documented OpenAPI endpoints
3. Both servers work together to provide intelligent family dashboard features
4. Security and access control are built-in at every level

The separation of MCP (filesystem bridge) and OpenAPI (REST API services) follows best practices and allows for flexible deployment and scaling options.