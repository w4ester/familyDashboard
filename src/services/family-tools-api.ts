/**
 * Family Dashboard Tools API - PierUP style implementation
 * Direct API calls to execute AI tools that update dashboard state
 */

export interface ToolExecutionRequest {
  toolName: string;
  parameters: Record<string, any>;
  sessionId?: string;
}

export interface ToolExecutionResponse {
  success: boolean;
  result?: any;
  error?: string;
  stateUpdates?: {
    choreEntries?: any[];
    events?: any[];
    assignments?: any[];
    familyMembers?: string[];
  };
}

class FamilyToolsAPI {
  private baseUrl = 'http://localhost:3031/api/tools';

  /**
   * Execute a tool function on the backend
   */
  async executeTool(request: ToolExecutionRequest): Promise<ToolExecutionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Tool execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get available tools and their specifications
   */
  async getAvailableTools(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/list`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to get tools:', error);
      return [];
    }
  }

  /**
   * Create a new chore using the tool API
   */
  async createChore(params: {
    choreName: string;
    assignedTo: string;
    points?: number;
    frequency?: string;
  }): Promise<ToolExecutionResponse> {
    return this.executeTool({
      toolName: 'create_chore',
      parameters: params,
    });
  }

  /**
   * Create a calendar event using the tool API
   */
  async createCalendarEvent(params: {
    title: string;
    date: string;
    time?: string;
    person: string;
    location?: string;
  }): Promise<ToolExecutionResponse> {
    return this.executeTool({
      toolName: 'create_calendar_event',
      parameters: params,
    });
  }

  /**
   * Create an assignment using the tool API
   */
  async createAssignment(params: {
    assignmentName: string;
    subject?: string;
    dueDate: string;
    person: string;
    priority?: string;
  }): Promise<ToolExecutionResponse> {
    return this.executeTool({
      toolName: 'create_assignment',
      parameters: params,
    });
  }

  /**
   * Add a family member using the tool API
   */
  async addFamilyMember(params: {
    name: string;
    age?: number;
    role?: string;
  }): Promise<ToolExecutionResponse> {
    return this.executeTool({
      toolName: 'add_family_member',
      parameters: params,
    });
  }
}

// Export singleton instance
export const familyToolsAPI = new FamilyToolsAPI();