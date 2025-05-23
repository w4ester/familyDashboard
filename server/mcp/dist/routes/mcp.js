"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mcp_1 = require("../services/mcp");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
// Middleware to verify API key (if configured)
const verifyApiKey = (req, res, next) => {
    const apiKey = process.env.API_KEY;
    // If no API key is configured, skip verification
    if (!apiKey) {
        return next();
    }
    const providedKey = req.headers.authorization?.replace('Bearer ', '');
    if (!providedKey || providedKey !== apiKey) {
        logger_1.logger.warn('Invalid API key provided');
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
    const tools = mcp_1.mcpService.getAllTools().map(tool => ({
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
        const request = req.body;
        if (!request.tool) {
            return res.status(400).json({ error: 'Missing tool name' });
        }
        logger_1.logger.debug(`Invoking tool ${request.tool} with parameters:`, request.parameters);
        const result = await mcp_1.mcpService.executeTool(request.tool, request.parameters || {});
        res.json(result);
    }
    catch (error) {
        logger_1.logger.error('Error invoking tool:', error);
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
        tools: mcp_1.mcpService.getAllTools().length
    });
});
exports.default = router;
