/**
 * MCP Filesystem Client
 * Client for the exact MCP filesystem server implementation
 */

const MCP_SERVER_URL = 'http://localhost:3030';

// Call the MCP server with a tool request
async function callMcpTool(name: string, args: any) {
  try {
    const response = await fetch(MCP_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name,
          arguments: args
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Network error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    return data.result;
  } catch (error: any) {
    console.error(`MCP call error (${name}):`, error);
    // Return null on error to allow fallback to localStorage
    return null;
  }
}

// Read a file
export async function readFile(path: string) {
  const result = await callMcpTool('read_file', { path });
  if (!result) return null;
  return result.content[0].text;
}

// Write to a file
export async function writeFile(path: string, content: string) {
  const result = await callMcpTool('write_file', { path, content });
  if (!result) return null;
  return result.content[0].text;
}

// List directory contents
export async function listDirectory(path: string) {
  const result = await callMcpTool('list_directory', { path });
  if (!result) return null;
  const dirContents = result.content[0].text.split('\n');
  return dirContents.filter((item: string) => item.trim() !== '');
}

// Create a directory
export async function createDirectory(path: string) {
  const result = await callMcpTool('create_directory', { path });
  if (!result) return null;
  return result.content[0].text;
}

// Get file information
export async function getFileInfo(path: string) {
  const result = await callMcpTool('get_file_info', { path });
  if (!result) return null;
  return JSON.parse(result.content[0].text);
}

// Move a file
export async function moveFile(source: string, destination: string) {
  const result = await callMcpTool('move_file', { source, destination });
  if (!result) return null;
  return result.content[0].text;
}

// Search for files
export async function searchFiles(path: string, pattern: string) {
  const result = await callMcpTool('search_files', { path, pattern });
  if (!result) return null;
  return result.content[0].text.split('\n').filter((item: string) => item.trim() !== '');
}

// Get directory tree
export async function directoryTree(path: string) {
  const result = await callMcpTool('directory_tree', { path });
  if (!result) return null;
  return JSON.parse(result.content[0].text);
}

// Test connectivity
export async function testConnection() {
  try {
    const response = await fetch(MCP_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/list'
      })
    });
    
    const data = await response.json();
    return !data.error;
  } catch (error) {
    return false;
  }
}

// Export all methods
export default {
  readFile,
  writeFile,
  listDirectory,
  createDirectory,
  getFileInfo,
  moveFile,
  searchFiles,
  directoryTree,
  testConnection
};