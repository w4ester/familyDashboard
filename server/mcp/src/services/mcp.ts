import { MCPTool, MCPToolInvocationResponse } from '../types';
import { fileSystemService } from './filesystem';
import { logger } from '../utils/logger';

class MCPService {
  private tools: Map<string, MCPTool> = new Map();

  constructor() {
    // Register built-in tools
    this.registerBuiltInTools();
  }

  /**
   * Register all built-in MCP tools
   */
  private registerBuiltInTools(): void {
    // File System Tools
    this.registerTool({
      name: 'read_file',
      description: 'Read contents of a file',
      execute: async (params: Record<string, any>): Promise<MCPToolInvocationResponse> => {
        try {
          const path = params.path;
          if (!path) {
            throw new Error('path parameter is required');
          }

          const file = await fileSystemService.readFile(path);
          return {
            content: [{ type: 'text', text: file.content }]
          };
        } catch (error: any) {
          logger.error('Error in read_file tool:', error);
          return {
            content: [{ type: 'text', text: `Error: ${error.message}` }]
          };
        }
      }
    });

    this.registerTool({
      name: 'write_file',
      description: 'Write content to a file',
      execute: async (params: Record<string, any>): Promise<MCPToolInvocationResponse> => {
        try {
          const path = params.path;
          const content = params.content;
          
          if (!path) {
            throw new Error('path parameter is required');
          }
          
          if (content === undefined) {
            throw new Error('content parameter is required');
          }

          await fileSystemService.writeFile(path, content);
          return {
            content: [{ type: 'text', text: `Successfully wrote to ${path}` }]
          };
        } catch (error: any) {
          logger.error('Error in write_file tool:', error);
          return {
            content: [{ type: 'text', text: `Error: ${error.message}` }]
          };
        }
      }
    });

    this.registerTool({
      name: 'list_directory',
      description: 'List contents of a directory',
      execute: async (params: Record<string, any>): Promise<MCPToolInvocationResponse> => {
        try {
          const path = params.path || './';
          const files = await fileSystemService.listDirectory(path);
          
          const fileList = files.map(file => {
            return file.type === 'directory' 
              ? `[DIR] ${file.name}` 
              : `[FILE] ${file.name}${file.size !== undefined ? ` (${this.formatFileSize(file.size)})` : ''}`;
          }).join('\n');
          
          return {
            content: [{ type: 'text', text: fileList || 'Directory is empty' }]
          };
        } catch (error: any) {
          logger.error('Error in list_directory tool:', error);
          return {
            content: [{ type: 'text', text: `Error: ${error.message}` }]
          };
        }
      }
    });

    this.registerTool({
      name: 'create_directory',
      description: 'Create a new directory',
      execute: async (params: Record<string, any>): Promise<MCPToolInvocationResponse> => {
        try {
          const path = params.path;
          
          if (!path) {
            throw new Error('path parameter is required');
          }

          await fileSystemService.createDirectory(path);
          return {
            content: [{ type: 'text', text: `Successfully created directory ${path}` }]
          };
        } catch (error: any) {
          logger.error('Error in create_directory tool:', error);
          return {
            content: [{ type: 'text', text: `Error: ${error.message}` }]
          };
        }
      }
    });

    this.registerTool({
      name: 'delete',
      description: 'Delete a file or directory',
      execute: async (params: Record<string, any>): Promise<MCPToolInvocationResponse> => {
        try {
          const path = params.path;
          const recursive = params.recursive === true;
          
          if (!path) {
            throw new Error('path parameter is required');
          }

          await fileSystemService.delete(path, recursive);
          return {
            content: [{ type: 'text', text: `Successfully deleted ${path}` }]
          };
        } catch (error: any) {
          logger.error('Error in delete tool:', error);
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
  registerTool(tool: MCPTool): void {
    this.tools.set(tool.name, tool);
    logger.info(`Registered MCP tool: ${tool.name}`);
  }

  /**
   * Get a tool by name
   */
  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   */
  getAllTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Execute a tool by name
   */
  async executeTool(
    name: string, 
    params: Record<string, any>
  ): Promise<MCPToolInvocationResponse> {
    const tool = this.getTool(name);
    
    if (!tool) {
      logger.error(`Tool not found: ${name}`);
      return {
        content: [{ type: 'text', text: `Error: Tool '${name}' not found` }]
      };
    }
    
    try {
      return await tool.execute(params);
    } catch (error: any) {
      logger.error(`Error executing tool ${name}:`, error);
      return {
        content: [{ type: 'text', text: `Error executing ${name}: ${error.message}` }]
      };
    }
  }

  /**
   * Format file size in human-readable format
   */
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }
}

// Export singleton instance
export const mcpService = new MCPService();