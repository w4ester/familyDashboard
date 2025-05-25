import React, { useState, useEffect } from 'react';
import { activityLogger, ActivityLog } from '../services/activity-logger';

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

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString();
  };

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

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 bg-amber-600 text-white p-3 rounded-full shadow-lg hover:bg-amber-700 z-40"
        title="Activity Log"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed bottom-20 left-4 w-96 max-h-96 bg-white rounded-lg shadow-xl z-40 overflow-hidden">
          <div className="bg-amber-600 text-white p-3 flex justify-between items-center">
            <h3 className="font-semibold">Activity Log</h3>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-2 border-b bg-gray-50">
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
          </div>

          <div className="overflow-y-auto max-h-64 p-2">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No activity yet</p>
            ) : (
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
            )}
          </div>

          <div className="p-2 border-t bg-gray-50 text-xs text-gray-600">
            Showing last {logs.length} activities
          </div>
        </div>
      )}
    </>
  );
}