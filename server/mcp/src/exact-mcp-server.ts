import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import fs from "fs";
import mkdirp from "mkdirp";
import yargsParser from "yargs-parser";

const args = yargsParser(process.argv.slice(2));
const port = process.env.PORT ? parseInt(process.env.PORT) : 3030;

const allowedDirs = args._;
if (allowedDirs.length === 0) {
  console.error("Error: No directory provided.");
  console.error("Usage: npx server-filesystem /path/to/dir1 /path/to/dir2 ...");
  process.exit(1);
}

// Make sure all allowed directories exist and are absolute paths
const allowedAbsoluteDirs = allowedDirs.map((dir: string) => path.resolve(dir));
for (const dir of allowedAbsoluteDirs) {
  if (!fs.existsSync(dir)) {
    try {
      const mkdirpSync = require('mkdirp').sync;
      mkdirpSync(dir);
      console.log(`Created directory: ${dir}`);
    } catch (error) {
      console.error(`Failed to create directory ${dir}: ${error}`);
      process.exit(1);
    }
  }
}

// Create Express app
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));

// Check if a path is allowed
function isPathAllowed(filepath: string): boolean {
  const absolutePath = path.resolve(filepath);
  for (const dir of allowedAbsoluteDirs) {
    if (absolutePath === dir || absolutePath.startsWith(dir + path.sep)) {
      return true;
    }
  }
  return false;
}

// Handle JSON-RPC requests
app.post("/", async (req: express.Request, res: express.Response) => {
  const timestamp = new Date().toISOString();
  const reqBody = JSON.stringify(req.body);
  console.log(`${timestamp} [info] [filesystem] Message from client: ${reqBody}`);

  const { jsonrpc, id, method, params } = req.body;

  // Validate JSON-RPC 2.0
  if (jsonrpc !== "2.0") {
    const response = {
      jsonrpc: "2.0",
      id: id || null,
      error: {
        code: -32600,
        message: "Invalid Request: jsonrpc must be '2.0'"
      }
    };
    console.log(`${timestamp} [info] [filesystem] Message from server: ${JSON.stringify(response)}`);
    return res.json(response);
  }

  // Handle methods
  if (method === "tools/call") {
    const { name, arguments: args } = params;

    let result;
    try {
      // Call appropriate file operation function based on tool name
      switch (name) {
        case "read_file":
          result = await readFile(args);
          break;
        case "write_file":
          result = await writeFile(args);
          break;
        case "list_directory":
          result = await listDirectory(args);
          break;
        case "create_directory":
          result = await createDirectory(args);
          break;
        case "get_file_info":
          result = await getFileInfo(args);
          break;
        case "move_file":
          result = await moveFile(args);
          break;
        case "search_files":
          result = await searchFiles(args);
          break;
        case "directory_tree":
          result = await directoryTree(args);
          break;
        case "list_allowed_directories":
          result = await listAllowedDirectories();
          break;
        default:
          const errorResponse = {
            jsonrpc: "2.0",
            id,
            error: {
              code: -32601,
              message: `Method Not Found: Unknown tool '${name}'`
            }
          };
          console.log(`${timestamp} [info] [filesystem] Message from server: ${JSON.stringify(errorResponse)}`);
          return res.json(errorResponse);
      }

      const response = {
        jsonrpc: "2.0",
        id,
        result
      };
      console.log(`${timestamp} [info] [filesystem] Message from server: ${JSON.stringify(response)}`);
      return res.json(response);
    } catch (error: any) {
      const errorResponse = {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32000,
          message: error.message
        }
      };
      console.log(`${timestamp} [info] [filesystem] Message from server: ${JSON.stringify(errorResponse)}`);
      return res.json(errorResponse);
    }
  } else if (method === "tools/list") {
    // List all available tools
    const response = {
      jsonrpc: "2.0",
      id,
      result: {
        tools: [
          {
            name: "read_file",
            description: "Read the contents of a file"
          },
          {
            name: "write_file",
            description: "Write content to a file"
          },
          {
            name: "list_directory",
            description: "List the contents of a directory"
          },
          {
            name: "create_directory",
            description: "Create a new directory"
          },
          {
            name: "get_file_info",
            description: "Get metadata about a file"
          },
          {
            name: "move_file",
            description: "Move or rename a file"
          },
          {
            name: "search_files",
            description: "Search for files matching a pattern"
          },
          {
            name: "directory_tree",
            description: "Get a recursive directory tree"
          },
          {
            name: "list_allowed_directories",
            description: "List the allowed directories"
          }
        ]
      }
    };
    console.log(`${timestamp} [info] [filesystem] Message from server: ${JSON.stringify(response)}`);
    return res.json(response);
  } else if (method === "resources/list" || method === "prompts/list") {
    // Empty list for resources and prompts - we don't have any
    const listName = method.split("/")[0];
    const response = {
      jsonrpc: "2.0",
      id,
      result: {
        [listName]: []
      }
    };
    console.log(`${timestamp} [info] [filesystem] Message from server: ${JSON.stringify(response)}`);
    return res.json(response);
  } else {
    const response = {
      jsonrpc: "2.0",
      id,
      error: {
        code: -32601,
        message: `Method Not Found: '${method}'`
      }
    };
    console.log(`${timestamp} [info] [filesystem] Message from server: ${JSON.stringify(response)}`);
    return res.json(response);
  }
});

