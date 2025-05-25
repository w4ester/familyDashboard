# 📊 Activity Logs System

## Overview
The Activity Logs system tracks all actions in the Family Dashboard, providing transparency and helping families understand how the AI assistant and manual actions affect their data.

## Location in Codebase
- **Service**: `src/services/activity-logger.ts`
- **Component**: `src/components/ActivityLog.tsx`
- **Integration**: Throughout dashboard components

## Architecture

### Activity Log Structure
```typescript
export interface ActivityLog {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  details: any;
  category: 'chore' | 'event' | 'assignment' | 'points' | 'ai_command' | 'system';
  result: 'success' | 'error';
}
```

### Activity Logger Service
```typescript
class ActivityLogger {
  private logs: ActivityLog[] = [];
  private maxLogs = 100;
  private storageKey = 'family-dashboard-activity-logs';

  log(activity: Omit<ActivityLog, 'id' | 'timestamp'>) {
    const newLog: ActivityLog = {
      ...activity,
      id: Date.now().toString(),
      timestamp: new Date()
    };

    this.logs.unshift(newLog);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    this.saveLogs();
    
    // Emit event for real-time updates
    window.dispatchEvent(new CustomEvent('activity-logged', { 
      detail: newLog 
    }));
  }
}
```

## Logging Methods

### AI Command Logging
```typescript
logAiCommand(user: string, command: string, toolName: string, result: any) {
  this.log({
    user,
    action: `AI: "${command}"`,
    details: {
      command,
      toolName,
      parameters: result.parameters,
      response: result.response
    },
    category: 'ai_command',
    result: result.success ? 'success' : 'error'
  });
}
```

### Action-Specific Logging
```typescript
// Chore logging
logChoreAction(user: string, action: string, choreDetails: any) {
  this.log({
    user,
    action: `Chore: ${action}`,
    details: choreDetails,
    category: 'chore',
    result: 'success'
  });
}

// Event logging
logEventAction(user: string, action: string, eventDetails: any) {
  this.log({
    user,
    action: `Event: ${action}`,
    details: eventDetails,
    category: 'event',
    result: 'success'
  });
}
```

## Visual Component

### Log Viewer UI
```typescript
export default function ActivityLogViewer() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'ai_command' | 'chore' | 'event'>('all');

  useEffect(() => {
    const loadLogs = () => {
      const filtered = filter === 'all' 
        ? activityLogger.getRecentLogs(50)
        : activityLogger.getLogs({ category: filter as any, limit: 50 });
      setLogs(filtered);
    };

    loadLogs();

    // Listen for new logs
    const handleNewLog = () => loadLogs();
    window.addEventListener('activity-logged', handleNewLog);
    
    // Auto-refresh every 2 seconds
    const interval = setInterval(loadLogs, 2000);

    return () => {
      window.removeEventListener('activity-logged', handleNewLog);
      clearInterval(interval);
    };
  }, [filter]);
```

### Log Display
```typescript
<div className="space-y-1">
  {logs.map((log) => (
    <div 
      key={log.id} 
      className={`p-2 rounded text-sm ${
        log.result === 'error' ? 'bg-red-50' : 'bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-2">
        <span className="text-lg">{getIcon(log.category)}</span>
        <div className="flex-1">
          <div className="font-medium">{log.action}</div>
          {log.category === 'ai_command' && log.details?.command && (
            <div className="text-xs text-gray-600 mt-1">
              Command: "{log.details.command}"
            </div>
          )}
          <div className="text-xs text-gray-500 mt-1">
            {log.user} • {formatTime(log.timestamp)}
          </div>
        </div>
      </div>
    </div>
  ))}
