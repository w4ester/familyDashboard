# How to Run Family Dashboard Locally

## Quick Start

1. Open Terminal/Command Prompt
2. Navigate to the project directory:
   ```bash
   cd /Users/willf/smartIndex/siguy/family-dashboard
   ```

3. Run the start script:
   ```bash
   ./start-local.sh
   ```

   Or manually:
   ```bash
   # Install dependencies (first time only)
   npm install
   
   # Start the app
   npm start
   ```

4. Open your browser to:
   **http://localhost:3000**

## Troubleshooting

### "Site can't be reached" Error
- Make sure the terminal shows "Compiled successfully!"
- Try clearing browser cache
- Try incognito/private mode
- Check if port 3000 is blocked by firewall

### Port 3000 Already in Use
The script will try to kill any process using port 3000. If it still doesn't work:
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process (replace PID with actual number)
kill -9 PID
```

### Can't Connect to Data Server
The app will automatically use browser localStorage as fallback. The MCP server is optional for local development.

## Features Available

✅ All dashboard features work with localStorage
✅ Welcome page and onboarding
✅ Chore tracking with points
✅ Calendar and assignments
✅ File gallery
✅ AI Guide (Buddy)

## Data Storage

When running locally without the MCP server:
- Data is stored in browser localStorage
- Data persists between sessions
- Data is browser-specific

To use file-based storage:
```bash
# Terminal 1: Start MCP server
cd server/mcp
npm install
npm run dev

# Terminal 2: Start React app
npm start
```