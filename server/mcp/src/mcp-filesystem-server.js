/**
 * Family Dashboard MCP Filesystem Server
 * 
 * This server provides LLMs (like Claude) with controlled access to the filesystem
 * It follows the Model Context Protocol (MCP) specification
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const winston = require('winston');
require('dotenv').config();

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Configuration
const PORT = process.env.PORT || 3030;
const ROOT_DIR = process.env.ROOT_DIR || './';
const ALLOWED_DIRS = (process.env.ALLOWED_DIRS || './data,./uploads').split(',');
const READ_ONLY = process.env.READ_ONLY === 'true';
const API_KEY = process.env.API_KEY;

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '50mb' }));

// Ensure required directories exist
for (const dir of ALLOWED_DIRS) {
  const fullPath = path.join(ROOT_DIR, dir);
  fs.ensureDirSync(fullPath);
  logger.info(`Ensured directory exists: ${fullPath}`);
}

// API Key verification middleware
const verifyApiKey = (req, res, next) => {
  if (!API_KEY) {
    return next();
  }
  
  const providedKey = req.headers.authorization?.replace('Bearer ', '');
  
  if (!providedKey || providedKey !== API_KEY) {
    logger.warn('Invalid API key provided');
    return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
  }
  
  next();
};

// Path validation helper
const isPathAllowed = (filePath) => {
  try {
    const normalized = path.normalize(filePath);
    const absolute = path.resolve(ROOT_DIR, normalized);
    
    return ALLOWED_DIRS.some(dir => {
      const allowedPath = path.resolve(ROOT_DIR, dir);
      return absolute.startsWith(allowedPath);
    });
  } catch (error) {
    logger.error('Path validation error:', error);
    return false;
  }
};

// Get full path from relative path
const getFullPath = (relativePath) => {
  return path.join(ROOT_DIR, relativePath);
};

// MCP TOOLS IMPLEMENTATION

// Read file tool
const readFileTool = async (params) => {
  const filePath = params.path;
  
  if (!filePath) {
    throw new Error('path parameter is required');
  }
  
  if (!isPathAllowed(filePath)) {
    throw new Error(`Access denied: ${filePath} is outside allowed directories`);
  }
  
  try {
    const fullPath = getFullPath(filePath);
    const content = await fs.readFile(fullPath, 'utf8');
    
    return {
      content: [{ type: 'text', text: content }]
    };
  } catch (error) {
    logger.error(`Error reading file ${filePath}:`, error);
    throw new Error(`Error reading file: ${error.message}`);
  }
};

// Write file tool
const writeFileTool = async (params) => {
  if (READ_ONLY) {
    throw new Error('Server is in read-only mode');
  }
  
  const filePath = params.path;
  const content = params.content;
  
  if (!filePath) {
    throw new Error('path parameter is required');
  }
  
  if (content === undefined) {
    throw new Error('content parameter is required');
  }
  
  if (!isPathAllowed(filePath)) {
    throw new Error(`Access denied: ${filePath} is outside allowed directories`);
  }
  
  try {
    const fullPath = getFullPath(filePath);
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, content, 'utf8');
    
    return {
      content: [{ type: 'text', text: `Successfully wrote to ${filePath}` }]
    };
  } catch (error) {
    logger.error(`Error writing file ${filePath}:`, error);
    throw new Error(`Error writing file: ${error.message}`);
  }
};

// List directory tool
const listDirectoryTool = async (params) => {
  const dirPath = params.path || './';
  
  if (!isPathAllowed(dirPath)) {
    throw new Error(`Access denied: ${dirPath} is outside allowed directories`);
  }
  
  try {
    const fullPath = getFullPath(dirPath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    
    const items = entries.map(entry => {
      if (entry.isDirectory()) {
        return `[DIR] ${entry.name}`;
      } else {
        return `[FILE] ${entry.name}`;
      }
    }).sort();
    
    const content = items.join('\n');
    
    return {
      content: [{ type: 'text', text: content || 'Directory is empty' }]
    };
  } catch (error) {
    logger.error(`Error listing directory ${dirPath}:`, error);
    throw new Error(`Error listing directory: ${error.message}`);
  }
};

// Create directory tool
const createDirectoryTool = async (params) => {
  if (READ_ONLY) {
    throw new Error('Server is in read-only mode');
  }
  
  const dirPath = params.path;
  
  if (!dirPath) {
    throw new Error('path parameter is required');
  }
  
  if (!isPathAllowed(dirPath)) {
    throw new Error(`Access denied: ${dirPath} is outside allowed directories`);
  }
  
  try {
    const fullPath = getFullPath(dirPath);
    await fs.ensureDir(fullPath);
    
    return {
      content: [{ type: 'text', text: `Successfully created directory ${dirPath}` }]
    };
  } catch (error) {
    logger.error(`Error creating directory ${dirPath}:`, error);
    throw new Error(`Error creating directory: ${error.message}`);
  }
};

// Delete tool
const deleteTool = async (params) => {
  if (READ_ONLY) {
    throw new Error('Server is in read-only mode');
  }
  
  const itemPath = params.path;
  const recursive = params.recursive === true;
  
  if (!itemPath) {
    throw new Error('path parameter is required');
  }
  
  if (!isPathAllowed(itemPath)) {
    throw new Error(`Access denied: ${itemPath} is outside allowed directories`);
  }
  
  try {
    const fullPath = getFullPath(itemPath);
    const stats = await fs.stat(fullPath);
    
    if (stats.isDirectory()) {
      if (recursive) {
        await fs.remove(fullPath);
      } else {
        await fs.rmdir(fullPath);
      }
    } else {
      await fs.unlink(fullPath);
    }
    
    return {
      content: [{ type: 'text', text: `Successfully deleted ${itemPath}` }]
    };
  } catch (error) {
    logger.error(`Error deleting ${itemPath}:`, error);
    throw new Error(`Error deleting item: ${error.message}`);
  }
};

// Register all tools
const TOOLS = {
  'read_file': {
    implementation: readFileTool,
    description: 'Read contents of a file'
  },
  'write_file': {
    implementation: writeFileTool,
    description: 'Write content to a file'
  },
  'list_directory': {
    implementation: listDirectoryTool,
    description: 'List contents of a directory'
  },
  'create_directory': {
    implementation: createDirectoryTool,
    description: 'Create a new directory'
  },
  'delete': {
    implementation: deleteTool,
    description: 'Delete a file or directory'
  }
};

// MCP ROUTES

/**
 * @route   GET /mcp/tools
 * @desc    List all available MCP tools
 * @access  Protected
 */
