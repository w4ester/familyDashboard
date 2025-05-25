# 💾 Data Persistence System

## Overview
The data persistence system ensures all family data is saved reliably using multiple fallback methods: MCP server file storage, browser localStorage, and auto-sync capabilities.

## Location in Codebase
- **Primary Service**: `src/services/data-persistence-mcp.ts`
- **Fallback Service**: `src/services/data-persistence-with-fallback.ts`
- **MCP Server**: `server/mcp/src/exact-mcp-server.ts`
- **Storage Location**: `family-data/family-data.json`

## Architecture

### Data Structure
```typescript
interface FamilyData {
  familyMembers: string[];
  choreEntries: ChoreEntry[];
  pointValues: Record<string, number>;
  assignments: Assignment[];
  events: Event[];
  lastUpdated: string;
  version: string;
}
```

### Service Layers

#### 1. MCP Data Service
```typescript
// src/services/data-persistence-mcp.ts
class DataService {
  private mcpUrl = 'http://localhost:3030';
  private filePath = './family-data/family-data.json';
  
  async loadData(): Promise<FamilyData> {
    try {
      const response = await fetch(`${this.mcpUrl}/api/filesystem/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: this.filePath })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.content ? JSON.parse(data.content) : this.getDefaultData();
      }
    } catch (error) {
      console.error('MCP load error:', error);
      return this.loadFromLocalStorage();
    }
  }
  
  async saveData(data: FamilyData): Promise<void> {
    // Save to MCP server
    try {
      await fetch(`${this.mcpUrl}/api/filesystem/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: this.filePath,
          content: JSON.stringify(data, null, 2)
        })
      });
    } catch (error) {
      console.error('MCP save error:', error);
    }
    
    // Always save to localStorage as backup
    this.saveToLocalStorage(data);
  }
}
```

#### 2. LocalStorage Fallback
```typescript
private saveToLocalStorage(data: FamilyData): void {
  try {
    localStorage.setItem('family-dashboard-data', JSON.stringify(data));
    localStorage.setItem('family-dashboard-last-sync', new Date().toISOString());
  } catch (error) {
    console.error('LocalStorage save error:', error);
  }
}

private loadFromLocalStorage(): FamilyData {
  try {
    const stored = localStorage.getItem('family-dashboard-data');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('LocalStorage load error:', error);
  }
  return this.getDefaultData();
}
```

### MCP Server Implementation

#### File Operations
```typescript
// server/mcp/src/exact-mcp-server.ts
case "read_file":
  result = await readFile(args);
  break;

case "write_file":
  result = await writeFile(args);
  break;

async function readFile(args: any) {
  const { path } = args;
  
  if (!isPathAllowed(path)) {
    throw new Error("Access denied: Path not allowed");
  }
  
  const absolutePath = path.resolve(path);
  const content = await fs.readFile(absolutePath, 'utf-8');
  
  return {
    content,
    path: absolutePath,
    size: content.length
  };
}

async function writeFile(args: any) {
  const { path, content } = args;
  
  if (!isPathAllowed(path)) {
    throw new Error("Access denied: Path not allowed");
  }
  
  const absolutePath = path.resolve(path);
  const dir = path.dirname(absolutePath);
  
  // Ensure directory exists
  await mkdirp(dir);
  
  // Write file
  await fs.writeFile(absolutePath, content, 'utf-8');
  
  return {
    success: true,
    path: absolutePath,
    size: content.length
  };
}
```

## Features

### 1. Auto-sync
```typescript
// In FamilyDashboard component
useEffect(() => {
  const interval = setInterval(async () => {
    await loadAllData();
  }, 5000); // Sync every 5 seconds
  
  return () => clearInterval(interval);
}, []);
```

### 2. Conflict Resolution
```typescript
private mergeData(local: FamilyData, remote: FamilyData): FamilyData {
  // Use most recent data
  const localTime = new Date(local.lastUpdated).getTime();
  const remoteTime = new Date(remote.lastUpdated).getTime();
  
  if (localTime > remoteTime) {
    return local;
  }
  
  // Merge arrays to avoid data loss
  return {
    ...remote,
    choreEntries: this.mergeArrays(local.choreEntries, remote.choreEntries),
    events: this.mergeArrays(local.events, remote.events),
    assignments: this.mergeArrays(local.assignments, remote.assignments)
  };
}

private mergeArrays<T extends { id: number }>(arr1: T[], arr2: T[]): T[] {
  const map = new Map<number, T>();
  [...arr1, ...arr2].forEach(item => map.set(item.id, item));
  return Array.from(map.values());
}
```

### 3. Backup System
```typescript
async createBackup(): Promise<void> {
  const data = await this.loadData();
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const backupPath = `./family-data/backups/backup-${timestamp}.json`;
  
  await fetch(`${this.mcpUrl}/api/filesystem/write`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: backupPath,
      content: JSON.stringify(data, null, 2)
    })
  });
}
```

### 4. Data Migration
```typescript
private migrateData(data: any): FamilyData {
  // Handle old data formats
  if (!data.version) {
    // Pre-version data
    return {
      ...data,
      version: '1.0.0',
      lastUpdated: new Date().toISOString()
    };
  }
  
  // Future migrations
  if (data.version === '1.0.0' && CURRENT_VERSION === '2.0.0') {
    // Migrate to v2
  }
  
  return data;
}
```

## Data Flow

### Save Operation
```
1. User Action (add chore, event, etc.)
    ↓
2. Update React State
    ↓
3. Call dataService.saveData()
    ↓
4. Try MCP Server Save
    ↓ (success)        ↓ (failure)
5a. Write to file    5b. Log error
    ↓                    ↓
6. Save to localStorage (always)
    ↓
7. Emit save event
```

### Load Operation
```
1. Component Mount / Refresh
    ↓
2. Call dataService.loadData()
    ↓
3. Try MCP Server Load
    ↓ (success)        ↓ (failure)
4a. Parse file      4b. Load from localStorage
    ↓                    ↓
5. Merge if needed
    ↓
6. Update React State
```

## Error Handling

### Connection Errors
```typescript
async checkMCPConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${this.mcpUrl}/health`, {
      timeout: 2000
    });
    return response.ok;
  } catch {
    console.warn('MCP server not available, using localStorage');
    return false;
  }
}
```

### Data Validation
```typescript
private validateData(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  
  const required = ['familyMembers', 'choreEntries', 'pointValues'];
  return required.every(field => field in data);
}
```

### Recovery Methods
```typescript
async recoverData(): Promise<FamilyData> {
  // Try multiple sources
  const sources = [
    () => this.loadFromMCP(),
    () => this.loadFromLocalStorage(),
    () => this.loadFromBackup(),
    () => this.getDefaultData()
  ];
  
  for (const source of sources) {
    try {
      const data = await source();
      if (this.validateData(data)) {
        return data;
      }
    } catch (error) {
      continue;
    }
  }
  
  return this.getDefaultData();
}
```

## Security

### Path Validation
```typescript
function isPathAllowed(filepath: string): boolean {
  const absolutePath = path.resolve(filepath);
  for (const dir of allowedAbsoluteDirs) {
    if (absolutePath === dir || absolutePath.startsWith(dir + path.sep)) {
      return true;
    }
  }
  return false;
}
```

### Data Sanitization
```typescript
private sanitizeData(data: FamilyData): FamilyData {
  return {
    ...data,
    familyMembers: data.familyMembers.map(m => this.sanitizeString(m)),
    choreEntries: data.choreEntries.map(e => ({
      ...e,
      person: this.sanitizeString(e.person),
      chore: this.sanitizeString(e.chore)
    }))
  };
}

private sanitizeString(str: string): string {
  return str.replace(/[<>]/g, '').trim();
}
```

## Performance

### Debounced Saves
```typescript
private saveTimeout: NodeJS.Timeout | null = null;

async saveDataDebounced(data: FamilyData): Promise<void> {
  if (this.saveTimeout) {
    clearTimeout(this.saveTimeout);
  }
  
  this.saveTimeout = setTimeout(() => {
    this.saveData(data);
  }, 1000); // Wait 1 second before saving
}
```

### Caching
```typescript
private cache: {
  data: FamilyData | null;
  timestamp: number;
} = { data: null, timestamp: 0 };

async loadDataCached(): Promise<FamilyData> {
  const now = Date.now();
  if (this.cache.data && now - this.cache.timestamp < 5000) {
    return this.cache.data;
  }
  
  const data = await this.loadData();
  this.cache = { data, timestamp: now };
  return data;
}
```

## Benefits
1. **Reliability**: Multiple fallback methods
2. **Performance**: Local caching and debouncing
3. **Security**: Path validation and sanitization
4. **Flexibility**: Works online and offline
5. **Recovery**: Automatic backup and restore