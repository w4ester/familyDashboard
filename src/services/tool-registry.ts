/**
 * Tool Registry - Central registry for all AI tools
 * Manages tool definitions, execution, and validation
 */

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (params: any) => Promise<any>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  
  /**
   * Register a new tool
   */
  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      console.warn(`Tool ${tool.name} is already registered, overwriting...`);
    }
    this.tools.set(tool.name, tool);
    console.log(`Registered tool: ${tool.name}`);
  }
  
  /**
   * Get a tool by name
   */
  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }
  
  /**
   * Get all registered tools
   */
  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }
  
  /**
   * Get tool names
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }
  
  /**
   * Execute a tool
   */
  async execute(toolName: string, params: any): Promise<ToolResult> {
    const tool = this.tools.get(toolName);
    
    if (!tool) {
      return {
        success: false,
        error: `Tool ${toolName} not found`
      };
    }
    
    try {
      // Validate required parameters
      if (tool.parameters.required) {
        for (const required of tool.parameters.required) {
          if (!(required in params)) {
            return {
              success: false,
              error: `Missing required parameter: ${required}`
            };
          }
        }
      }
      
      // Execute the tool
      const result = await tool.execute(params);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error(`Tool execution error (${toolName}):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get OpenAI-compatible function definitions
   */
  getOpenAIFunctions(): any[] {
    return this.getAllTools().map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }));
  }
}

// Export singleton instance
export const toolRegistry = new ToolRegistry();