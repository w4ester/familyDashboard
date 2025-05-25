# 🎒 School Platform Links

## Overview
Quick access links to common school platforms and educational resources, customizable per family member to support different schools and grade levels.

## Location in Codebase
- **Component**: `src/components/SchoolPlatforms.tsx`
- **Called from**: `src/components/FamilyDashboard.tsx` (line 1179)
- **Triggered by**: Clicking "School Platforms" tab

## Core Structure

### Platform Definition
```typescript
interface Platform {
  name: string;
  url: string;
  icon: string;
  color: string;
  description?: string;
}
```

### Default Platforms
```typescript
const defaultPlatforms: Platform[] = [
  {
    name: 'Google Classroom',
    url: 'https://classroom.google.com',
    icon: '📚',
    color: 'bg-green-500'
  },
  {
    name: 'Clever',
    url: 'https://clever.com/in/district',
    icon: '🎓',
    color: 'bg-blue-500'
  },
  {
    name: 'Canvas',
    url: 'https://canvas.instructure.com',
    icon: '🎨',
    color: 'bg-red-500'
  },
  {
    name: 'Schoology',
    url: 'https://app.schoology.com',
    icon: '📖',
    color: 'bg-blue-600'
  },
  {
    name: 'Khan Academy',
    url: 'https://www.khanacademy.org',
    icon: '🧮',
    color: 'bg-indigo-500'
  },
  {
    name: 'IXL',
    url: 'https://www.ixl.com',
    icon: '✏️',
    color: 'bg-yellow-500'
  }
];
```

## Component Implementation

### Main Component
```typescript
export default function SchoolPlatforms({ familyMembers }: SchoolPlatformsProps) {
  const [platforms, setPlatforms] = useState<Platform[]>(defaultPlatforms);
  const [customPlatforms, setCustomPlatforms] = useState<Record<string, Platform[]>>({});
  const [selectedMember, setSelectedMember] = useState<string>('all');
  
  // Load saved platforms
  useEffect(() => {
    const saved = localStorage.getItem('school-platforms');
    if (saved) {
      setPlatforms(JSON.parse(saved));
    }
    
    const savedCustom = localStorage.getItem('custom-platforms');
    if (savedCustom) {
      setCustomPlatforms(JSON.parse(savedCustom));
    }
  }, []);
```

### Platform Grid Display
```typescript
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {getCurrentPlatforms().map((platform, index) => (
    <a
      key={index}
      href={platform.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${platform.color} text-white p-6 rounded-lg 
                  hover:opacity-90 transform hover:scale-105 
                  transition-all duration-200`}
    >
      <div className="text-4xl mb-2">{platform.icon}</div>
      <div className="font-semibold">{platform.name}</div>
      {platform.description && (
        <div className="text-sm mt-1 opacity-90">
          {platform.description}
        </div>
      )}
    </a>
  ))}
</div>
```

### Add Custom Platform
```typescript
const handleAddPlatform = () => {
  if (newPlatformName && newPlatformUrl) {
    const newPlatform: Platform = {
      name: newPlatformName,
      url: newPlatformUrl.startsWith('http') 
        ? newPlatformUrl 
        : `https://${newPlatformUrl}`,
      icon: newPlatformIcon || '🔗',
      color: newPlatformColor || 'bg-gray-500'
    };
    
    if (selectedMember === 'all') {
      setPlatforms([...platforms, newPlatform]);
    } else {
      setCustomPlatforms({
        ...customPlatforms,
        [selectedMember]: [
          ...(customPlatforms[selectedMember] || []),
          newPlatform
        ]
      });
    }
    
    // Clear form
    setNewPlatformName('');
    setNewPlatformUrl('');
    setNewPlatformIcon('');
  }
};
```

## Features

### 1. Family Member Customization
```typescript
// Member selector
<select 
  value={selectedMember} 
  onChange={(e) => setSelectedMember(e.target.value)}
  className="p-2 border rounded"
>
  <option value="all">All Family Members</option>
  {familyMembers.map(member => (
    <option key={member} value={member}>{member}'s Platforms</option>
  ))}
</select>

