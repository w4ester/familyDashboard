import express from 'express';
import { fileSystemService } from '../services/filesystem';
import { logger } from '../utils/logger';

const router = express.Router();

// Middleware to verify API key (if configured)
const verifyApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const apiKey = process.env.API_KEY;
  
  // If no API key is configured, skip verification
  if (!apiKey) {
    return next();
  }
  
  const providedKey = req.headers.authorization?.replace('Bearer ', '');
  
  if (!providedKey || providedKey !== apiKey) {
    logger.warn('Invalid API key provided');
    return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
  }
  
  next();
};

/**
 * @route   GET /api/filesystem/list
 * @desc    List files and directories in a path
 * @access  Protected
 */
router.get('/list', verifyApiKey, async (req, res) => {
  try {
    const path = req.query.path as string || './';
    logger.debug(`Listing directory: ${path}`);
    
    const files = await fileSystemService.listDirectory(path);
    res.json({ files });
  } catch (error: any) {
    logger.error(`Error listing directory:`, error);
    
    if (error.code === 'EACCES') {
      return res.status(403).json({ error: error.message });
    }
    
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
router.get('/read', verifyApiKey, async (req, res) => {
  try {
    const path = req.query.path as string;
    
    if (!path) {
      return res.status(400).json({ error: 'Path parameter is required' });
    }
    
    logger.debug(`Reading file: ${path}`);
    
    const file = await fileSystemService.readFile(path);
    res.json({ file });
  } catch (error: any) {
    logger.error(`Error reading file:`, error);
    
    if (error.code === 'EACCES') {
      return res.status(403).json({ error: error.message });
    }
    
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
router.post('/write', verifyApiKey, async (req, res) => {
  try {
    const { path, content } = req.body;
    
    if (!path) {
      return res.status(400).json({ error: 'Path parameter is required' });
    }
    
    if (content === undefined) {
      return res.status(400).json({ error: 'Content parameter is required' });
    }
    
    logger.debug(`Writing file: ${path}`);
    
    await fileSystemService.writeFile(path, content);
    res.json({ success: true, message: `File ${path} written successfully` });
  } catch (error: any) {
    logger.error(`Error writing file:`, error);
    
    if (error.code === 'EACCES') {
      return res.status(403).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/filesystem/mkdir
 * @desc    Create a new directory
 * @access  Protected
 */
router.post('/mkdir', verifyApiKey, async (req, res) => {
  try {
    const { path } = req.body;
    
    if (!path) {
      return res.status(400).json({ error: 'Path parameter is required' });
    }
    
    logger.debug(`Creating directory: ${path}`);
    
    await fileSystemService.createDirectory(path);
    res.json({ success: true, message: `Directory ${path} created successfully` });
  } catch (error: any) {
    logger.error(`Error creating directory:`, error);
    
    if (error.code === 'EACCES') {
      return res.status(403).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   DELETE /api/filesystem/delete
 * @desc    Delete a file or directory
 * @access  Protected
 */
router.delete('/delete', verifyApiKey, async (req, res) => {
  try {
    const { path, recursive } = req.body;
    
    if (!path) {
      return res.status(400).json({ error: 'Path parameter is required' });
    }
    
    logger.debug(`Deleting: ${path} (recursive: ${recursive})`);
    
    await fileSystemService.delete(path, recursive);
    res.json({ success: true, message: `${path} deleted successfully` });
  } catch (error: any) {
    logger.error(`Error deleting:`, error);
    
    if (error.code === 'EACCES') {
      return res.status(403).json({ error: error.message });
    }
    
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'File or directory not found' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

export default router;