// Start server
app.listen(port, () => {
  console.log(`MCP Filesystem server running on port ${port}`);
  console.log(`Allowed directories: ${allowedAbsoluteDirs.join(", ")}`);
});

// Tool implementations

// Read file
async function readFile(args: { path: string }) {
  const filePath = path.resolve(args.path);
  
  if (!isPathAllowed(filePath)) {
    throw new Error(`Path outside allowed directories: ${filePath}`);
  }
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: No file named "${filePath}"`);
  }
  
  const stats = fs.statSync(filePath);
  if (stats.isDirectory()) {
    throw new Error(`Cannot read directory as file: ${filePath}`);
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  return {
    content: [
      {
        type: 'text',
        text: content
      }
    ]
  };
}

// Write file
async function writeFile(args: { path: string, content: string }) {
  const filePath = path.resolve(args.path);
  
  if (!isPathAllowed(filePath)) {
    throw new Error(`Path outside allowed directories: ${filePath}`);
  }
  
  // Create directory if it doesn't exist
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    const mkdirpLib = require('mkdirp');
    await mkdirpLib(dirPath);
  }
  
  // Write the file
  fs.writeFileSync(filePath, args.content);
  
  return {
    content: [
      {
        type: 'text',
        text: `Successfully wrote to ${filePath}`
      }
    ]
  };
}

// List directory
async function listDirectory(args: { path: string }) {
  const dirPath = path.resolve(args.path);
  
  if (!isPathAllowed(dirPath)) {
    throw new Error(`Path outside allowed directories: ${dirPath}`);
  }
  
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory not found: ${dirPath}`);
  }
  
  const stats = fs.statSync(dirPath);
  if (!stats.isDirectory()) {
    throw new Error(`Not a directory: ${dirPath}`);
  }
  
  const files = fs.readdirSync(dirPath);
  const filesList = files.map(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    return `[${stats.isDirectory() ? 'DIR' : 'FILE'}] ${file}`;
  });
  
  return {
    content: [
      {
        type: 'text',
        text: filesList.join('\n')
      }
    ]
  };
}

// Create directory
async function createDirectory(args: { path: string }) {
  const dirPath = path.resolve(args.path);
  
  if (!isPathAllowed(dirPath)) {
    throw new Error(`Path outside allowed directories: ${dirPath}`);
  }
  
  if (fs.existsSync(dirPath)) {
    const stats = fs.statSync(dirPath);
    if (stats.isDirectory()) {
      return {
        content: [
          {
            type: 'text',
            text: `Directory already exists: ${dirPath}`
          }
        ]
      };
    } else {
      throw new Error(`Path exists but is not a directory: ${dirPath}`);
    }
  }
  
  const mkdirpLib = require('mkdirp');
  await mkdirpLib(dirPath);
  
  return {
    content: [
      {
        type: 'text',
        text: `Directory created: ${dirPath}`
      }
    ]
  };
}

