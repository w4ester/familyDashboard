# 📁 Expanding MCP Filesystem Access

## Current Setup

The MCP server currently has access to:
- `family-data/` - Family data storage
- `src/` - Source code (useful for AI to understand the app)
- `public/` - Public assets

## How to Add More Directories

### Method 1: Update Package.json Scripts (Recommended)

Edit `server/mcp/package.json` and modify the scripts to include new directories:

```json
"start:exact": "node dist/exact-mcp-server.js /path/to/family-data /path/to/documents /path/to/photos /path/to/any/folder",
"dev:exact": "node src/exact-mcp-server.js /path/to/family-data /path/to/documents /path/to/photos /path/to/any/folder"
```

### Method 2: Create Custom Start Script

Create `server/mcp/start-custom.sh`:

```bash
#!/bin/bash

# Add all directories you want MCP to access
node src/exact-mcp-server.js \
  /Users/willf/smartIndex/siguy/family-dashboard/family-data \
  /Users/willf/smartIndex/siguy/family-dashboard/src \
  /Users/willf/smartIndex/siguy/family-dashboard/public \
  /Users/willf/Documents/FamilyDocuments \
  /Users/willf/Pictures/FamilyPhotos \
  /Users/willf/Downloads/SchoolFiles \
  /path/to/any/other/folder
```

Then run:
```bash
chmod +x server/mcp/start-custom.sh
./server/mcp/start-custom.sh
```

### Method 3: Environment Variable Configuration

Create `server/mcp/.env`:

```env
# Define allowed directories
MCP_ALLOWED_DIRS="/Users/willf/smartIndex/siguy/family-dashboard/family-data,/Users/willf/Documents,/Users/willf/Pictures"
```

Then modify the server to read from environment variables.

## Examples of Useful Directories to Add

### 1. **Documents Folder**
```bash
/Users/willf/Documents/FamilyDocs
```
Use for: School reports, medical records, important documents

### 2. **Photos/Media**
```bash
/Users/willf/Pictures/FamilyPhotos
/Users/willf/Movies/FamilyVideos
```
Use for: Photo gallery, video memories

### 3. **School Work**
```bash
/Users/willf/Documents/SchoolWork
/Users/willf/Downloads/Assignments
```
Use for: Homework files, projects

### 4. **Shared Family Folder**
```bash
/Users/Shared/FamilyDashboard
```
Use for: Files accessible by all users on the computer

### 5. **Cloud Storage**
```bash
/Users/willf/Dropbox/Family
/Users/willf/Google Drive/Family
/Users/willf/iCloud Drive/Family
```
Use for: Cloud-synced family files

## Security Considerations

⚠️ **Be Careful What You Allow!**

### ✅ GOOD to Allow:
- Dedicated family folders
- Document folders you created
- Photo albums
- Download folders (be selective)

### ❌ NEVER Allow:
- System directories (`/System`, `/usr`, `/etc`)
- Home directory root (`/Users/willf`)
- Application folders (`/Applications`)
- Hidden folders (`.ssh`, `.config`)
- Sensitive data (passwords, financial)

## Quick Setup Example

1. **Create dedicated family folders:**
```bash
mkdir -p ~/FamilyDashboard/Documents
mkdir -p ~/FamilyDashboard/Photos
mkdir -p ~/FamilyDashboard/School
mkdir -p ~/FamilyDashboard/Events
```

2. **Update MCP server script:**
Edit `server/mcp/package.json`:
```json
"dev:exact": "node src/exact-mcp-server.js ~/FamilyDashboard/Documents ~/FamilyDashboard/Photos ~/FamilyDashboard/School ~/FamilyDashboard/Events ~/smartIndex/siguy/family-dashboard/family-data"
```

3. **Restart MCP server:**
```bash
cd server/mcp
npm run dev:exact
```

## Using New Directories in AI Assistant

Once configured, you can tell the AI Assistant:
- "Save this photo to FamilyDashboard/Photos"
- "Create a document in FamilyDashboard/Documents"
- "List all files in FamilyDashboard/School"

## Testing Access

Use the MCP Dashboard to test:
1. Go to http://localhost:3000
2. Click "MCP Services" tab
3. Use "List Directory" tool
4. Try paths like:
   - `~/FamilyDashboard/Documents`
   - `./family-data`
   - Any configured directory

## Troubleshooting

**"Path not allowed" error:**
- Check the path is in the allowed list
- Use absolute paths when starting server
- Ensure directories exist

**Can't see new directories:**
- Restart the MCP server
- Check console for startup messages
- Verify paths in the startup command

## Advanced: Dynamic Directory Management

For a more flexible approach, you could modify the MCP server to read allowed directories from a config file:

`server/mcp/allowed-dirs.json`:
```json
{
  "directories": [
    "/Users/willf/FamilyDashboard",
    "/Users/willf/smartIndex/siguy/family-dashboard/family-data"
  ],
  "readOnly": [
    "/Users/willf/Pictures"
  ]
}
```

This would require modifying the server code to load this configuration.

---

Remember: The MCP server is your gatekeeper. Only give it access to directories you trust the AI to read and modify!