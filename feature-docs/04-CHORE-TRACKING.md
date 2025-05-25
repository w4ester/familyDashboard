# 🧹 Chore Tracking System

## Overview
The chore tracking system gamifies household tasks by assigning points, tracking completion, and maintaining a leaderboard to motivate family members.

## Location in Codebase
- **Component**: `src/components/FamilyDashboard.tsx` (renderChoresTab function)
- **Lines**: 605-720
- **Data Storage**: `family-data/family-data.json`

## Core Data Structures

### Chore Entry
```typescript
interface ChoreEntry {
  id: number;          // Unique identifier (timestamp)
  person: string;      // Who completed it
  chore: string;       // Chore name
  timestamp: string;   // When completed
  points: number;      // Points earned
}
```

### Point Values
```typescript
// Stored as key-value pairs
pointValues: {
  "wash dishes": 3,
  "take out trash": 2,
  "clean room": 5,
  "vacuum": 4
}
```

## How It Works

### 1. Adding Chores Manually
```typescript
// src/components/FamilyDashboard.tsx (lines 161-191)
const handleChoreSubmit = async () => {
  if (personName.trim() === '' || choreName.trim() === '') {
    alert('Please enter both a name and a chore!');
    return;
  }
  
  const pointValue = pointValues[choreName.trim()] || 1;
  
  const newEntry = {
    id: Date.now(),
    person: personName.trim(),
    chore: choreName.trim(),
    timestamp: new Date().toLocaleString(),
    points: pointValue
  };
  
  setChoreEntries([...choreEntries, newEntry]);
  
  // Log the action
  activityLogger.logChoreAction(
    personName.trim(),
    `Completed chore "${choreName.trim()}"`,
    { choreName: choreName.trim(), points: pointValue, id: newEntry.id }
  );
};
```

### 2. AI-Powered Chore Creation
```typescript
// src/services/family-dashboard-tools.ts
toolRegistry.register({
  name: 'create_chore',
  description: 'Create a new chore for a family member',
  execute: async (params) => {
    const { choreName, assignedTo, points = 2 } = params;
    
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
    
    return {
      entry: newEntry,
      message: `Created chore "${choreName}" for ${assignedTo} (${points} points)`
    };
  }
});
```

### 3. Points Calculation
```typescript
// Calculate total points per person
const calculateTotalPoints = () => {
  const pointsMap: Record<string, number> = {};
  
  choreEntries.forEach(entry => {
    if (!pointsMap[entry.person]) {
      pointsMap[entry.person] = 0;
    }
    pointsMap[entry.person] += entry.points || 0;
  });
  
  // Convert to sorted array
  return Object.entries(pointsMap)
    .map(([person, points]) => ({ person, points }))
    .sort((a, b) => b.points - a.points);
};
```

## UI Components

### Chore Input Form
```html
<div className="bg-orange-50 p-4 rounded-lg mb-6">
  <h2>Add New Chore</h2>
  <select value={personName}>
    <!-- Family member options -->
  </select>
  <input 
    type="text" 
    placeholder="Chore"
    list="chore-suggestions"
  />
  <datalist id="chore-suggestions">
    <!-- Auto-complete from existing chores -->
  </datalist>
  <button onClick={handleChoreSubmit}>Add Entry</button>
</div>
```

### Points Leaderboard
```typescript
// Visual leaderboard with rankings
<div className="bg-yellow-50 p-3 rounded-lg">
  {calculateTotalPoints().map((entry, index) => (
    <div className="flex items-center mb-2">
      <div className="w-8 h-8 bg-yellow-100 rounded-full">
        {index + 1}
      </div>
      <div className="flex-1">{entry.person}</div>
      <div className="font-bold">{entry.points} points</div>
    </div>
  ))}
</div>
```

### Chore History
```typescript
// Scrollable list of completed chores
<div className="max-h-64 overflow-y-auto">
  {choreEntries.slice().reverse().map(entry => (
    <div className="border-b py-2">
      <span className="font-medium">{entry.person}</span>
      {' completed '}
      <span className="text-orange-600">{entry.chore}</span>
      {' • '}
      <span className="text-green-600">+{entry.points} points</span>
      <div className="text-xs text-gray-500">{entry.timestamp}</div>
    </div>
  ))}
</div>
```

## Point Management

### Setting Point Values
```typescript
// Admin panel for managing points
const handlePointValueSubmit = () => {
  if (newChoreType.trim()) {
    setPointValues({
      ...pointValues,
      [newChoreType.trim()]: newPointValue
    });
  }
};
```

### Default Point Values
```javascript
// Common chores with suggested points
{
  "wash dishes": 3,
  "take out trash": 2,
  "clean room": 5,
  "vacuum": 4,
  "laundry": 4,
  "mow lawn": 8,
  "clean bathroom": 6
}
```

## Features

### 1. Auto-completion
- Suggests existing chores as you type
- Remembers custom chores
- Shows point value preview

### 2. Visual Feedback
- Green "+X points" animation on add
- Star ratings (★) based on frequency
- Color-coded by person

### 3. Gamification Elements
- **Leaderboard**: Real-time rankings
- **Achievements**: Stars for repeated chores
- **Point Goals**: Can set weekly targets

### 4. Data Persistence
- Auto-saves to `family-data.json`
- Syncs across all open tabs
- Backup to localStorage

## AI Integration Examples

```text
User: "Create chore vacuum living room for Sarah worth 4 points"
AI: ✅ Created chore "vacuum living room" for Sarah (4 points)

User: "Add chore 'feed pets' for Tommy"
AI: ✅ Created chore "feed pets" for Tommy (2 points)
```

## Related Features
- **AI Commands**: [AI Assistant](./06-AI-ASSISTANT.md)
- **Activity Tracking**: [Activity Logs](./09-ACTIVITY-LOGS.md)
- **Data Storage**: [Data Persistence](./12-DATA-PERSISTENCE.md)

## Customization Ideas

### Reward Tiers
```typescript
const getRewardTier = (points: number) => {
  if (points >= 100) return '🏆 Gold';
  if (points >= 50) return '🥈 Silver';
  if (points >= 25) return '🥉 Bronze';
  return '⭐ Starter';
};
```

### Weekly Reset
```typescript
// Add to chore entry
weekNumber: Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))

// Filter by current week
const thisWeeksChores = choreEntries.filter(
  entry => entry.weekNumber === currentWeek
);
```

### Chore Templates
```typescript
const choreTemplates = {
  daily: ['wash dishes', 'make bed', 'feed pets'],
  weekly: ['vacuum', 'laundry', 'clean bathroom'],
  monthly: ['deep clean', 'organize garage']
};
```

## Benefits
1. **Motivation**: Points make chores fun
2. **Fairness**: Track who does what
3. **Flexibility**: Custom point values
4. **Transparency**: Everyone sees progress