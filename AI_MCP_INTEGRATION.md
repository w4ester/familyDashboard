# AI & MCP Integration Guide

## Overview

This guide shows how to connect your Family Dashboard to:
1. **Ollama** - Local AI models for intelligent assistance
2. **MCP Servers** - Extended functionality through Model Context Protocol

## 1. Ollama Integration

### Installation

1. Install Ollama:
   ```bash
   # macOS
   brew install ollama
   
   # Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. Pull a model:
   ```bash
   ollama pull llama2
   # or
   ollama pull mistral
   ```

3. Start Ollama:
   ```bash
   ollama serve
   ```

### Using in Family Dashboard

The AI Guide (Buddy) will automatically detect Ollama and use it for responses. Look for the robot icon in the bottom right.

Features:
- Chat with AI about any dashboard feature
- Get personalized suggestions
- Natural language help
- Works offline with local models

### Available Models

Popular models for family use:
- `llama2` - General purpose, balanced
- `mistral` - Fast and efficient
- `neural-chat` - Conversational
- `codellama` - Programming help

## 2. MCP Server Integration

### Available MCP Servers

1. **Filesystem** (`mcp-server-filesystem`)
   - Read/write files
   - Directory operations
   - Already integrated for data persistence

2. **Memory** (`mcp-server-memory`)
   - Store conversation context
   - Remember user preferences
   - Cross-session memory

3. **GitHub** (`mcp-server-github`)
   - Create issues
   - Manage PRs
   - Track family projects

4. **Browser** (`mcp-server-puppeteer`)
   - Take screenshots
   - Scrape web data
   - Automate web tasks

### Installation

```bash
# Install MCP servers globally
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-memory
npm install -g @modelcontextprotocol/server-github
npm install -g @modelcontextprotocol/server-puppeteer
```

### Running MCP Servers

Create a startup script:

```bash
#!/bin/bash
# start-mcp-servers.sh

# Filesystem server (port 3001)
mcp-server-filesystem /path/to/allowed/dir &

# Memory server (port 3002)
mcp-server-memory &

# GitHub server (port 3003) - needs GITHUB_TOKEN
GITHUB_TOKEN=your_token mcp-server-github &

# Browser server (port 3004)
mcp-server-puppeteer &
```

### Using MCP in the Dashboard

1. Click the "MCP Services" tab
2. Check connection status
3. Use the interface to:
   - Read/write files
   - Store memories
   - Create GitHub issues
   - Take screenshots

## 3. Architecture

```
Family Dashboard
├── Frontend (React)
│   ├── AiGuideWithOllama (Chat UI)
│   ├── McpDashboard (MCP Control Panel)
│   └── FamilyDashboard (Main Features)
│
├── Services
│   ├── ollama-service.ts (AI Integration)
│   ├── mcp-integration.ts (MCP Client)
│   └── data-persistence-mcp.ts (Storage)
│
└── Backends
    ├── Ollama (localhost:11434)
    └── MCP Servers
        ├── Filesystem (localhost:3001)
        ├── Memory (localhost:3002)
        ├── GitHub (localhost:3003)
        └── Browser (localhost:3004)
```

## 4. Configuration

### Environment Variables

Create `.env.local`:

```env
# Ollama Configuration
REACT_APP_OLLAMA_URL=http://localhost:11434
REACT_APP_OLLAMA_MODEL=llama2

# MCP Server URLs
REACT_APP_MCP_FILESYSTEM_URL=http://localhost:3001
REACT_APP_MCP_MEMORY_URL=http://localhost:3002
REACT_APP_MCP_GITHUB_URL=http://localhost:3003
REACT_APP_MCP_BROWSER_URL=http://localhost:3004

# GitHub Token (for GitHub MCP)
REACT_APP_GITHUB_TOKEN=your_github_token
```

## 5. Usage Examples

### AI Assistant

```javascript
// Ask Buddy for help
"How do I add a new chore?"
"What assignments are due this week?"
"Suggest fun family activities"
```

### MCP Operations

```javascript
// Save family memories
mcpServices.memory.saveMemory('vacation-2024', {
  location: 'Beach',
  photos: ['photo1.jpg', 'photo2.jpg'],
  notes: 'Great time!'
});

// Create GitHub issue for feature request
mcpServices.github.createIssue(
  'family/dashboard',
  'Add meal planning feature',
  'We need a way to plan weekly meals'
);

// Take screenshot of schedule
mcpServices.browser.screenshot('http://localhost:3000');
```

## 6. Troubleshooting

### Ollama Not Connecting
- Check if Ollama is running: `ollama list`
- Verify port: `curl http://localhost:11434/api/tags`
- Check CORS settings

### MCP Servers Not Responding
- Verify server is running: `lsof -i :3001`
- Check logs: `mcp-server-filesystem --verbose`
- Ensure allowed directories are set

### Performance Issues
- Use smaller models (mistral vs llama2)
- Reduce temperature for faster responses
- Cache frequent operations

## 7. Security Considerations

- Run Ollama locally for privacy
- Limit MCP filesystem access to specific directories
- Use environment variables for sensitive tokens
- Don't expose MCP servers to public internet

## 8. Future Enhancements

- Voice input/output
- Multi-modal AI (images)
- Calendar integration via MCP
- Email notifications
- Smart home integration