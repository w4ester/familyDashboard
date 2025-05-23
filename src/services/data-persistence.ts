/**
 * Data Persistence Service
 * Handles saving and loading family dashboard data using the local MCP server
 * Data is stored in actual files on your computer, not in browser storage
 */

import { mcpApi } from './mcp-api';

// Define the data structure
export interface FamilyData {
  choreEntries: any[];
  pointValues: Record<string, number>;
  assignments: any[];
  events: any[];
  familyMembers: string[];
  files: any[];
  platforms?: any[];
  lastUpdated: string;
}

// Data file paths on your local computer
const DATA_DIR = 'family-data';
const DATA_FILE = `${DATA_DIR}/family-data.json`;
const BACKUP_FILE = `${DATA_DIR}/family-data-backup.json`;

class DataPersistenceService {
  constructor() {
    this.initializeDataDirectory();
  }

  /**
   * Initialize the data directory on your computer
   */
  private async initializeDataDirectory() {
    try {
      await mcpApi.createDirectory(DATA_DIR);
      console.log('Data directory created at:', DATA_DIR);
    } catch (error) {
      console.log('Data directory might already exist:', error);
    }
  }

  /**
   * Load all family data from your computer
   */
  async loadData(): Promise<FamilyData> {
    try {
      const fileContent = await mcpApi.readFile(DATA_FILE);
      const data = JSON.parse(fileContent.content);
      return data;
    } catch (error) {
      console.log('No existing data found, creating new data file');
      // Return default data structure
      const defaultData = this.getDefaultData();
      await this.saveData(defaultData);
      return defaultData;
    }
  }

  /**
   * Save all family data to your computer
   */
  async saveData(data: Partial<FamilyData>): Promise<void> {
    try {
      // Load current data to merge with updates
      let currentData: FamilyData;
      try {
        currentData = await this.loadData();
      } catch {
        currentData = this.getDefaultData();
      }
      
      // Merge data
      const updatedData: FamilyData = {
        ...currentData,
        ...data,
        lastUpdated: new Date().toISOString()
      };
      
      // Create backup of current data
      try {
        const currentContent = await mcpApi.readFile(DATA_FILE);
        await mcpApi.writeFile(BACKUP_FILE, currentContent.content);
      } catch (error) {
        console.log('No existing data to backup');
      }
      
      // Save new data
      await mcpApi.writeFile(DATA_FILE, JSON.stringify(updatedData, null, 2));
      console.log('Data saved successfully to your computer');
    } catch (error) {
      console.error('Error saving data:', error);
      throw error;
    }
  }

  /**
   * Load specific data types
   */
  async loadChoreEntries(): Promise<any[]> {
    const data = await this.loadData();
    return data.choreEntries || [];
  }

  async loadPointValues(): Promise<Record<string, number>> {
    const data = await this.loadData();
    return data.pointValues || this.getDefaultPointValues();
  }

  async loadAssignments(): Promise<any[]> {
    const data = await this.loadData();
    return data.assignments || [];
  }

  async loadEvents(): Promise<any[]> {
    const data = await this.loadData();
    return data.events || [];
  }

  async loadFamilyMembers(): Promise<string[]> {
    const data = await this.loadData();
    return data.familyMembers || [];
  }

  async loadFiles(): Promise<any[]> {
    const data = await this.loadData();
    return data.files || [];
  }

  /**
   * Save specific data types
   */
  async saveChoreEntries(choreEntries: any[]): Promise<void> {
    await this.saveData({ choreEntries });
  }

  async savePointValues(pointValues: Record<string, number>): Promise<void> {
    await this.saveData({ pointValues });
  }

  async saveAssignments(assignments: any[]): Promise<void> {
    await this.saveData({ assignments });
  }

  async saveEvents(events: any[]): Promise<void> {
    await this.saveData({ events });
  }

  async saveFamilyMembers(familyMembers: string[]): Promise<void> {
    await this.saveData({ familyMembers });
  }

  async saveFiles(files: any[]): Promise<void> {
    await this.saveData({ files });
  }

  /**
   * Get default data structure
   */
  private getDefaultData(): FamilyData {
    return {
      choreEntries: [],
      pointValues: this.getDefaultPointValues(),
      assignments: [],
      events: [],
      familyMembers: [],
      files: [],
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get default point values
   */
  private getDefaultPointValues(): Record<string, number> {
    return {
      'Dishes': 2,
      'Vacuum': 3,
      'Take out trash': 1,
      'Make bed': 1,
      'Laundry': 3,
      'Clean bathroom': 5
    };
  }

  /**
   } Export data for download/backup
   */
  async exportData(): Promise<string> {
    const data = await this.loadData();
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data from JSON string
   */
  async importData(jsonString: string): Promise<void> {
    try {
      const data = JSON.parse(jsonString);
      await this.saveData(data);
    } catch (error) {
      throw new Error('Invalid data format');
    }
  }

  /**
   * Get backup file if needed
   */
  async getBackup(): Promise<string> {
    try {
      const backup = await mcpApi.readFile(BACKUP_FILE);
      return backup.content;
    } catch (error) {
      throw new Error('No backup available');
    }
  }
}

// Export singleton instance
export const dataService = new DataPersistenceService();