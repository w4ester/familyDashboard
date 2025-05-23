# Data Persistence Setup

## Overview

This family dashboard now uses local file storage instead of browser localStorage. All family data is saved to your computer in the `family-data` directory, making it:
- Persistent across browser sessions
- Accessible from different browsers on the same computer
- Easily backed up

## How to Start

1. Run the start script to launch both the server and the app:
   ```bash
   ./start-servers.sh
   ```

   Or manually:
   ```bash
   # Terminal 1: Start the secure MCP server
   cd server/mcp
   npm start

   # Terminal 2: Start the React app
   npm start
   ```

2. The app will create a `family-data` folder in your project directory containing:
   - `family-data.json` - All your family dashboard data
   - `family-data-backup.json` - Automatic backup (created on each save)
   - `uploads/` - Uploaded images and files

## Security

The local server uses:
- Self-signed SSL certificates for HTTPS connections
- CORS protection limiting access to your local app
- Local network only (no internet exposure)

## Data Location

All data is stored in:
```
family-dashboard/
  ├── family-data/
  │   ├── family-data.json
  │   ├── family-data-backup.json
  │   └── uploads/
  │       └── [uploaded files]
```

## Backup

The system automatically creates a backup file (`family-data-backup.json`) every time data is saved. You can also manually backup by copying the `family-data` folder.

## Troubleshooting

### Server won't start
1. Make sure no other process is using ports 3030 or 3443
2. Check that certificates exist in `server/mcp/certs/`
3. Run `npm install` in both the root and `server/mcp` directories

### SSL Certificate Warning
Your browser may warn about the self-signed certificate. This is normal for local development:
1. Click "Advanced" or "Show Details"
2. Click "Proceed" or "Continue to localhost"

### Data not persisting
1. Check that the MCP server is running (Terminal 1)
2. Check browser console for errors
3. Verify the `family-data` folder exists and has write permissions