// Get file info
async function getFileInfo(args: { path: string }) {
  const filePath = path.resolve(args.path);
  
  if (!isPathAllowed(filePath)) {
    throw new Error(`Path outside allowed directories: ${filePath}`);
  }
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  const stats = fs.statSync(filePath);
  const info = {
    size: stats.size,
    created: stats.birthtime.toISOString(),
    modified: stats.mtime.toISOString(),
    isDirectory: stats.isDirectory(),
    permissions: stats.mode.toString(8).substr(-3)
  };
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(info, null, 2)
      }
    ]
  };
}

// Move file
async function moveFile(args: { source: string, destination: string }) {
  const sourcePath = path.resolve(args.source);
  const destPath = path.resolve(args.destination);
  
  if (!isPathAllowed(sourcePath) || !isPathAllowed(destPath)) {
    throw new Error('Path outside allowed directories');
  }
  
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source file not found: ${sourcePath}`);
  }
  
  // Create destination directory if it doesn't exist
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    const mkdirpLib = require('mkdirp');
    await mkdirpLib(destDir);
  }
  
  // Move the file
  fs.renameSync(sourcePath, destPath);
  
  return {
    content: [
      {
        type: 'text',
        text: `File moved from ${sourcePath} to ${destPath}`
      }
    ]
  };
}

// Helper function for recursive file search
async function globFiles(dir: string, pattern: string): Promise<string[]> {
  const files = fs.readdirSync(dir);
  let results: string[] = [];
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      // Recursively search subdirectories
      const subResults = await globFiles(fullPath, pattern);
      results = results.concat(subResults);
    } else if (file.match(new RegExp(pattern.replace(/\*/g, '.*')))) {
      // Match files using pattern
      results.push(fullPath);
    }
  }
  
  return results;
}

// Search files
async function searchFiles(args: { path: string, pattern: string }) {
  const dirPath = path.resolve(args.path);
  
  if (!isPathAllowed(dirPath)) {
    throw new Error(`Path outside allowed directories: ${dirPath}`);
  }
  
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory not found: ${dirPath}`);
  }
  
  const stats = fs.statSync(dirPath);
  if (!stats.isDirectory()) {
    throw new Error(`Not a directory: ${dirPath}`);
  }
  
  const results = await globFiles(dirPath, args.pattern);
  
  return {
    content: [
      {
        type: 'text',
        text: results.join('\n')
      }
    ]
  };
}

// Helper function to build directory tree
async function buildTree(dir: string): Promise<any> {
  const basename = path.basename(dir);
  const stats = fs.statSync(dir);
  
  if (!stats.isDirectory()) {
    return { name: basename, type: 'file' };
  }
  
  try {
    const files = fs.readdirSync(dir);
    const children = [];
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        const childNode = await buildTree(filePath);
        children.push(childNode);
      } catch (error) {
        // Skip files we can't access
        console.warn(`Warning: Could not access ${filePath}`);
      }
    }
    
    return { name: basename, type: 'directory', children };
  } catch (error) {
    // For directories we can't read, just return the basic info
    return { name: basename, type: 'directory', children: [] };
  }
}

// Directory tree
async function directoryTree(args: { path: string }) {
  const dirPath = path.resolve(args.path);
  
  if (!isPathAllowed(dirPath)) {
    throw new Error(`Path outside allowed directories: ${dirPath}`);
  }
  
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory not found: ${dirPath}`);
  }
  
  const stats = fs.statSync(dirPath);
  if (!stats.isDirectory()) {
    throw new Error(`Not a directory: ${dirPath}`);
  }
  
  const tree = await buildTree(dirPath);
  
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(tree, null, 2)
      }
    ]
  };
}

// List allowed directories
async function listAllowedDirectories() {
  return {
    content: [
      {
        type: 'text',
        text: allowedAbsoluteDirs.join('\n')
      }
    ]
  };
}