// Get platforms for selected member
const getCurrentPlatforms = () => {
  if (selectedMember === 'all') {
    return platforms;
  }
  return [
    ...platforms,
    ...(customPlatforms[selectedMember] || [])
  ];
};
```

### 2. Platform Management
```typescript
// Delete platform
const deletePlatform = (index: number) => {
  if (selectedMember === 'all') {
    setPlatforms(platforms.filter((_, i) => i !== index));
  } else {
    const memberPlatforms = customPlatforms[selectedMember] || [];
    setCustomPlatforms({
      ...customPlatforms,
      [selectedMember]: memberPlatforms.filter((_, i) => i !== index)
    });
  }
};

// Edit mode toggle
const [editMode, setEditMode] = useState(false);

{editMode && (
  <button 
    onClick={() => deletePlatform(index)}
    className="absolute top-2 right-2 text-white"
  >
    ×
  </button>
)}
```

### 3. Icon Picker
```typescript
const commonIcons = ['📚', '📖', '✏️', '🎓', '🧮', '💻', '📝', '🔬', '🎨', '🌍'];

<div className="flex gap-2 mb-2">
  {commonIcons.map(icon => (
    <button
      key={icon}
      onClick={() => setNewPlatformIcon(icon)}
      className={`p-2 border rounded ${
        newPlatformIcon === icon ? 'bg-orange-100' : ''
      }`}
    >
      {icon}
    </button>
  ))}
</div>
```

### 4. Color Selection
```typescript
const colors = [
  { name: 'Red', value: 'bg-red-500' },
  { name: 'Blue', value: 'bg-blue-500' },
  { name: 'Green', value: 'bg-green-500' },
  { name: 'Purple', value: 'bg-purple-500' },
  { name: 'Orange', value: 'bg-orange-500' }
];

<select 
  value={newPlatformColor}
  onChange={(e) => setNewPlatformColor(e.target.value)}
>
  {colors.map(color => (
    <option key={color.value} value={color.value}>
      {color.name}
    </option>
  ))}
</select>
```

## Common School Platforms

### Learning Management Systems
```typescript
const lmsPlatforms = [
  { name: 'Google Classroom', url: 'classroom.google.com' },
  { name: 'Canvas', url: 'canvas.instructure.com' },
  { name: 'Schoology', url: 'app.schoology.com' },
  { name: 'Blackboard', url: 'blackboard.com' },
  { name: 'Moodle', url: 'moodle.org' }
];
```

### Educational Resources
```typescript
const educationalPlatforms = [
  { name: 'Khan Academy', url: 'khanacademy.org' },
  { name: 'IXL', url: 'ixl.com' },
  { name: 'Prodigy Math', url: 'prodigygame.com' },
  { name: 'Duolingo', url: 'duolingo.com' },
  { name: 'Code.org', url: 'code.org' }
];
```

### School Portals
```typescript
const schoolPortals = [
  { name: 'PowerSchool', url: 'powerschool.com' },
  { name: 'Infinite Campus', url: 'infinitecampus.com' },
  { name: 'Skyward', url: 'skyward.com' },
  { name: 'Clever', url: 'clever.com' }
];
```

## Customization Examples

### Grade-Specific Platforms
```typescript
// Elementary
const elementaryPlatforms = [
  { name: 'ABCmouse', icon: '🐭', color: 'bg-orange-500' },
  { name: 'Starfall', icon: '⭐', color: 'bg-yellow-500' }
];

// Middle School
const middleSchoolPlatforms = [
  { name: 'Quizlet', icon: '📇', color: 'bg-blue-500' },
  { name: 'Edmodo', icon: '📱', color: 'bg-green-500' }
];

// High School
const highSchoolPlatforms = [
  { name: 'College Board', icon: '🎓', color: 'bg-navy-500' },
  { name: 'Naviance', icon: '🧭', color: 'bg-teal-500' }
];
```

### Quick Actions
```typescript
// Add common platform sets
const quickAddSets = {
  elementary: [...elementaryPlatforms],
  middle: [...middleSchoolPlatforms],
  high: [...highSchoolPlatforms]
};

<button onClick={() => addPlatformSet('elementary')}>
  Add Elementary School Set
</button>
```

## Benefits
1. **Quick Access**: One-click to school resources
2. **Customization**: Different platforms per child
3. **Organization**: All school links in one place
4. **Time-Saving**: No searching for URLs
5. **Visual**: Icons and colors for easy recognition

## Future Enhancements
1. **SSO Integration**: Single sign-on support
2. **Usage Tracking**: See which platforms are used most
3. **Notifications**: Alert when assignments posted
4. **Mobile App Links**: Deep linking to apps
5. **Schedule Integration**: Show platform by class period