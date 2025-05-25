# 🤖 AI Assistant (Buddy)

## Overview
The AI Assistant, nicknamed "Buddy", provides natural language interaction to create chores, events, and assignments without navigating through forms.

## Location in Codebase
- **Component**: `src/components/DraggableAiAssistant.tsx`
- **Original**: `src/components/AiAssistant.tsx`
- **Services**: `src/services/tool-registry.ts`, `src/services/family-dashboard-tools.ts`
- **Integration**: `src/App.tsx` (lines 97-103)

## Architecture

### 1. Tool Registry Pattern
```typescript
// src/services/tool-registry.ts
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

class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  
  register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }
  
  async execute(toolName: string, params: any) {
    const tool = this.tools.get(toolName);
    if (!tool) throw new Error(`Tool ${toolName} not found`);
    
    try {
      const result = await tool.execute(params);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

### 2. Pattern Matching System
```typescript
// src/components/DraggableAiAssistant.tsx
const processCommand = async (command: string) => {
  const lower = command.toLowerCase();
  
  // Chore patterns
  if (lower.includes('chore')) {
    // Pattern: "Create a chore for NAME to TASK worth X points"
    let match = command.match(
      /chore\s+for\s+(\w+)\s+to\s+(.+?)\s+worth\s+(\d+)\s+points?/i
    );
    
    if (match) {
      const [, person, choreName, points] = match;
      const result = await toolRegistry.execute('create_chore', {
        choreName: choreName.trim(),
        assignedTo: person,
        points: parseInt(points) || 2
      });
      
      // Log the command
      activityLogger.logAiCommand(
        'Current User',
        command,
        'create_chore',
        { success: result.success, parameters, response }
      );
      
      return result.success 
        ? `✅ ${result.data.message}`
        : `❌ Error: ${result.error}`;
    }
  }
  
  // Event patterns
  if (lower.includes('event') || lower.includes('appointment')) {
    const eventMatch = command.match(
      /(?:event|appointment)\s+"([^"]+)"\s+for\s+(\w+)\s+on\s+(\S+)(?:\s+at\s+(\S+))?/i
    );
    // ... handle event creation
  }
  
  // Assignment patterns
  if (lower.includes('assignment') || lower.includes('homework')) {
    const assignMatch = command.match(
      /(?:assignment|homework)\s+"([^"]+)"\s+for\s+(\w+)\s+due\s+(\S+)/i
    );
    // ... handle assignment creation
  }
};
```

## Features

### 1. Draggable Interface
```typescript
// Position tracking
const [position, setPosition] = useState({ 
  x: window.innerWidth - 420, 
  y: window.innerHeight - 500 
});

// Mouse drag handling
const handleMouseDown = (e: React.MouseEvent) => {
  setIsDragging(true);
  setDragStart({
    x: e.clientX - position.x,
    y: e.clientY - position.y
  });
};

// Persist position
useEffect(() => {
  localStorage.setItem('ai-assistant-position', JSON.stringify(position));
}, [position]);
```

### 2. Command Examples
```typescript
const helpMessage = `
🏆 **Chores:**
• Create a chore for Dado to wash dishes worth 5 points
• Create chore "clean room" for Lily

📅 **Events:**
• Create event "Soccer Practice" for Abel on 2025-05-25
• Create event "Dentist" for Mom on 2025-05-26 at 2:30pm

📚 **Assignments:**
• Create assignment "Math Homework" for Dado due 2025-05-27
`;
```

### 3. Real-time Data Updates
```typescript
// Notify parent component on success
if (response.includes('✅') && onDataChange) {
  onDataChange();
}

