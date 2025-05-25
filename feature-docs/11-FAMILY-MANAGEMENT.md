# 👨‍👩‍👧‍👦 Family Management

## Overview
The Family Management system allows adding, editing, and removing family members, which forms the foundation for all personalized features in the dashboard.

## Location in Codebase
- **Component**: `src/components/FamilyDashboard.tsx` (renderFamilyTab function)
- **Lines**: 561-602
- **Storage**: `family-data/family-data.json` → `familyMembers` array

## Core Structure

### Family Member Data
```typescript
// Simple array of names
familyMembers: string[]

// Extended structure (future enhancement)
interface FamilyMember {
  id: string;
  name: string;
  role: 'parent' | 'child' | 'other';
  age?: number;
  avatar?: string;
  color?: string;
  permissions?: string[];
}
```

## Implementation

### Add Family Member
```typescript
const addFamilyMember = () => {
  if (newFamilyMember.trim() && !familyMembers.includes(newFamilyMember.trim())) {
    setFamilyMembers([...familyMembers, newFamilyMember.trim()]);
    setNewFamilyMember('');
  }
};
```

### Delete Family Member
```typescript
const deleteFamilyMember = (memberToDelete: string) => {
  if (confirm(`Are you sure you want to remove ${memberToDelete}?`)) {
    setFamilyMembers(familyMembers.filter(member => member !== memberToDelete));
  }
};
```

### UI Component
```typescript
const renderFamilyTab = () => {
  return (
    <div className="bg-orange-50 p-4 rounded-lg mb-6">
      <h2 className="text-lg font-semibold mb-2">Manage Family Members</h2>
      
      {/* Add new member form */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Add New Family Member"
          value={newFamilyMember}
          onChange={(e) => setNewFamilyMember(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addFamilyMember()}
          className="flex-1 p-2 border rounded"
        />
        <button 
          onClick={addFamilyMember} 
          className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
        >
          Add
        </button>
      </div>
      
      {/* Current members list */}
      <div className="mt-4">
        <h3 className="font-medium mb-2">Current Family Members</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {familyMembers.map((member, index) => (
            <div key={index} className="flex justify-between items-center bg-white p-3 rounded border">
              <span className="font-medium">{member}</span>
              <button 
                onClick={() => deleteFamilyMember(member)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

## Integration Points

### 1. Chore Assignment
```typescript
// Dropdown populated from family members
<select value={personName} onChange={(e) => setPersonName(e.target.value)}>
  <option value="">-- Select Person --</option>
  {familyMembers.map((member, index) => (
    <option key={index} value={member}>{member}</option>
  ))}
</select>
```

### 2. Calendar Events
```typescript
// Events can be assigned to specific family members
const newEvent = {
  title: eventTitle,
  person: eventPerson, // Selected from familyMembers
  date: eventDate
};
```

### 3. Individual Dashboards
```typescript
// Tabs for each family member
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

### 4. Color Coding
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
  
  const index = familyMembers.indexOf(person) % colors.length;
  return colors[index];
};
```

## Data Persistence

### Auto-save Members
```typescript
useEffect(() => {
  if (dataLoaded && familyMembers.length > 0) {
    dataService.saveFamilyMembers(familyMembers).catch(console.error);
  }
}, [familyMembers, dataLoaded]);
```

### Load on Mount
```typescript
useEffect(() => {
  const loadData = async () => {
    const members = await dataService.loadFamilyMembers();
    if (members.length > 0) {
      setFamilyMembers(members);
    }
  };
  loadData();
}, []);
```

## Features

### 1. Automatic Addition
When creating chores/events for new people, they're automatically added:
```typescript
if (!familyMembers.includes(personName.trim())) {
  setFamilyMembers([...familyMembers, personName.trim()]);
}
```

### 2. Validation
```typescript
// Prevent duplicates
if (familyMembers.includes(newFamilyMember.trim())) {
  alert('This family member already exists!');
  return;
}

// Prevent empty names
if (!newFamilyMember.trim()) {
  alert('Please enter a name');
  return;
}
```

### 3. Cascading Updates
When a member is removed, their data remains but they're removed from dropdowns:
```typescript
// Future enhancement: Archive instead of delete
const archiveMember = (member: string) => {
  const archived = {
    member,
    archivedDate: new Date(),
    data: {
      chores: choreEntries.filter(c => c.person === member),
      events: events.filter(e => e.person === member)
    }
  };
  // Save to archive
};
```

## Extended Features (Future)

### Member Profiles
```typescript
interface MemberProfile {
  name: string;
  nickname?: string;
  birthday?: string;
  favoriteColor?: string;
  avatar?: string;
  interests?: string[];
  allergies?: string[];
  emergencyContact?: string;
}
```

### Roles & Permissions
```typescript
interface MemberRole {
  canCreateChores: boolean;
  canAssignChores: boolean;
  canDeleteEvents: boolean;
  canViewFinancials: boolean;
  isAdmin: boolean;
}
```

### Member Statistics
```typescript
const getMemberStats = (memberName: string) => {
  return {
    totalPoints: choreEntries
      .filter(c => c.person === memberName)
      .reduce((sum, c) => sum + c.points, 0),
    completedChores: choreEntries
      .filter(c => c.person === memberName).length,
    upcomingEvents: events
      .filter(e => e.person === memberName && new Date(e.date) > new Date())
      .length,
    assignments: assignments
      .filter(a => a.person === memberName && !a.completed).length
  };
};
```

## UI Enhancements

### Avatar Selection
```typescript
const avatars = ['👶', '👦', '👧', '👨', '👩', '👴', '👵'];

<div className="flex gap-2">
  {avatars.map(avatar => (
    <button
      key={avatar}
      onClick={() => setMemberAvatar(avatar)}
      className={`text-2xl p-2 rounded ${
        memberAvatar === avatar ? 'bg-orange-200' : ''
      }`}
    >
      {avatar}
    </button>
  ))}
</div>
```

### Member Cards
```typescript
<div className="bg-white p-4 rounded-lg shadow">
  <div className="flex items-center gap-3">
    <span className="text-4xl">{member.avatar || '👤'}</span>
    <div>
      <h3 className="font-semibold">{member.name}</h3>
      <p className="text-sm text-gray-600">{member.role}</p>
    </div>
  </div>
  <div className="mt-3 text-sm">
    <div>Points: {getMemberStats(member.name).totalPoints}</div>
    <div>Chores: {getMemberStats(member.name).completedChores}</div>
  </div>
</div>
```

## Related Features
- **Onboarding**: Initial family setup
- **Chore Tracking**: Assigns to members
- **Calendar**: Personal events
- **School Assignments**: Student-specific

## Benefits
1. **Personalization**: Each member has their own view
2. **Organization**: Separate tracking per person
3. **Flexibility**: Add/remove as needed
4. **Simplicity**: Just names, no complex setup
5. **Growth**: Adapts as family changes