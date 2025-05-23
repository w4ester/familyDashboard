"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mcpService = void 0;
const filesystem_1 = require("./filesystem");
const logger_1 = require("../utils/logger");
class MCPService {
    constructor() {
        this.tools = new Map();
        // Register built-in tools
        this.registerBuiltInTools();
    }
    /**
     * Register all built-in MCP tools
     */
    registerBuiltInTools() {
        // File System Tools
        this.registerTool({
            name: 'read_file',
            description: 'Read contents of a file',
            execute: async (params) => {
                try {
                    const path = params.path;
                    if (!path) {
                        throw new Error('path parameter is required');
                    }
                    const file = await filesystem_1.fileSystemService.readFile(path);
                    return {
                        content: [{ type: 'text', text: file.content }]
                    };
                }
                catch (error) {
                    logger_1.logger.error('Error in read_file tool:', error);
                    return {
                        content: [{ type: 'text', text: `Error: ${error.message}` }]
                    };
                }
            }
        });
        this.registerTool({
            name: 'write_file',
            description: 'Write content to a file',
            execute: async (params) => {
                try {
                    const path = params.path;
                    const content = params.content;
                    if (!path) {
                        throw new Error('path parameter is required');
                    }
                    if (content === undefined) {
                        throw new Error('content parameter is required');
                    }
                    await filesystem_1.fileSystemService.writeFile(path, content);
                    return {
                        content: [{ type: 'text', text: `Successfully wrote to ${path}` }]
                    };
                }
                catch (error) {
                    logger_1.logger.error('Error in write_file tool:', error);
                    return {
                        content: [{ type: 'text', text: `Error: ${error.message}` }]
                    };
                }
            }
        });
        this.registerTool({
            name: 'list_directory',
            description: 'List contents of a directory',
            execute: async (params) => {
                try {
                    const path = params.path || './';
                    const files = await filesystem_1.fileSystemService.listDirectory(path);
                    const fileList = files.map(file => {
                        return file.type === 'directory'
                            ? `[DIR] ${file.name}`
                            : `[FILE] ${file.name}${file.size !== undefined ? ` (${this.formatFileSize(file.size)})` : ''}`;
                    }).join('\n');
                    return {
                        content: [{ type: 'text', text: fileList || 'Directory is empty' }]
                    };
                }
                catch (error) {
                    logger_1.logger.error('Error in list_directory tool:', error);
                    return {
                        content: [{ type: 'text', text: `Error: ${error.message}` }]
                    };
                }
            }
        });
        this.registerTool({
            name: 'create_directory',
            description: 'Create a new directory',
            execute: async (params) => {
                try {
                    const path = params.path;
                    if (!path) {
                        throw new Error('path parameter is required');
                    }
                    await filesystem_1.fileSystemService.createDirectory(path);
                    return {
                        content: [{ type: 'text', text: `Successfully created directory ${path}` }]
                    };
                }
                catch (error) {
                    logger_1.logger.error('Error in create_directory tool:', error);
                    return {
                        content: [{ type: 'text', text: `Error: ${error.message}` }]
                    };
                }
            }
        });
        this.registerTool({
            name: 'delete',
            description: 'Delete a file or directory',
            execute: async (params) => {
                try {
                    const path = params.path;
                    const recursive = params.recursive === true;
                    if (!path) {
                        throw new Error('path parameter is required');
                    }
                    await filesystem_1.fileSystemService.delete(path, recursive);
                    return {
                        content: [{ type: 'text', text: `Successfully deleted ${path}` }]
                    };
                }
                catch (error) {
                    logger_1.logger.error('Error in delete tool:', error);
                    return {
                        content: [{ type: 'text', text: `Error: ${error.message}` }]
                    };
                }
            }
        });
    }
    /**
     * Register a new MCP tool
     */
    registerTool(tool) {
        this.tools.set(tool.name, tool);
        logger_1.logger.info(`Registered MCP tool: ${tool.name}`);
    }
    /**
     * Get a tool by name
     */
    getTool(name) {
        return this.tools.get(name);
    }
    /**
     * Get all registered tools
     */
    getAllTools() {
        return Array.from(this.tools.values());
    }
    /**
     * Execute a tool by name
     */
    async executeTool(name, params) {
        const tool = this.getTool(name);
        if (!tool) {
            logger_1.logger.error(`Tool not found: ${name}`);
            return {
                content: [{ type: 'text', text: `Error: Tool '${name}' not found` }]
            };
        }
        try {
            return await tool.execute(params);
        }
        catch (error) {
            logger_1.logger.error(`Error executing tool ${name}:`, error);
            return {
                content: [{ type: 'text', text: `Error executing ${name}: ${error.message}` }]
            };
        }
    }
    /**
     * Format file size in human-readable format
     */
    formatFileSize(bytes) {
        if (bytes < 1024)
            return bytes + ' bytes';
        if (bytes < 1024 * 1024)
            return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024)
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }
}
// Export singleton instance
exports.mcpService = new MCPService();
