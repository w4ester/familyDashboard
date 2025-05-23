"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const filesystem_1 = require("../services/filesystem");
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
 * @route   GET /api/filesystem/list
 * @desc    List files and directories in a path
 * @access  Protected
 */
router.get('/list', verifyApiKey, async (req, res) => {
    try {
        const path = req.query.path || './';
        logger_1.logger.debug(`Listing directory: ${path}`);
        const files = await filesystem_1.fileSystemService.listDirectory(path);
        res.json({ files });
    }
    catch (error) {
        logger_1.logger.error(`Error listing directory:`, error);
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
        const path = req.query.path;
        if (!path) {
            return res.status(400).json({ error: 'Path parameter is required' });
        }
        logger_1.logger.debug(`Reading file: ${path}`);
        const file = await filesystem_1.fileSystemService.readFile(path);
        res.json({ file });
    }
    catch (error) {
        logger_1.logger.error(`Error reading file:`, error);
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
        logger_1.logger.debug(`Writing file: ${path}`);
        await filesystem_1.fileSystemService.writeFile(path, content);
        res.json({ success: true, message: `File ${path} written successfully` });
    }
    catch (error) {
        logger_1.logger.error(`Error writing file:`, error);
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
        logger_1.logger.debug(`Creating directory: ${path}`);
        await filesystem_1.fileSystemService.createDirectory(path);
        res.json({ success: true, message: `Directory ${path} created successfully` });
    }
    catch (error) {
        logger_1.logger.error(`Error creating directory:`, error);
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
        logger_1.logger.debug(`Deleting: ${path} (recursive: ${recursive})`);
        await filesystem_1.fileSystemService.delete(path, recursive);
        res.json({ success: true, message: `${path} deleted successfully` });
    }
    catch (error) {
        logger_1.logger.error(`Error deleting:`, error);
        if (error.code === 'EACCES') {
            return res.status(403).json({ error: error.message });
        }
        if (error.code === 'ENOENT') {
            return res.status(404).json({ error: 'File or directory not found' });
        }
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
