# 📅 Family Calendar

## Overview
The Family Calendar keeps track of all family events, appointments, and activities in one centralized location with color-coding by family member.

## Location in Codebase
- **Component**: `src/components/FamilyDashboard.tsx` (renderCalendarTab function)
- **Lines**: 723-1090
- **Data Storage**: `family-data/family-data.json` → `events` array

## Core Data Structure

### Event Object
```typescript
interface Event {
  id: number;          // Unique identifier
  title: string;       // Event name
  date: string;        // YYYY-MM-DD format
  time?: string;       // Optional HH:MM format
  person: string;      // Family member it's for
  timestamp: string;   // When created
}
```

## How It Works

### 1. Manual Event Creation
```typescript
// src/components/FamilyDashboard.tsx (lines 298-324)
const handleEventSubmit = () => {
  if (eventTitle.trim() === '' || !eventDate || eventPerson.trim() === '') {
    alert('Please fill in all required fields!');
    return;
  }
  
  const newEvent = {
    id: Date.now(),
    title: eventTitle.trim(),
    date: eventDate,
    time: eventTime || '',
    person: eventPerson.trim(),
    timestamp: new Date().toLocaleString()
  };
  
  setEvents([...events, newEvent]);
  
  // Clear form
  setEventTitle('');
  setEventDate('');
  setEventTime('');
  setEventPerson('');
};
```

### 2. AI-Powered Event Creation
```typescript
// src/services/family-dashboard-tools.ts
toolRegistry.register({
  name: 'create_event',
  description: 'Add an event to the family calendar',
  execute: async (params) => {
    const { title, date, time, person } = params;
    
    const newEvent = {
      id: Date.now(),
      title,
      date,
      time: time || '',
      person,
      timestamp: new Date().toLocaleString()
    };
    
    data.events.push(newEvent);
    await dataService.saveData(data);
    
    return {
      event: newEvent,
      message: `Added event "${title}" for ${person} on ${date}`
    };
  }
});
```

### 3. Calendar View Modes

#### Week View
```typescript
const renderWeekView = () => {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  
  return (
    <div className="grid grid-cols-8 gap-0 border rounded-lg">
      {/* Time column */}
      <div className="border-r">
        {Array.from({ length: 24 }, (_, i) => (
          <div className="h-12 border-b text-xs p-1">
            {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : 
             i === 12 ? '12 PM' : `${i - 12} PM`}
          </div>
        ))}
      </div>
      
      {/* Day columns */}
      {Array.from({ length: 7 }, (_, dayIndex) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + dayIndex);
        
        return (
          <div key={dayIndex} className="border-r">
            {/* Day header */}
            <div className="border-b p-2 font-semibold">
              {date.toLocaleDateString('en-US', { weekday: 'short' })}
              <div className="text-sm">{date.getDate()}</div>
            </div>
            
            {/* Hour slots with events */}
            {renderDayEvents(date)}
          </div>
        );
      })}
    </div>
  );
};
```

#### Month View
```typescript
const renderMonthView = () => {
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  return (
    <div className="grid grid-cols-7 gap-0 border rounded-lg">
      {/* Render calendar grid */}
      {dates.map((date, index) => (
        <div className={`border p-2 min-h-24 ${
          date.getMonth() !== currentDate.getMonth() ? 'bg-gray-50' : ''
        }`}>
          <div className="font-semibold text-sm">{date.getDate()}</div>
          {/* Events for this date */}
          {getEventsForDate(date).map(event => (
            <div className={`text-xs p-1 rounded mb-1 ${
              getPersonColor(event.person)
            }`}>
              {event.time && `${event.time} `}
              {event.title}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
```

### 4. Color Coding System
```typescript
const getPersonColor = (person: string) => {
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800',
    'bg-yellow-100 text-yellow-800',
    'bg-indigo-100 text-indigo-800'
  ];
  
  // Consistent color per person
  const index = familyMembers.indexOf(person) % colors.length;
  return colors[index];
};
```

