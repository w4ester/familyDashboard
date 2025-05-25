# PierUP-Style AI Integration for Family Dashboard

## Overview

This implementation follows the PierUP pattern for AI tool integration:
- Simple REST API for tool execution
- Direct state updates that persist to files
- Clean separation between AI tools and UI
- No complex event buses or MCP servers

## Architecture

```
User → AI Chat → Tool Execution → File Update → UI Refresh
```

### Components:

1. **Tools API Server** (`server/tools-api/server.js`)
   - Express server on port 3031
   - Handles tool execution requests
   - Updates `family-data.json` directly
   - Returns state updates to frontend

2. **AI Guide Component** (`src/components/AiGuidePierup.tsx`)
   - Uses Ollama for local LLM
   - Sends tool requests to API
   - Updates UI with results

3. **Family Tools API** (`src/services/family-tools-api.ts`)
   - TypeScript API client
   - Clean interface for tool execution

## Available Tools

1. **create_chore** - Create chores with points
   - Parameters: choreName, assignedTo, points, frequency
   
2. **create_calendar_event** - Add calendar events
   - Parameters: title, date, time, person, location
   
3. **create_assignment** - Add school assignments
   - Parameters: assignmentName, subject, dueDate, person, priority
   
4. **add_family_member** - Add family members
   - Parameters: name, age, role

## Quick Start

```bash
# Start everything
./start-pierup-style.sh

# Or manually:
# 1. Start Tools API
cd server/tools-api
npm install
npm start

# 2. Start React app
npm start
```

## Testing

1. Open http://localhost:3000
2. Click the AI Guide button (lightning bolt)
3. Try these commands:
   - "Create a chore for Dado to unload dishes worth 5 points"
   - "Add dentist appointment for Lily on 2025-05-25 at 2:30pm"
   - "Create math homework for Abel due tomorrow"

## How It Works

1. User types request in AI chat
2. Ollama processes request and identifies tool to use
3. AI Guide sends tool execution request to Tools API
4. Tools API updates `family-data.json`
5. Tools API returns updated state
6. Frontend refreshes to show changes

## Benefits

- **Simple**: No complex infrastructure
- **Direct**: Tools update data immediately
- **Reliable**: File-based persistence
- **Extensible**: Easy to add new tools

## Next Steps

1. Add more tools as needed
2. Implement WebSocket for real-time updates
3. Add authentication for multi-user support
4. Integrate with external OpenAPI servers