</div>
```

### Category Filters
```typescript
<div className="flex gap-1">
  <button
    onClick={() => setFilter('all')}
    className={`px-3 py-1 rounded text-sm ${
      filter === 'all' ? 'bg-amber-500 text-white' : 'bg-gray-200'
    }`}
  >
    All
  </button>
  <button
    onClick={() => setFilter('ai_command')}
    className={`px-3 py-1 rounded text-sm ${
      filter === 'ai_command' ? 'bg-amber-500 text-white' : 'bg-gray-200'
    }`}
  >
    🤖 AI
  </button>
  <button
    onClick={() => setFilter('chore')}
    className={`px-3 py-1 rounded text-sm ${
      filter === 'chore' ? 'bg-amber-500 text-white' : 'bg-gray-200'
    }`}
  >
    🧹 Chores
  </button>
  <button
    onClick={() => setFilter('event')}
    className={`px-3 py-1 rounded text-sm ${
      filter === 'event' ? 'bg-amber-500 text-white' : 'bg-gray-200'
    }`}
  >
    📅 Events
  </button>
</div>
```

## Integration Examples

### In AI Assistant
```typescript
// After executing a command
activityLogger.logAiCommand(
  'Current User',
  command,
  'create_chore',
  {
    success: result.success,
    parameters: { choreName, assignedTo, points },
    response: result.success ? result.data.message : result.error
  }
);
```

### In Dashboard Actions
```typescript
// When manually adding a chore
activityLogger.logChoreAction(
  personName.trim(),
  `Completed chore "${choreName.trim()}"`,
  {
    choreName: choreName.trim(),
    points: pointValue,
    id: newEntry.id
  }
);
```

### In Tool Execution
```typescript
// Inside family-dashboard-tools.ts
activityLogger.logChoreAction(
  'System',
  `Created chore "${choreName}"`,
  {
    choreName,
    assignedTo,
    points,
    id: newEntry.id
  }
);
```

## Features

### 1. Real-time Updates
- New logs appear instantly
- Auto-refresh every 2 seconds
- Event-driven architecture

### 2. Filtering System
- Filter by category (AI, Chores, Events)
- User filtering (future feature)
- Time-based filtering (future feature)

### 3. Visual Indicators
```typescript
const getIcon = (category: string) => {
  switch (category) {
    case 'ai_command': return '🤖';
    case 'chore': return '🧹';
    case 'event': return '📅';
    case 'assignment': return '📚';
    case 'points': return '🏆';
    default: return '📝';
  }
};
```

### 4. Error Tracking
```typescript
// Logs show success/error status
className={`p-2 rounded text-sm ${
  log.result === 'error' ? 'bg-red-50' : 'bg-gray-50'
}`}
```

## Data Management

### Storage
```typescript
private saveLogs() {
  try {
    localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
  } catch (error) {
    console.error('Error saving activity logs:', error);
  }
}

private loadLogs() {
  try {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      this.logs = JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading activity logs:', error);
  }
}
```

### Export Functionality
```typescript
exportLogs(): string {
  return JSON.stringify(this.logs, null, 2);
}

// Usage
const exportData = () => {
  const data = activityLogger.exportLogs();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `activity-logs-${new Date().toISOString()}.json`;
  a.click();
};
```

## Access & Privacy

### User Visibility
- Accessible via amber button (bottom-left)
- Shows last 50-100 activities
- Clear, family-friendly language

### Privacy Features
- Logs stored locally only
- No external transmission
- Can be cleared anytime
- Family-specific data

## Benefits

1. **Transparency**: See what AI is doing
2. **Debugging**: Understand issues
3. **Accountability**: Track who did what
4. **Learning**: See command patterns
5. **Security**: Audit trail of changes

## Future Enhancements

### Analytics Dashboard
```typescript
const getStats = () => {
  const stats = {
    totalActions: logs.length,
    aiCommands: logs.filter(l => l.category === 'ai_command').length,
    successRate: logs.filter(l => l.result === 'success').length / logs.length,
    topUsers: // ... calculate
  };
  return stats;
};
```

### Advanced Filtering
```typescript
interface LogFilter {
  category?: string;
  user?: string;
  dateRange?: { start: Date; end: Date };
  searchTerm?: string;
}
```

### Notifications
```typescript
// Alert on errors
if (log.result === 'error') {
  showNotification(`Error: ${log.action}`);
}
```

### Log Retention Policies
```typescript
// Auto-cleanup old logs
const cleanupOldLogs = () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  this.logs = this.logs.filter(log => 
    new Date(log.timestamp) > thirtyDaysAgo
  );
};