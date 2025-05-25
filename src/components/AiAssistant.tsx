import React, { useState, useEffect } from 'react';
import { toolRegistry } from '../services/tool-registry';
import { registerFamilyTools } from '../services/family-dashboard-tools';
import { activityLogger } from '../services/activity-logger';

interface AiAssistantProps {
  onDataChange?: () => void;
}

// Register tools on component load
registerFamilyTools();

export default function AiAssistant({ onDataChange }: AiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const processCommand = async (command: string) => {
    const lower = command.toLowerCase();
    
    // Parse chore creation - handle the exact format from the test
    if (lower.includes('chore')) {
      // Pattern 1: "Create a chore for Dado to unload dishes worth 5 points"
      let match = command.match(/chore\s+for\s+(\w+)\s+to\s+(.+?)\s+worth\s+(\d+)\s+points?/i);
      
      if (match) {
        const [, person, choreName, points] = match;
        const result = await toolRegistry.execute('create_chore', {
          choreName: choreName.trim(),
          assignedTo: person,
          points: parseInt(points) || 2
        });
        
        // Log the AI command
        activityLogger.logAiCommand(
          'Current User',
          command,
          'create_chore',
          {
            success: result.success,
            parameters: { choreName: choreName.trim(), assignedTo: person, points: parseInt(points) || 2 },
            response: result.success ? result.data.message : result.error
          }
        );
        
        return result.success 
          ? `✅ ${result.data.message}`
          : `❌ Error: ${result.error}`;
      }
      
      // Pattern 2: "Create chore 'wash car' for Mom"
      match = command.match(/chore\s+['"](.+?)['"]\s+for\s+(\w+)/i);
      if (match) {
        const [, choreName, person] = match;
        const result = await toolRegistry.execute('create_chore', {
          choreName: choreName.trim(),
          assignedTo: person,
          points: 2
        });
        
        return result.success 
          ? `✅ ${result.data.message}`
          : `❌ Error: ${result.error}`;
      }
    }
    
    // Parse event creation
    if (lower.includes('event') || lower.includes('appointment')) {
      const eventMatch = command.match(/(?:event|appointment)\s+"([^"]+)"\s+for\s+(\w+)\s+on\s+(\S+)(?:\s+at\s+(\S+))?/i);
      
      if (eventMatch) {
        const [, title, person, date, time] = eventMatch;
        const result = await toolRegistry.execute('create_event', {
          title,
          person,
          date,
          time
        });
        
        return result.success 
          ? `✅ ${result.data.message}`
          : `❌ Error: ${result.error}`;
      }
    }
    
    // Parse assignment creation
    if (lower.includes('assignment') || lower.includes('homework')) {
      const assignMatch = command.match(/(?:assignment|homework)\s+"([^"]+)"\s+for\s+(\w+)\s+due\s+(\S+)/i);
      
      if (assignMatch) {
        const [, name, person, dueDate] = assignMatch;
        const result = await toolRegistry.execute('create_assignment', {
          name,
          person,
          dueDate
        });
        
        return result.success 
          ? `✅ ${result.data.message}`
          : `❌ Error: ${result.error}`;
      }
    }
    
    return "I can help you create chores, events, and assignments. Try these exact formats:\n\n" +
           '🏆 **Chores:**\n' +
           '• Create a chore for Dado to wash dishes worth 5 points\n' +
           '• Create chore "clean room" for Lily\n\n' +
           '📅 **Events:**\n' + 
           '• Create event "Soccer Practice" for Abel on 2025-05-25\n' +
           '• Create event "Dentist" for Mom on 2025-05-26 at 2:30pm\n\n' +
           '📚 **Assignments:**\n' +
           '• Create assignment "Math Homework" for Dado due 2025-05-27';
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    
    try {
      const response = await processCommand(input);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      
      // Notify parent of data change
      if (response.includes('✅') && onDataChange) {
        onDataChange();
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '❌ Error processing command' 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 bg-orange-500 text-white p-4 rounded-full shadow-lg hover:bg-orange-600 z-50"
        title="AI Assistant"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 w-96 bg-white rounded-lg shadow-xl z-50">
          <div className="bg-orange-500 text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-semibold">AI Assistant</h3>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="h-64 overflow-y-auto p-4 space-y-2">
            {messages.map((msg, i) => (
              <div key={i} className={`${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block p-2 rounded ${
                  msg.role === 'user' ? 'bg-orange-100' : 'bg-gray-100'
                }`}>
                  <pre className="whitespace-pre-wrap text-sm font-sans">{msg.content}</pre>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="text-left">
                <div className="inline-block p-2 bg-gray-100 rounded">
                  <span className="text-sm">Processing...</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="border-t p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Try: Create a chore for Dado to unload dishes worth 5 points"
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                disabled={isProcessing}
              />
              <button
                onClick={handleSend}
                disabled={isProcessing || !input.trim()}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}