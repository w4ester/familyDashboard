# Family Dashboard OpenAPI Server

This is the OpenAPI server for the Family Dashboard application, providing LLM (Large Language Model) integration capabilities.

## Features

- **LLM Integration**: Connect to OpenAI and Ollama for AI-powered features
- **Model Switching**: Support for both cloud-based and local LLM models
- **REST API**: Simple API endpoints for LLM interactions
- **Conversation Support**: Includes system prompts and conversation history

## Getting Started

### Prerequisites

- Python 3.8 or later
- pip (Python package manager)
- Optional: Ollama running locally for local LLM models

### Installation

1. Clone the repository
2. Navigate to the server directory:
   ```bash
   cd server/openapi
   ```
3. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
6. Configure your API keys and other settings in the `.env` file

### Running the Server

Development mode with automatic reloading:
```bash
python run.py
```

For production, use a proper ASGI server like Gunicorn.

## Configuration

The server is configured using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Port number for the server | 3040 |
| ENVIRONMENT | Environment (development/production) | development |
| LOG_LEVEL | Logging level (DEBUG/INFO/WARNING/ERROR) | INFO |
| CORS_ORIGINS | Comma-separated list of allowed origins | * |
| OPENAI_API_KEY | API key for OpenAI | (none) |
| OLLAMA_URL | URL for Ollama API | http://localhost:11434 |
| API_KEY | API key for authentication | (none) |

## API Endpoints

### LLM Endpoints

- `POST /api/llm/chat` - Generate a response from an LLM
- `GET /api/llm/models` - List available LLM models
- `GET /health` - Health check endpoint

## Request/Response Format

### Chat Completion Request

```json
{
  "prompt": "What are good activities for a family with young children?",
  "model": "gpt-3.5-turbo",
  "max_tokens": 1000,
  "temperature": 0.7,
  "system_prompt": "You are a helpful family assistant.",
  "history": [
    {"role": "user", "content": "I need help with family activities"},
    {"role": "assistant", "content": "I'd be happy to help with that!"}
  ]
}
```

### Chat Completion Response

```json
{
  "content": "Here are some great activities for families with young children...",
  "model": "gpt-3.5-turbo",
  "tokens": {
    "prompt": 45,
    "completion": 150,
    "total": 195
  }
}
```

## Integration with Family Dashboard

The OpenAPI server works together with the Family Dashboard and MCP server to provide:

1. AI-powered assistance for family activities
2. Natural language processing for calendar events
3. Help with organization and planning
4. Integration with both cloud and local LLM models