app.get('/mcp/tools', verifyApiKey, (req, res) => {
  const tools = Object.entries(TOOLS).map(([name, tool]) => ({
    name,
    description: tool.description
  }));
  
  res.json({ tools });
});

/**
 * @route   POST /mcp/tools/invoke
 * @desc    Invoke an MCP tool
 * @access  Protected
 */
app.post('/mcp/tools/invoke', verifyApiKey, async (req, res) => {
  try {
    const { tool, parameters } = req.body;
    
    if (!tool) {
      return res.status(400).json({ error: 'Missing tool name' });
    }
    
    if (!TOOLS[tool]) {
      return res.status(400).json({ error: `Unknown tool: ${tool}` });
    }
    
    logger.debug(`Invoking tool ${tool} with parameters:`, parameters);
    
    const result = await TOOLS[tool].implementation(parameters || {});
    res.json(result);
  } catch (error) {
    logger.error('Error invoking tool:', error);
    res.status(500).json({
      error: `Error invoking tool: ${error.message}`
    });
  }
});

// STANDARD API ROUTES FOR FRONTEND USAGE

/**
 * @route   GET /api/filesystem/list
 * @desc    List files and directories in a path
 * @access  Protected
 */
app.get('/api/filesystem/list', verifyApiKey, async (req, res) => {
  try {
    const dirPath = req.query.path || './';
    logger.debug(`Listing directory: ${dirPath}`);
    
    if (!isPathAllowed(dirPath)) {
      return res.status(403).json({ 
        error: `Access denied: ${dirPath} is outside allowed directories` 
      });
    }
    
    const fullPath = getFullPath(dirPath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    
    const files = await Promise.all(entries.map(async (entry) => {
      const entryPath = path.join(dirPath, entry.name);
      const fullEntryPath = getFullPath(entryPath);
      const stats = await fs.stat(fullEntryPath);
      
      return {
        name: entry.name,
        path: entryPath,
        type: entry.isDirectory() ? 'directory' : 'file',
        size: entry.isFile() ? stats.size : undefined,
        modified: stats.mtime,
        created: stats.birthtime
      };
    }));
    
    res.json({ files });
  } catch (error) {
    logger.error('Error listing directory:', error);
    
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'Directory not found' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/filesystem/read
 * @desc    Read file content
 * @access  Protected
 */
app.get('/api/filesystem/read', verifyApiKey, async (req, res) => {
  try {
    const filePath = req.query.path;
    
    if (!filePath) {
      return res.status(400).json({ error: 'Path parameter is required' });
    }
    
    logger.debug(`Reading file: ${filePath}`);
    
    if (!isPathAllowed(filePath)) {
      return res.status(403).json({ 
        error: `Access denied: ${filePath} is outside allowed directories` 
      });
    }
    
    const fullPath = getFullPath(filePath);
    const content = await fs.readFile(fullPath, 'utf8');
    
    res.json({ 
      file: {
        path: filePath,
        content,
        encoding: 'utf8'
      } 
    });
  } catch (error) {
    logger.error('Error reading file:', error);
    
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/filesystem/write
 * @desc    Write content to a file
 * @access  Protected
 */
app.post('/api/filesystem/write', verifyApiKey, async (req, res) => {
  try {
    if (READ_ONLY) {
      return res.status(403).json({ error: 'Server is in read-only mode' });
    }
    
    const { path: filePath, content } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'Path parameter is required' });
    }
    
    if (content === undefined) {
      return res.status(400).json({ error: 'Content parameter is required' });
    }
    
    logger.debug(`Writing file: ${filePath}`);
    
    if (!isPathAllowed(filePath)) {
      return res.status(403).json({ 
        error: `Access denied: ${filePath} is outside allowed directories` 
      });
    }
    
    const fullPath = getFullPath(filePath);
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, content, 'utf8');
    
    res.json({ 
      success: true, 
      message: `File ${filePath} written successfully` 
    });
  } catch (error) {
    logger.error('Error writing file:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/filesystem/mkdir
 * @desc    Create a new directory
 * @access  Protected
 */
app.post('/api/filesystem/mkdir', verifyApiKey, async (req, res) => {
  try {
    if (READ_ONLY) {
      return res.status(403).json({ error: 'Server is in read-only mode' });
    }
    
    const { path: dirPath } = req.body;
    
    if (!dirPath) {
      return res.status(400).json({ error: 'Path parameter is required' });
    }
    
    logger.debug(`Creating directory: ${dirPath}`);
    
    if (!isPathAllowed(dirPath)) {
      return res.status(403).json({ 
        error: `Access denied: ${dirPath} is outside allowed directories` 
      });
    }
    
    const fullPath = getFullPath(dirPath);
    await fs.ensureDir(fullPath);
    
    res.json({ 
      success: true, 
      message: `Directory ${dirPath} created successfully` 
    });
  } catch (error) {
    logger.error('Error creating directory:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   DELETE /api/filesystem/delete
 * @desc    Delete a file or directory
 * @access  Protected
 */
app.delete('/api/filesystem/delete', verifyApiKey, async (req, res) => {
  try {
    if (READ_ONLY) {
      return res.status(403).json({ error: 'Server is in read-only mode' });
    }
    
    const { path: itemPath, recursive } = req.body;
    
    if (!itemPath) {
      return res.status(400).json({ error: 'Path parameter is required' });
    }
    
    logger.debug(`Deleting: ${itemPath} (recursive: ${recursive})`);
    
    if (!isPathAllowed(itemPath)) {
      return res.status(403).json({ 
        error: `Access denied: ${itemPath} is outside allowed directories` 
      });
    }
    
    const fullPath = getFullPath(itemPath);
    const stats = await fs.stat(fullPath);
    
    if (stats.isDirectory()) {
      if (recursive) {
        await fs.remove(fullPath);
      } else {
        await fs.rmdir(fullPath);
      }
    } else {
      await fs.unlink(fullPath);
    }
    
    res.json({ 
      success: true, 
      message: `${itemPath} deleted successfully` 
    });
  } catch (error) {
    logger.error('Error deleting item:', error);
    
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'File or directory not found' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /health
 * @desc    Health check endpoint
 * @access  Public
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start the server
app.listen(PORT, () => {
  logger.info(`MCP Filesystem Server running on port ${PORT}`);
  logger.info(`Allowed directories: ${ALLOWED_DIRS.join(', ')}`);
  logger.info(`Read-only mode: ${READ_ONLY}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});