// Parent component auto-refreshes
useEffect(() => {
  const interval = setInterval(() => {
    loadAllData();
  }, 5000); // Every 5 seconds
  
  return () => clearInterval(interval);
}, []);
```

## Tool Implementations

### Create Chore Tool
```typescript
// src/services/family-dashboard-tools.ts
toolRegistry.register({
  name: 'create_chore',
  description: 'Create a new chore for a family member',
  parameters: {
    type: 'object',
    properties: {
      choreName: { type: 'string', description: 'Name of the chore' },
      assignedTo: { type: 'string', description: 'Family member' },
      points: { type: 'number', minimum: 1, maximum: 10 }
    },
    required: ['choreName', 'assignedTo']
  },
  execute: async (params) => {
    const { choreName, assignedTo, points = 2 } = params;
    
    // Load current data
    const data = await dataService.loadData();
    
    // Update point values
    if (!data.pointValues[choreName]) {
      data.pointValues[choreName] = points;
    }
    
    // Create chore entry
    const newEntry = {
      id: Date.now(),
      person: assignedTo,
      chore: choreName,
      timestamp: new Date().toLocaleString(),
      points: data.pointValues[choreName]
    };
    
    data.choreEntries.push(newEntry);
    await dataService.saveData(data);
    
    // Log the action
    activityLogger.logChoreAction(
      'System',
      `Created chore "${choreName}"`,
      { choreName, assignedTo, points, id: newEntry.id }
    );
    
    return {
      entry: newEntry,
      message: `Created chore "${choreName}" for ${assignedTo} (${points} points)`
    };
  }
});
```

## UI Components

### Chat Interface
```html
<!-- Header (draggable) -->
<div className="bg-orange-500 text-white p-4 rounded-t-lg cursor-grab">
  <h3>AI Assistant</h3>
  <button title="Reset position">↻</button>
  <button title="Close">×</button>
</div>

<!-- Message area -->
<div className="h-64 overflow-y-auto p-4">
  <!-- User message -->
  <div className="text-right">
    <div className="bg-orange-100 p-2 rounded">
      Create chore vacuum for Sarah worth 4 points
    </div>
  </div>
  
  <!-- AI response -->
  <div className="text-left">
    <div className="bg-gray-100 p-2 rounded">
      ✅ Created chore "vacuum" for Sarah (4 points)
    </div>
  </div>
</div>

<!-- Input area -->
<div className="border-t p-4">
  <input 
    type="text" 
    placeholder="Try: Create a chore for Dado..."
    onKeyPress={e => e.key === 'Enter' && handleSend()}
  />
  <button onClick={handleSend}>Send</button>
</div>
```

### Visual States
```typescript
// Processing indicator
{isProcessing && (
  <div className="inline-block p-2 bg-gray-100 rounded">
    <span className="text-sm">Processing...</span>
  </div>
)}

// Success/Error formatting
return result.success 
  ? `✅ ${result.data.message}`  // Green checkmark
  : `❌ Error: ${result.error}`; // Red X
```

## Integration Points

### With Dashboard
```typescript
// src/App.tsx
<DraggableAiAssistant 
  onDataChange={() => {
    // Dashboard auto-refreshes due to interval
    console.log('Data changed by AI');
  }}
/>
```

### With Activity Logger
```typescript
activityLogger.logAiCommand(
  'Current User',
  command,
  'create_chore',
  {
    success: result.success,
    parameters: { choreName, assignedTo, points },
    response: result.data?.message || result.error
  }
);
```

## Pattern Recognition Examples

### Supported Patterns
```text
✅ "Create a chore for Jake to clean room worth 5 points"
✅ "Create chore 'wash car' for Mom"
✅ "Add event 'Soccer Practice' for Tim on 2025-05-31"
✅ "Create assignment 'Math Test' for Sarah due tomorrow"
```

### Edge Cases Handled
```text
- Missing points → Defaults to 2
- No time for event → Time field left empty
- New family member → Automatically added
- Typos → Flexible pattern matching
```

## Future Enhancements

### 1. Voice Input
```typescript
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.onresult = (event) => {
  const command = event.results[0][0].transcript;
  processCommand(command);
};
```

### 2. Smart Suggestions
```typescript
const suggestions = [
  "It's Monday - time for weekly chores!",
  "Jake hasn't done chores in 3 days",
  "Upcoming: Soccer practice tomorrow at 4pm"
];
```

### 3. Multi-step Conversations
```typescript
// Context tracking
const [context, setContext] = useState<ConversationContext>({
  lastTopic: null,
  pendingInfo: {}
});

// Handle follow-ups
"AI: Who should I assign this chore to?"
"User: Jake"
"AI: ✅ Created chore 'vacuum' for Jake (2 points)"
```

## Benefits
1. **Natural Interaction**: Type like you talk
2. **Speed**: Faster than filling forms
3. **Accessibility**: Great for all ages
4. **Flexibility**: Handle various phrasings
5. **Learning**: Shows correct format in help