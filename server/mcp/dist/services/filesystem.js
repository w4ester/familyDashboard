"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileSystemService = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
class FileSystemService {
    constructor() {
        this.rootDir = process.env.ROOT_DIR || './';
        this.allowedDirs = (process.env.ALLOWED_DIRS || './data,./uploads').split(',');
        this.readOnly = process.env.READ_ONLY === 'true';
        // Ensure directories exist
        this.allowedDirs.forEach(dir => {
            const fullPath = path_1.default.join(this.rootDir, dir);
            fs_extra_1.default.ensureDirSync(fullPath);
        });
    }
    /**
     * Validate if a path is within allowed directories
     */
    isPathAllowed(filePath) {
        try {
            // Normalize and resolve the path
            const normalized = path_1.default.normalize(filePath);
            const absolute = path_1.default.resolve(this.rootDir, normalized);
            // Check if it starts with any allowed directory
            return this.allowedDirs.some(dir => {
                const allowedPath = path_1.default.resolve(this.rootDir, dir);
                return absolute.startsWith(allowedPath);
            });
        }
        catch (error) {
            logger_1.logger.error('Path validation error:', error);
            return false;
        }
    }
    /**
     * Get full path from relative path
     */
    getFullPath(relativePath) {
        return path_1.default.join(this.rootDir, relativePath);
    }
    /**
     * List files and directories in a directory
     */
    async listDirectory(dirPath) {
        if (!this.isPathAllowed(dirPath)) {
            throw {
                code: 'EACCES',
                message: `Access denied: ${dirPath} is outside allowed directories`
            };
        }
        try {
            const fullPath = this.getFullPath(dirPath);
            const entries = await fs_extra_1.default.readdir(fullPath, { withFileTypes: true });
            return Promise.all(entries.map(async (entry) => {
                const entryPath = path_1.default.join(dirPath, entry.name);
                const fullEntryPath = this.getFullPath(entryPath);
                const stats = await fs_extra_1.default.stat(fullEntryPath);
                return {
                    name: entry.name,
                    path: entryPath,
                    type: entry.isDirectory() ? 'directory' : 'file',
                    size: entry.isFile() ? stats.size : undefined,
                    modified: stats.mtime,
                    created: stats.birthtime
                };
            }));
        }
        catch (error) {
            logger_1.logger.error(`Error listing directory ${dirPath}:`, error);
            throw {
                code: error.code || 'ENOENT',
                message: `Error listing directory: ${error.message}`,
                path: dirPath
            };
        }
    }
    /**
     * Read file content
     */
    async readFile(filePath) {
        if (!this.isPathAllowed(filePath)) {
            throw {
                code: 'EACCES',
                message: `Access denied: ${filePath} is outside allowed directories`
            };
        }
        try {
            const fullPath = this.getFullPath(filePath);
            const content = await fs_extra_1.default.readFile(fullPath, 'utf8');
            return {
                path: filePath,
                content,
                encoding: 'utf8'
            };
        }
        catch (error) {
            logger_1.logger.error(`Error reading file ${filePath}:`, error);
            throw {
                code: error.code || 'ENOENT',
                message: `Error reading file: ${error.message}`,
                path: filePath
            };
        }
    }
    /**
     * Write content to a file
     */
    async writeFile(filePath, content) {
        if (this.readOnly) {
            throw {
                code: 'EACCES',
                message: 'Server is in read-only mode'
            };
        }
        if (!this.isPathAllowed(filePath)) {
            throw {
                code: 'EACCES',
                message: `Access denied: ${filePath} is outside allowed directories`
            };
        }
        try {
            const fullPath = this.getFullPath(filePath);
            // Ensure parent directory exists
            await fs_extra_1.default.ensureDir(path_1.default.dirname(fullPath));
            await fs_extra_1.default.writeFile(fullPath, content, 'utf8');
        }
        catch (error) {
            logger_1.logger.error(`Error writing file ${filePath}:`, error);
            throw {
                code: error.code || 'EIO',
                message: `Error writing file: ${error.message}`,
                path: filePath
            };
        }
    }
    /**
     * Create a new directory
     */
    async createDirectory(dirPath) {
        if (this.readOnly) {
            throw {
                code: 'EACCES',
                message: 'Server is in read-only mode'
            };
        }
        if (!this.isPathAllowed(dirPath)) {
            throw {
                code: 'EACCES',
                message: `Access denied: ${dirPath} is outside allowed directories`
            };
        }
        try {
            const fullPath = this.getFullPath(dirPath);
            await fs_extra_1.default.ensureDir(fullPath);
        }
        catch (error) {
            logger_1.logger.error(`Error creating directory ${dirPath}:`, error);
            throw {
                code: error.code || 'EIO',
                message: `Error creating directory: ${error.message}`,
                path: dirPath
            };
        }
    }
    /**
     * Delete a file or directory
     */
    async delete(itemPath, recursive = false) {
        if (this.readOnly) {
            throw {
                code: 'EACCES',
                message: 'Server is in read-only mode'
            };
        }
        if (!this.isPathAllowed(itemPath)) {
            throw {
                code: 'EACCES',
                message: `Access denied: ${itemPath} is outside allowed directories`
            };
        }
        try {
            const fullPath = this.getFullPath(itemPath);
            const stats = await fs_extra_1.default.stat(fullPath);
            if (stats.isDirectory()) {
                if (recursive) {
                    await fs_extra_1.default.remove(fullPath);
                }
                else {
                    await fs_extra_1.default.rmdir(fullPath);
                }
            }
            else {
                await fs_extra_1.default.unlink(fullPath);
            }
        }
        catch (error) {
            logger_1.logger.error(`Error deleting ${itemPath}:`, error);
            throw {
                code: error.code || 'EIO',
                message: `Error deleting item: ${error.message}`,
                path: itemPath
            };
        }
    }
}
// Export singleton instance
exports.fileSystemService = new FileSystemService();
