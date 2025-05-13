# Family Dashboard - Smart Tools Integration

This document explains the smart tools integration (MCP and OpenAPI servers) that enable AI-powered features in the Family Dashboard.

## What are Smart Tools?

Smart tools allow AI assistants like Claude to interact with your family dashboard in powerful ways:

- **MCP Server**: Enables AI to read, write, and manage files in your dashboard
- **OpenAPI Server**: Provides AI-powered features like activity suggestions and schedule optimization

## Getting Started

### Prerequisites

- Node.js 16+ (for MCP server)
- Python 3.8+ (for OpenAPI server)
- npm or yarn
- Optional: Ollama for local AI models

### Installation

1. **Install MCP Server Dependencies**
   ```bash
   cd server/mcp
   npm install
   ```

2. **Install OpenAPI Server Dependencies**
   ```bash
   cd server/openapi
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

### Configuration

1. **MCP Server Configuration** (`server/mcp/.env`)
   ```env
   PORT=3030
   ALLOWED_DIRS=./data,./uploads
   ROOT_DIR=./
   READ_ONLY=false
   API_KEY=your_secure_api_key
   ```

2. **OpenAPI Server Configuration** (`server/openapi/.env`)
   ```env
   PORT=3040
   OPENAI_API_KEY=your_openai_key  # Optional
   OLLAMA_URL=http://localhost:11434  # For local AI
   API_KEY=your_secure_api_key
   ```

### Running the Servers

1. **Start all services together**
   ```bash
   # In the project root
   npm run dev  # Starts frontend and MCP server
   
   # In another terminal
   cd server/openapi
   python run.py
   ```

2. **Or start individually**
   ```bash
   # Terminal 1: Frontend
   npm start
   
   # Terminal 2: MCP Server
   cd server/mcp
   npm run dev
   
   # Terminal 3: OpenAPI Server
   cd server/openapi
   python run.py
   ```

## Features

### AI File Management (MCP Server)

The MCP server allows AI assistants to:
- Create family documents and schedules
- Read and update existing files
- Organize files into directories
- Manage family data securely

Example interactions:
```
User: "Create a new file for our summer vacation plans"
AI: [Creates vacation-plans.md with formatted content]

User: "Show me what files we have for school documents"
AI: [Lists all files in the school documents folder]
```

### AI-Powered Features (OpenAPI Server)

The OpenAPI server provides:
- **Activity Suggestions**: Get personalized family activity ideas
- **Schedule Help**: Optimize your family calendar
- **LLM Integration**: Use OpenAI or local models like Ollama

Example interactions:
```
User: "Suggest some weekend activities for a family with young kids"
AI: [Provides 5 detailed activity suggestions with time estimates]

User: "Help me organize our busy Saturday schedule"
AI: [Analyzes schedule, identifies conflicts, suggests optimizations]
```

## Security

Both servers include security features:
- API key authentication
- Directory access restrictions (MCP)
- Read-only mode option (MCP)
- Input validation
- Error handling without exposing sensitive data

## Integrating with Claude

To use with Claude Desktop, add to your configuration:

```json
{
  "mcpServers": {
    "family-dashboard": {
      "command": "node",
      "args": ["/path/to/family-dashboard/server/mcp/src/mcp-filesystem-server.js"],
      "env": {
        "ALLOWED_DIRS": "./data,./uploads",
        "API_KEY": "your_secure_key"
      }
    }
  }
}
```

## API Documentation

### MCP Server Endpoints

**For AI/LLM Use:**
- `POST /mcp/tools/invoke` - Execute MCP tools (read_file, write_file, etc.)
- `GET /mcp/tools` - List available tools

**For Frontend Use:**
- `GET /api/filesystem/list` - List files in a directory
- `GET /api/filesystem/read` - Read a file
- `POST /api/filesystem/write` - Write to a file
- `POST /api/filesystem/mkdir` - Create a directory
- `DELETE /api/filesystem/delete` - Delete a file/directory

### OpenAPI Server Endpoints

- `POST /api/llm/chat` - Chat with an LLM
- `GET /api/llm/models` - List available AI models
- `POST /api/family/activity-suggestions` - Get activity ideas
- `POST /api/family/schedule-help` - Get schedule assistance

## Troubleshooting

**MCP Server Issues:**
- Check that allowed directories exist
- Verify API key if authentication is enabled
- Look at logs in `server/mcp/logs/`

**OpenAPI Server Issues:**
- Ensure Python virtual environment is activated
- Check API keys for OpenAI/Ollama
- Verify Ollama is running if using local models

**General Issues:**
- Ensure all ports are available (3000, 3030, 3040)
- Check CORS settings if frontend can't connect
- Review server logs for detailed error messages

## Development

### Adding New MCP Tools

1. Add tool function in `mcp-filesystem-server.js`
2. Register tool in the `TOOLS` object
3. Test with the MCP protocol

### Adding New OpenAPI Endpoints

1. Create route in `server/openapi/app/routes/`
2. Define Pydantic models for validation
3. Update OpenAPI spec in `server/openapi/spec/`
4. Test with curl or API client

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│ MCP Server  │◀────│  AI (Claude)│
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │            ┌─────────────┐           │
       └───────────▶│OpenAPI Server│◀──────────┘
                    └─────────────┘
                           │
                    ┌──────▼──────┐
                    │  LLM APIs   │
                    │(OpenAI/Local)│
                    └─────────────┘
```

## Contributing

When contributing to the smart tools:
1. Follow existing code patterns
2. Add tests for new features
3. Update documentation
4. Ensure security best practices