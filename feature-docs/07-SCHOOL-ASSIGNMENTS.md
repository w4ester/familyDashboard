# 📚 School Assignments Tracker

## Overview
The School Assignments feature helps families track homework, projects, and school tasks with due dates and completion status for each family member.

## Location in Codebase
- **Component**: `src/components/FamilyDashboard.tsx` (renderAssignmentsTab function)
- **Lines**: 839-932
- **Data Storage**: `family-data/family-data.json` → `assignments` array

## Core Data Structure

### Assignment Object
```typescript
interface Assignment {
  id: number;           // Unique identifier
  name: string;         // Assignment name
  subject: string;      // Subject/class
  dueDate: string;      // YYYY-MM-DD format
  person: string;       // Student name
  completed: boolean;   // Completion status
  timestamp: string;    // When created
}
```

## How It Works

### 1. Manual Assignment Creation
```typescript
// src/components/FamilyDashboard.tsx (lines 267-295)
const handleAssignmentSubmit = () => {
  if (assignmentName.trim() === '' || 
      assignmentPerson.trim() === '' || 
      !assignmentDueDate) {
    alert('Please enter an assignment name, person, and due date!');
    return;
  }
  
  const newAssignment = {
    id: Date.now(),
    name: assignmentName.trim(),
    subject: assignmentSubject.trim(),
    dueDate: assignmentDueDate,
    person: assignmentPerson.trim(),
    completed: false,
    timestamp: new Date().toLocaleString()
  };
  
  setAssignments([...assignments, newAssignment]);
  
  // Add person to family members if new
  if (!familyMembers.includes(assignmentPerson.trim())) {
    setFamilyMembers([...familyMembers, assignmentPerson.trim()]);
  }
  
  // Clear the form
  setAssignmentName('');
  setAssignmentSubject('');
  setAssignmentDueDate('');
  setAssignmentPerson('');
};
```

### 2. AI-Powered Assignment Creation
```typescript
// src/services/family-dashboard-tools.ts
toolRegistry.register({
  name: 'create_assignment',
  description: 'Add a school assignment',
  parameters: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Assignment name' },
      subject: { type: 'string', description: 'Subject' },
      dueDate: { type: 'string', description: 'Due date (YYYY-MM-DD)' },
      person: { type: 'string', description: 'Student name' }
    },
    required: ['name', 'dueDate', 'person']
  },
  execute: async (params) => {
    const { name, subject = 'General', dueDate, person } = params;
    
    const data = await dataService.loadData();
    
    const newAssignment = {
      id: Date.now(),
      name,
      subject,
      dueDate,
      person,
      completed: false,
      timestamp: new Date().toLocaleString()
    };
    
    data.assignments.push(newAssignment);
    await dataService.saveData(data);
    
    return {
      assignment: newAssignment,
      message: `Created assignment "${name}" for ${person} due ${dueDate}`
    };
  }
});
```

### 3. Completion Tracking
```typescript
const toggleAssignmentComplete = (assignmentId: number) => {
  setAssignments(assignments.map(assignment => 
    assignment.id === assignmentId 
      ? { ...assignment, completed: !assignment.completed }
      : assignment
  ));
};
```

## UI Components

### Assignment Input Form
```html
<div className="bg-orange-50 p-4 rounded-lg mb-6">
  <h3>Add New Assignment</h3>
  <input 
    type="text" 
    placeholder="Assignment Name"
    value={assignmentName}
  />
  <input 
    type="text" 
    placeholder="Subject (optional)"
    value={assignmentSubject}
  />
  <input 
    type="date" 
    value={assignmentDueDate}
  />
  <select value={assignmentPerson}>
    <option value="">-- Select Student --</option>
    {familyMembers.map(member => (
      <option value={member}>{member}</option>
    ))}
  </select>
  <button onClick={handleAssignmentSubmit}>
    Add Assignment
  </button>
</div>
```

### Assignment Display
```typescript
// Pending assignments
<div className="space-y-2">
  <h3>Pending Assignments</h3>
  {assignments
    .filter(a => !a.completed && 
      (activeTab === 'assignments' || 
       a.person === activeTab.replace('assignments-', '')))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .map(assignment => (
      <div className="p-3 bg-white border rounded flex items-start">
        <input
          type="checkbox"
          checked={false}
          onChange={() => toggleAssignmentComplete(assignment.id)}
          className="mr-3 mt-1"
        />
        <div className="flex-1">
          <div className="font-medium">{assignment.name}</div>
          <div className="text-sm text-gray-600">
            {assignment.subject} • Due: {formatDate(assignment.dueDate)}
            {getDaysUntilDue(assignment.dueDate) <= 1 && 
              <span className="text-red-600 ml-2">Due soon!</span>
            }
          </div>
          <div className="text-xs text-gray-500">
            For: {assignment.person}
          </div>
        </div>
      </div>
    ))}
</div>
```