## UI Components

### Event Creation Form
```html
<div className="bg-orange-50 p-4 rounded-lg mb-6">
  <h3>Add New Event</h3>
  <input type="text" placeholder="Event Title" />
  <input type="date" value={eventDate} />
  <input type="time" value={eventTime} />
  <select value={eventPerson}>
    <!-- Family member options -->
  </select>
  <button onClick={handleEventSubmit}>Add Event</button>
</div>
```

### Calendar Navigation
```typescript
<div className="flex justify-between items-center mb-4">
  <button onClick={() => navigateCalendar('prev')}>←</button>
  <h3>{currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  })}</h3>
  <button onClick={() => navigateCalendar('next')}>→</button>
</div>
```

### View Toggle
```typescript
<div className="flex gap-2 mb-4">
  <button 
    onClick={() => setCalendarView('month')}
    className={calendarView === 'month' ? 'bg-orange-500' : ''}
  >
    Month
  </button>
  <button 
    onClick={() => setCalendarView('week')}
    className={calendarView === 'week' ? 'bg-orange-500' : ''}
  >
    Week
  </button>
</div>
```

## Features

### 1. Multiple Views
- **Month View**: Bird's eye view of all events
- **Week View**: Detailed hourly schedule
- **Upcoming List**: Next 30 days of events

### 2. Event Management
```typescript
// Delete event
const deleteEvent = (eventId: number) => {
  setEvents(events.filter(e => e.id !== eventId));
};

// Edit event (future feature)
const editEvent = (eventId: number, updates: Partial<Event>) => {
  setEvents(events.map(e => 
    e.id === eventId ? { ...e, ...updates } : e
  ));
};
```

### 3. Smart Features
- **Today Highlight**: Current date highlighted
- **Past Event Dimming**: Old events shown lighter
- **Conflict Detection**: (Future) Warn about overlaps

### 4. Family Member Tabs
```typescript
{familyMembers.map(member => (
  <button
    key={member}
    onClick={() => setActiveTab(`calendar-${member}`)}
    className={activeTab === `calendar-${member}` ? 'active' : ''}
  >
    {member}'s Calendar
  </button>
))}
```

## AI Integration Examples

```text
User: "Add event Soccer Practice for Jake on Saturday at 10am"
AI: ✅ Added event "Soccer Practice" for Jake on 2025-05-31

User: "Schedule dentist appointment for Mom next Tuesday"
AI: ✅ Added event "dentist appointment" for Mom on 2025-06-03
```

## Related Features
- **AI Commands**: [AI Assistant](./06-AI-ASSISTANT.md)
- **Assignments**: [School Assignments](./07-SCHOOL-ASSIGNMENTS.md)
- **Data Storage**: [Data Persistence](./12-DATA-PERSISTENCE.md)

## Customization Ideas

### Recurring Events
```typescript
interface RecurringEvent extends Event {
  recurrence: 'daily' | 'weekly' | 'monthly';
  endDate?: string;
}

// Generate occurrences
const generateRecurringEvents = (event: RecurringEvent) => {
  const occurrences = [];
  // Logic to create multiple events
  return occurrences;
};
```

### Event Categories
```typescript
const eventCategories = {
  medical: { icon: '🏥', color: 'red' },
  school: { icon: '🎒', color: 'blue' },
  sports: { icon: '⚽', color: 'green' },
  social: { icon: '🎉', color: 'purple' }
};
```

### Reminders
```typescript
// Add to event structure
reminder?: {
  time: number; // minutes before
  sent: boolean;
}

// Check for upcoming reminders
const checkReminders = () => {
  const now = new Date();
  events.forEach(event => {
    if (event.reminder && !event.reminder.sent) {
      // Send notification
    }
  });
};
```

## Benefits
1. **Organization**: All events in one place
2. **Visibility**: Everyone sees the schedule
3. **Planning**: Avoid conflicts
4. **Accountability**: Know who has what when