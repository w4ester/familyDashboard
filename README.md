# Family Dashboard

A comprehensive family organization tool with AI-powered features for managing schedules, chores, school activities, and more.

## Features

- **Chore Tracking**: Track family chores with point system
- **School Assignments**: Manage homework and school projects  
- **Calendar**: Keep track of family events and activities
- **File Gallery**: Store and organize family documents
- **School Platforms**: Quick access to educational websites
- **AI Integration**: Smart tools for activity suggestions and schedule optimization
- **Local Data Storage**: All data stored persistently on your computer (no cloud dependency)

## Quick Start

```bash
# Install dependencies
npm install

# Start the application with local data storage
./start-servers.sh
```

This will start both the local data server and the React app. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

For more details on data persistence, see [DATA_PERSISTENCE.md](./DATA_PERSISTENCE.md).

## Smart Tools (AI Features)

This project includes MCP (Model Context Protocol) and OpenAPI servers for AI integration:

- **MCP Server**: Enables AI assistants to interact with files
- **OpenAPI Server**: Provides LLM integration for smart features

See [README_SMART_TOOLS.md](./README_SMART_TOOLS.md) for detailed setup and usage.

### Quick Smart Tools Setup

```bash
# Install all dependencies
npm run mcp:install
cd server/openapi && pip install -r requirements.txt

# Run everything
npm run dev  # Runs frontend + MCP server
# In another terminal:
cd server/openapi && python run.py
```

## Available Scripts

- `npm start` - Run the frontend in development mode
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run mcp:dev` - Start the MCP filesystem server
- `npm run dev` - Start both frontend and MCP server

## Project Structure

```
family-dashboard/
├── src/                    # React frontend source
│   ├── components/         # React components
│   ├── services/          # API services
│   └── App.tsx           # Main app component
├── server/                # Backend servers
│   ├── mcp/              # MCP filesystem server
│   └── openapi/          # OpenAPI/LLM server
├── docs/                  # Documentation
└── public/               # Static assets
```

## Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS
- **MCP Server**: Node.js, Express
- **OpenAPI Server**: Python, FastAPI
- **AI Integration**: OpenAI API, Ollama (local models)

## Documentation

- [Smart Tools Integration](./README_SMART_TOOLS.md)
- [MCP & OpenAPI Architecture](./docs/MCP_OPENAPI_ARCHITECTURE.md)
- [API Documentation](./server/openapi/spec/openapi.yaml)

## Development

### Prerequisites

- Node.js 16+
- Python 3.8+
- npm or yarn

### Setup Development Environment

1. Clone the repository
2. Install frontend dependencies: `npm install`
3. Install MCP server dependencies: `cd server/mcp && npm install`
4. Install OpenAPI server dependencies: `cd server/openapi && pip install -r requirements.txt`
5. Copy environment files: 
   - `cp server/mcp/.env.example server/mcp/.env`
   - `cp server/openapi/.env.example server/openapi/.env`
6. Configure your API keys in the `.env` files

## Contributing

1. Create a feature branch
2. Make your changes
3. Add tests if applicable
4. Submit a pull request

## License

MIT License - see LICENSE file for details