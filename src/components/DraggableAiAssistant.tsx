import React, { useState, useEffect, useRef } from 'react';
import { toolRegistry } from '../services/tool-registry';
import { registerFamilyTools } from '../services/family-dashboard-tools';
import { registerChoreAssignmentTools } from '../services/chore-assignment-tools';
import { activityLogger } from '../services/activity-logger';

interface AiAssistantProps {
  onDataChange?: () => void;
}

// Register tools on component load
registerFamilyTools();
registerChoreAssignmentTools();

export default function DraggableAiAssistant({ onDataChange }: AiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Dragging state
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: window.innerHeight - 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const chatRef = useRef<HTMLDivElement>(null);

  // Load saved position
  useEffect(() => {
    const savedPosition = localStorage.getItem('ai-assistant-position');
    if (savedPosition) {
      const pos = JSON.parse(savedPosition);
      setPosition(pos);
    }
  }, []);

  // Save position when it changes
  useEffect(() => {
    localStorage.setItem('ai-assistant-position', JSON.stringify(position));
  }, [position]);

  // Handle mouse down on header
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  // Handle mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Keep within viewport bounds
      const maxX = window.innerWidth - (chatRef.current?.offsetWidth || 400);
      const maxY = window.innerHeight - (chatRef.current?.offsetHeight || 400);
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const processCommand = async (command: string) => {
    const lower = command.toLowerCase();
    
    // Parse chore creation - handle the exact format from the test
    if (lower.includes('chore')) {
      // Pattern 1: "Create a chore for Dado to unload dishes worth 5 points"
      let match = command.match(/chore\s+for\s+(\w+)\s+to\s+(.+?)\s+worth\s+(\d+)\s+points?/i);
      
      if (match) {
        const [, person, choreName, points] = match;
        // Use the new assignment tool, not instant completion
        const result = await toolRegistry.execute('assign_chore', {
          choreName: choreName.trim(),
          assignedTo: person,
          pointValue: parseInt(points) || 2
        });
        
        // Log the AI command
        activityLogger.logAiCommand(
          'Current User',
          command,
          'assign_chore',
          {
            success: result.success,
            parameters: { choreName: choreName.trim(), assignedTo: person, pointValue: parseInt(points) || 2 },
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
        const result = await toolRegistry.execute('assign_chore', {
          choreName: choreName.trim(),
          assignedTo: person,
          pointValue: 2
        });
        
        return result.success 
          ? `✅ ${result.data.message}`
          : `❌ Error: ${result.error}`;
      }
      
      // Pattern 3: "create chore 'Test' assigned to Alice worth 100 points"
      match = command.match(/chore\s+['"](.+?)['"]\s+assigned\s+to\s+(\w+)\s+worth\s+(\d+)\s+points?/i);
      if (match) {
        const [, choreName, person, points] = match;
        const result = await toolRegistry.execute('assign_chore', {
          choreName: choreName.trim(),
          assignedTo: person,
          pointValue: parseInt(points) || 2
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
    
    // Edit chore
    if ((lower.includes('edit') || lower.includes('change')) && lower.includes('chore')) {
      const match = command.match(/(?:edit|change)\s+chore\s+(\d+)(?:\s+to\s+(\d+)\s+points)?/i);
      if (match) {
        const [, assignmentId, points] = match;
        const params: any = { assignmentId };
        if (points) params.pointValue = parseInt(points);
        
        const result = await toolRegistry.execute('edit_chore', params);
        return result.success 
          ? `✅ ${result.data.message}`
          : `❌ Error: ${result.error}`;
      }
    }
    
    // Delete operations
    if (lower.includes('delete') || lower.includes('remove')) {
      // Delete chore
      if (lower.includes('chore')) {
        const match = command.match(/(?:delete|remove)\s+chore\s+(\d+)/i);
        if (match) {
          const result = await toolRegistry.execute('delete_chore', { assignmentId: match[1] });
          return result.success 
            ? `✅ ${result.data.message}`
            : `❌ Error: ${result.error}`;
        }
      }
      // Delete event
      if (lower.includes('event')) {
        const match = command.match(/(?:delete|remove)\s+event\s+(\d+)/i);
        if (match) {
          const result = await toolRegistry.execute('delete_event', { eventId: parseInt(match[1]) });
          return result.success 
            ? `✅ ${result.data.message}`
            : `❌ Error: ${result.error}`;
        }
      }
      // Delete assignment
      if (lower.includes('assignment')) {
        const match = command.match(/(?:delete|remove)\s+assignment\s+(\d+)/i);
        if (match) {
          const result = await toolRegistry.execute('delete_assignment', { assignmentId: parseInt(match[1]) });
          return result.success 
            ? `✅ ${result.data.message}`
            : `❌ Error: ${result.error}`;
        }
      }
    }
    
    // Complete chore
    if (lower.includes('complete') || lower.includes('done') || lower.includes('finished')) {
      const match = command.match(/(?:complete|done|finished)\s+(?:with\s+)?chore\s+(\d+)/i);
      if (match) {
        const result = await toolRegistry.execute('mark_chore_complete', { assignmentId: match[1] });
        return result.success 
          ? `✅ ${result.data.message}`
          : `❌ Error: ${result.error}`;
      }
    }
    
    // Verify chore
    if (lower.includes('verify') || lower.includes('approve')) {
      const match = command.match(/(?:verify|approve)\s+chore\s+(\d+)\s+(?:by\s+)?(\w+)/i);
      if (match) {
        const result = await toolRegistry.execute('verify_chore', {
          assignmentId: match[1],
          approved: true,
          verifiedBy: match[2] || 'Parent'
        });
        return result.success 
          ? `✅ ${result.data.message}`
          : `❌ Error: ${result.error}`;
      }
    }
    
    // Add family member
    if (lower.includes('add') && (lower.includes('family') || lower.includes('member') || lower.includes('as a'))) {
      const match = command.match(/add\s+(\w+)\s+as\s+(?:a\s+)?(parent|child)/i);
      if (match) {
        const result = await toolRegistry.execute('add_family_member', {
          name: match[1],
          role: match[2]
        });
        return result.success 
          ? `✅ ${result.data.message}`
          : `❌ Error: ${result.error}`;
      }
    }
    
    // List/show operations
    if (lower.includes('list') || lower.includes('show')) {
      if (lower.includes('chore')) {
        const result = await toolRegistry.execute('list_assigned_chores', {});
        if (result.success && result.data.assignments.length > 0) {
          const assignments = result.data.assignments.map((a: any) => 
            `• ${a.choreName} - ${a.assignedTo} (${a.pointValue} pts) - ${a.status} [ID: ${a.id}]`
          ).join('\n');
          return `📋 Current Chore Assignments:\n${assignments}`;
        }
        return '📋 No chore assignments yet';
      }
      if (lower.includes('everything') || lower.includes('all')) {
        const result = await toolRegistry.execute('list_all', { category: 'all' });
        if (result.success) {
          let response = '📊 Dashboard Overview:\n\n';
          if (result.data.familyMembers?.length > 0) {
            response += `👨‍👩‍👧‍👦 Family: ${result.data.familyMembers.join(', ')}\n\n`;
          }
          if (result.data.choreAssignments?.length > 0) {
            response += `🧹 Active Chores: ${result.data.choreAssignments.length}\n`;
          }
          if (result.data.events?.length > 0) {
            response += `📅 Upcoming Events: ${result.data.events.length}\n`;
          }
          if (result.data.assignments?.length > 0) {
            response += `📚 School Assignments: ${result.data.assignments.length}\n`;
          }
          return response;
        }
      }
    }
    
    // Points summary
    if (lower.includes('points') || lower.includes('score')) {
      try {
        const result = await toolRegistry.execute('get_points_summary', {});
        console.log('Points summary result:', result); // Debug log
        
        if (result.success) {
          const pointTotals = result.data.pointTotals || {};
          const totalPoints = result.data.totalPoints || 0;
          
          if (Object.keys(pointTotals).length > 0) {
            const summaries = Object.entries(pointTotals)
              .map(([person, points]) => `• ${person}: ${points} points`)
              .join('\n');
            return `🏆 Points Summary:\n${summaries}\n\nTotal: ${totalPoints} points`;
          }
        }
      } catch (error) {
        console.error('Error getting points summary:', error);
      }
      return '🏆 No points earned yet!';
    }
    
    // Edit event
    if ((lower.includes('edit') || lower.includes('change')) && lower.includes('event')) {
      const match = command.match(/(?:edit|change)\s+event\s+(\d+)\s+to\s+(.+)/i);
      if (match) {
        const [, eventId, time] = match;
        const result = await toolRegistry.execute('edit_event', {
          eventId: parseInt(eventId),
          time
        });
        return result.success 
          ? `✅ ${result.data.message}`
          : `❌ Error: ${result.error}`;
      }
    }
    
    // Edit assignment
    if ((lower.includes('edit') || lower.includes('mark')) && lower.includes('assignment')) {
      const match = command.match(/(?:edit|mark)\s+assignment\s+(\d+)\s+(completed|done)/i);
      if (match) {
        const [, assignmentId] = match;
        const result = await toolRegistry.execute('edit_assignment', {
          assignmentId: parseInt(assignmentId),
          completed: true
        });
        return result.success 
          ? `✅ ${result.data.message}`
          : `❌ Error: ${result.error}`;
      }
    }
    
    return "I can help you manage everything on your family dashboard! Try these commands:\n\n" +
           '🏆 **Chore Management:**\n' +
           '• Create a chore for Dado to wash dishes worth 5 points\n' +
           '• Edit chore ABC123 to 8 points\n' +
           '• Delete chore XYZ789\n' +
           '• Complete chore ABC123\n' +
           '• Verify chore ABC123 by Mom\n' +
           '• List chores\n\n' +
           '📅 **Events:**\n' + 
           '• Create event "Soccer Practice" for Abel on 2025-05-25\n' +
           '• Edit event 12345 to 3:00pm\n' +
           '• Delete event 12345\n\n' +
           '📚 **School Assignments:**\n' +
           '• Create assignment "Math Homework" for Dado due 2025-05-27\n' +
           '• Edit assignment 12345 completed\n' +
           '• Delete assignment 12345\n\n' +
           '👨‍👩‍👧‍👦 **Family:**\n' +
           '• Add Sarah as a child\n' +
           '• Add Mom as a parent\n\n' +
           '📊 **Reports:**\n' +
           '• Show points\n' +
           '• List everything\n\n' +
           '💡 **Note:** Chores are assigned as jobs. Kids complete them, then parents verify to award points!';
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
        <div 
          ref={chatRef}
          className="fixed w-96 bg-white rounded-lg shadow-xl z-50"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            cursor: isDragging ? 'grabbing' : 'default'
          }}
        >
          <div 
            className="bg-orange-500 text-white p-4 rounded-t-lg flex justify-between items-center cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <h3 className="font-semibold select-none">AI Assistant</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPosition({ x: window.innerWidth - 420, y: window.innerHeight - 500 })}
                className="text-white hover:text-gray-200"
                title="Reset position"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
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