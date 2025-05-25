/**
 * Data Persistence Service with MCP Client
 * Uses the exact MCP implementation with localStorage fallback
 */

import mcpClient from './mcp-client';

export interface FamilyData {
  choreEntries: any[];
  pointValues: Record<string, number>;
  assignments: any[];
  events: any[];
  familyMembers: string[];
  files: any[];
  platforms?: any[];
  familyRoles?: Record<string, 'parent' | 'child'>;
  lastUpdated: string;
}

class DataPersistenceServiceMCP {
  private useMcpServer: boolean = false;
  private dataPath = '/Users/willf/smartIndex/siguy/family-dashboard/family-data/family-data.json';
  
  constructor() {
    this.checkMcpAvailability();
  }

  private async checkMcpAvailability() {
    try {
      // Test if MCP server is reachable
      this.useMcpServer = await mcpClient.testConnection();
      console.log(this.useMcpServer ? 'Using MCP server for data persistence' : 'MCP server not available, using localStorage fallback');
    } catch (error) {
      this.useMcpServer = false;
      console.log('MCP server not available, using localStorage fallback');
    }
  }

  async loadData(): Promise<FamilyData> {
    if (this.useMcpServer) {
      try {
        const content = await mcpClient.readFile(this.dataPath);
        if (content) {
          return JSON.parse(content);
        }
      } catch (error) {
        console.log('Error loading from MCP, falling back to localStorage');
      }
    }
    
    // Fallback to localStorage
    const data = localStorage.getItem('familyData');
    if (data) {
      return JSON.parse(data);
    }
    
    // Return empty data structure
    return {
      choreEntries: [],
      pointValues: {},
      assignments: [],
      events: [],
      familyMembers: [],
      files: [],
      platforms: [],
      lastUpdated: new Date().toISOString()
    };
  }

  async saveData(data: FamilyData): Promise<void> {
    data.lastUpdated = new Date().toISOString();
    
    if (this.useMcpServer) {
      try {
        // Ensure directory exists
        await mcpClient.createDirectory('/Users/willf/smartIndex/siguy/family-dashboard/family-data');
        
        // Save to file
        const result = await mcpClient.writeFile(this.dataPath, JSON.stringify(data, null, 2));
        if (result) {
          return;
        }
      } catch (error) {
        console.log('Error saving to MCP, falling back to localStorage', error);
      }
    }
    
    // Fallback to localStorage
    localStorage.setItem('familyData', JSON.stringify(data));
  }

  // Convenience methods for individual data types
  async loadChoreEntries() {
    const data = await this.loadData();
    return data.choreEntries || [];
  }

  async saveChoreEntries(entries: any[]) {
    const data = await this.loadData();
    data.choreEntries = entries;
    await this.saveData(data);
  }

  async loadPointValues() {
    const data = await this.loadData();
    return data.pointValues || {};
  }

  async savePointValues(values: Record<string, number>) {
    const data = await this.loadData();
    data.pointValues = values;
    await this.saveData(data);
  }

  async loadAssignments() {
    const data = await this.loadData();
    return data.assignments || [];
  }

  async saveAssignments(assignments: any[]) {
    const data = await this.loadData();
    data.assignments = assignments;
    await this.saveData(data);
  }

  async loadEvents() {
    const data = await this.loadData();
    return data.events || [];
  }

  async saveEvents(events: any[]) {
    const data = await this.loadData();
    data.events = events;
    await this.saveData(data);
  }

  async loadFamilyMembers() {
    const data = await this.loadData();
    return data.familyMembers || [];
  }

  async saveFamilyMembers(members: string[]) {
    const data = await this.loadData();
    data.familyMembers = members;
    await this.saveData(data);
  }

  async loadFiles() {
    const data = await this.loadData();
    return data.files || [];
  }

  async saveFiles(files: any[]) {
    const data = await this.loadData();
    data.files = files;
    await this.saveData(data);
  }
}

export const dataService = new DataPersistenceServiceMCP();