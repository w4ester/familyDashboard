import express from 'express';
import { mcpService } from '../services/mcp';
import { logger } from '../utils/logger';
import { MCPToolInvocationRequest } from '../types';

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
 * @route   GET /mcp/tools
 * @desc    List all available MCP tools
 * @access  Protected
 */
router.get('/tools', verifyApiKey, (req, res) => {
  const tools = mcpService.getAllTools().map(tool => ({
    name: tool.name,
    description: tool.description
  }));
  
  res.json({ tools });
});

/**
 * @route   POST /mcp/tools/invoke
 * @desc    Invoke an MCP tool
 * @access  Protected
 */
router.post('/tools/invoke', verifyApiKey, async (req, res) => {
  try {
    const request: MCPToolInvocationRequest = req.body;
    
    if (!request.tool) {
      return res.status(400).json({ error: 'Missing tool name' });
    }
    
    logger.debug(`Invoking tool ${request.tool} with parameters:`, request.parameters);
    
    const result = await mcpService.executeTool(request.tool, request.parameters || {});
    res.json(result);
  } catch (error: any) {
    logger.error('Error invoking tool:', error);
    res.status(500).json({
      error: `Error invoking tool: ${error.message}`
    });
  }
});

/**
 * @route   GET /mcp/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    tools: mcpService.getAllTools().length
  });
});

export default router;