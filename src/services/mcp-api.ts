/**
 * MCP API Service - Client for MCP Server
 * Provides filesystem access and tool invocation
 */

// File System Types
export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
  created?: Date;
}

export interface FileContent {
  path: string;
  content: string;
  encoding?: string;
}

export interface MCPToolRequest {
  tool: string;
  parameters: Record<string, any>;
}

export interface MCPToolResponse {
  content: Array<{
    type: string;
    text: string;
    [key: string]: any;
  }>;
}

export interface FileSystemError {
  code: string;
  message: string;
  path?: string;
}

// Default API configuration
const API_BASE_URL = process.env.REACT_APP_MCP_URL || 'http://localhost:3030';
const API_KEY = process.env.REACT_APP_MCP_API_KEY;

/**
 * MCP API Service
 */
class MCPApiService {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = API_BASE_URL, apiKey: string = API_KEY || '') {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Get headers for API requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  /**
   * Check server health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * List files and directories
   */
  async listFiles(path: string = '.'): Promise<FileInfo[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/filesystem/list?path=${encodeURIComponent(path)}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to list files');
      }

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('List files error:', error);
      throw error;
    }
  }

  /**
   * Read file content
   */
  async readFile(path: string): Promise<FileContent> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/filesystem/read?path=${encodeURIComponent(path)}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to read file');
      }

      const data = await response.json();
      return data.file || { path, content: '', encoding: 'utf8' };
    } catch (error) {
      console.error('Read file error:', error);
      throw error;
    }
  }

  /**
   * Write content to a file
   */
  async writeFile(path: string, content: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/filesystem/write`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ path, content })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to write file');
      }
    } catch (error) {
      console.error('Write file error:', error);
      throw error;
    }
  }

  /**
   * Create a directory
   */
  async createDirectory(path: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/filesystem/mkdir`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ path })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create directory');
      }
    } catch (error) {
      console.error('Create directory error:', error);
      throw error;
    }
  }

  /**
   * Delete a file or directory
   */
  async deleteItem(path: string, recursive: boolean = false): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/filesystem/delete`, {
        method: 'DELETE',
        headers: this.getHeaders(),
        body: JSON.stringify({ path, recursive })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Delete item error:', error);
      throw error;
    }
  }

  /**
   * List available MCP tools
   */
  async listTools(): Promise<{ name: string; description: string }[]> {
    try {
      const response = await fetch(`${this.baseUrl}/mcp/tools`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to list tools');
      }

      const data = await response.json();
      return data.tools || [];
    } catch (error) {
      console.error('List tools error:', error);
      throw error;
    }
  }

  /**
   * Invoke an MCP tool
   */
  async invokeTool(request: MCPToolRequest): Promise<MCPToolResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/mcp/tools/invoke`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to invoke tool');
      }

      return await response.json();
    } catch (error) {
      console.error('Invoke tool error:', error);
      throw error;
    }
  }

  /**
   * Upload a file to the server
   * This method first reads the file as array buffer, then writes it to the server
   */
  async uploadFile(file: File, targetPath: string): Promise<void> {
    try {
      // First create a FileReader to read the file
      const reader = new FileReader();
      
      // Create a promise to handle the FileReader's async behavior
      const readFileAsArrayBuffer = new Promise<ArrayBuffer>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
      });
      
      // Read the file as array buffer
      const arrayBuffer = await readFileAsArrayBuffer;
      
      // Convert to a text format (Base64)
      const base64String = this.arrayBufferToBase64(arrayBuffer);
      
      // Write the file to the server
      const fullPath = targetPath.endsWith('/') 
        ? `${targetPath}${file.name}` 
        : `${targetPath}/${file.name}`;
        
      await this.writeFile(fullPath, base64String);
    } catch (error) {
      console.error('Upload file error:', error);
      throw error;
    }
  }

  /**
   * Helper method to convert ArrayBuffer to Base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

// Export singleton instance
export const mcpApi = new MCPApiService();