### Family Member Tabs
```typescript
// Individual student views
<div className="flex flex-wrap gap-2 mb-4">
  <button 
    onClick={() => setActiveTab('assignments')}
    className={activeTab === 'assignments' ? 'active' : ''}
  >
    All Assignments
  </button>
  {familyMembers.map(member => (
    <button
      key={member}
      onClick={() => setActiveTab(`assignments-${member}`)}
      className={activeTab === `assignments-${member}` ? 'active' : ''}
    >
      {member}
    </button>
  ))}
</div>
```

## Features

### 1. Due Date Intelligence
```typescript
const getDaysUntilDue = (dueDate: string) => {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// Visual indicators
{getDaysUntilDue(assignment.dueDate) <= 1 && (
  <span className="text-red-600">Due soon!</span>
)}
{getDaysUntilDue(assignment.dueDate) < 0 && (
  <span className="text-red-600">Overdue!</span>
)}
```

### 2. Subject Organization
```typescript
// Group by subject
const assignmentsBySubject = assignments.reduce((acc, assignment) => {
  const subject = assignment.subject || 'General';
  if (!acc[subject]) acc[subject] = [];
  acc[subject].push(assignment);
  return acc;
}, {});
```

### 3. Completion Tracking
```typescript
// Completed section with strikethrough
<div className="opacity-60">
  <h3>Completed</h3>
  {assignments
    .filter(a => a.completed)
    .map(assignment => (
      <div className="p-3 bg-gray-50">
        <span className="line-through">{assignment.name}</span>
        <div className="text-xs">
          Completed by {assignment.person}
        </div>
      </div>
    ))}
</div>
```

### 4. Smart Defaults
```typescript
// Auto-populate common subjects
const commonSubjects = [
  'Math',
  'Science',
  'English',
  'History',
  'Spanish',
  'Art',
  'Music',
  'PE'
];

<datalist id="subject-suggestions">
  {commonSubjects.map(subject => (
    <option key={subject} value={subject} />
  ))}
</datalist>
```

## AI Integration Examples

```text
User: "Create assignment Math Homework for Sarah due tomorrow"
AI: ✅ Created assignment "Math Homework" for Sarah due 2025-05-25

User: "Add assignment 'Science Project' for Jake due 2025-06-15"
AI: ✅ Created assignment "Science Project" for Jake due 2025-06-15
```

## Related Features
- **Calendar Integration**: Assignments show on calendar
- **AI Commands**: [AI Assistant](./06-AI-ASSISTANT.md)
- **School Platforms**: [School Platform Links](./08-SCHOOL-PLATFORMS.md)

## Customization Ideas

### Priority Levels
```typescript
interface Assignment {
  // ... existing fields
  priority: 'low' | 'medium' | 'high';
}

// Color coding
const getPriorityColor = (priority: string) => {
  switch(priority) {
    case 'high': return 'border-red-500';
    case 'medium': return 'border-yellow-500';
    default: return 'border-gray-300';
  }
};
```

### Progress Tracking
```typescript
interface Assignment {
  // ... existing fields
  progress: number; // 0-100
}

// Progress bar
<div className="w-full bg-gray-200 rounded-full h-2">
  <div 
    className="bg-blue-600 h-2 rounded-full"
    style={{ width: `${assignment.progress}%` }}
  />
</div>
```

### Reminders
```typescript
// Check for upcoming assignments
const checkAssignmentReminders = () => {
  assignments.forEach(assignment => {
    const daysUntil = getDaysUntilDue(assignment.dueDate);
    if (daysUntil === 1 && !assignment.completed) {
      // Send notification
      notify(`${assignment.name} is due tomorrow!`);
    }
  });
};
```

### Grade Tracking
```typescript
interface Assignment {
  // ... existing fields
  grade?: string;
  points?: { earned: number; possible: number };
}

// Display grade
{assignment.grade && (
  <span className="ml-2 font-bold text-green-600">
    Grade: {assignment.grade}
  </span>
)}
```

## Benefits
1. **Organization**: All assignments in one place
2. **Visibility**: Parents see all homework
3. **Accountability**: Track completion
4. **Planning**: See upcoming due dates
5. **Stress Reduction**: No forgotten assignments