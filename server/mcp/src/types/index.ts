// MCP Protocol Types

export interface MCPToolInvocationRequest {
  tool: string;
  parameters: Record<string, any>;
}

export interface MCPToolInvocationResponse {
  content: Array<{
    type: string;
    text: string;
    // Other possible content types (images, etc.)
    [key: string]: any;
  }>;
}

export interface MCPTool {
  name: string;
  description: string;
  execute: (params: Record<string, any>) => Promise<MCPToolInvocationResponse>;
}

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

export interface FileSystemError {
  code: string;
  message: string;
  path?: string;
}