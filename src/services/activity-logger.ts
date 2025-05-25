export interface ActivityLog {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  details: any;
  category: 'chore' | 'event' | 'assignment' | 'points' | 'ai_command' | 'system';
  result: 'success' | 'error';
}

class ActivityLogger {
  private logs: ActivityLog[] = [];
  private maxLogs = 100;
  private storageKey = 'family-dashboard-activity-logs';

  constructor() {
    this.loadLogs();
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

  private saveLogs() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
    } catch (error) {
      console.error('Error saving activity logs:', error);
    }
  }

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
    window.dispatchEvent(new CustomEvent('activity-logged', { detail: newLog }));
  }

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

  logChoreAction(user: string, action: string, choreDetails: any) {
    this.log({
      user,
      action: `Chore: ${action}`,
      details: choreDetails,
      category: 'chore',
      result: 'success'
    });
  }

  logEventAction(user: string, action: string, eventDetails: any) {
    this.log({
      user,
      action: `Event: ${action}`,
      details: eventDetails,
      category: 'event',
      result: 'success'
    });
  }

  logAssignmentAction(user: string, action: string, assignmentDetails: any) {
    this.log({
      user,
      action: `Assignment: ${action}`,
      details: assignmentDetails,
      category: 'assignment',
      result: 'success'
    });
  }

  logPointsAction(user: string, action: string, pointsDetails: any) {
    this.log({
      user,
      action: `Points: ${action}`,
      details: pointsDetails,
      category: 'points',
      result: 'success'
    });
  }

  getLogs(filter?: { category?: string; user?: string; limit?: number }): ActivityLog[] {
    let filtered = [...this.logs];

    if (filter?.category) {
      filtered = filtered.filter(log => log.category === filter.category);
    }

    if (filter?.user) {
      filtered = filtered.filter(log => log.user === filter.user);
    }

    if (filter?.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  getRecentLogs(count: number = 10): ActivityLog[] {
    return this.logs.slice(0, count);
  }

  clearLogs() {
    this.logs = [];
    this.saveLogs();
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const activityLogger = new ActivityLogger();