# 👋 Onboarding Flow

## Overview
The onboarding flow helps new families set up their dashboard by collecting family member information and introducing them to the AI assistant "Buddy".

## Location in Codebase
- **Component**: `src/components/OnboardingFlow.tsx`
- **Called from**: `src/App.tsx` (lines 80-87)
- **Triggered by**: First-time users clicking "Get Started"

## How It Works

### 1. Multi-Step Process
```typescript
// src/components/OnboardingFlow.tsx
const [step, setStep] = useState(1);
const [userName, setUserName] = useState('');
const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
```

### 2. Step Navigation
```typescript
const nextStep = () => setStep(step + 1);
const prevStep = () => setStep(step - 1);

// Progress indicator
<div className="flex justify-center space-x-2 mb-8">
  {[1, 2, 3, 4].map((s) => (
    <div
      key={s}
      className={`h-2 w-8 rounded-full ${
        s <= step ? 'bg-amber-500' : 'bg-gray-300'
      }`}
    />
  ))}
</div>
```

## Step-by-Step Breakdown

### Step 1: Welcome & Name Collection
```typescript
case 1:
  return (
    <>
      <h2 className="text-3xl font-bold mb-4">Welcome! Let's get started</h2>
      <p className="text-gray-600 mb-6">First, what should we call you?</p>
      <input
        type="text"
        placeholder="Your name"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        className="w-full p-3 border rounded-lg mb-6"
      />
    </>
  );
```

### Step 2: Add Family Members
```typescript
case 2:
  return (
    <>
      <h2 className="text-3xl font-bold mb-4">Add Your Family Members</h2>
      {/* Form to add family members */}
      <input placeholder="Name" />
      <input type="number" placeholder="Age (optional)" />
      <button onClick={handleAddMember}>Add Family Member</button>
      
      {/* Display added members */}
      {familyMembers.map((member) => (
        <div className="flex items-center justify-between">
          <span>{member.name} {member.age && `(${member.age})`}</span>
          <button onClick={() => handleRemoveMember(member.id)}>×</button>
        </div>
      ))}
    </>
  );
```

### Step 3: Meet AI Assistant
```typescript
case 3:
  return (
    <>
      <div className="text-6xl mb-4">🤖</div>
      <h2 className="text-3xl font-bold mb-4">Meet Your AI Assistant!</h2>
      <div className="bg-amber-50 p-6 rounded-lg">
        <p className="text-lg mb-4">
          Hi {userName}! I'm Buddy, your family's AI assistant.
        </p>
        <p>I can help you:</p>
        <ul className="list-disc list-inside">
          <li>Create and manage chores</li>
          <li>Schedule family events</li>
          <li>Track school assignments</li>
          <li>And much more!</li>
        </ul>
      </div>
    </>
  );
```

### Step 4: Tutorial & Completion
```typescript
case 4:
  return (
    <>
      <h2 className="text-3xl font-bold mb-4">Quick Tutorial</h2>
      <div className="space-y-4">
        <div className="example-command">
          Try: "Create a chore for {familyMembers[0]?.name} to wash dishes worth 5 points"
        </div>
      </div>
      <button onClick={handleComplete}>Start Using Dashboard</button>
    </>
  );
```

## Data Persistence
```typescript
const handleComplete = () => {
  // Save to localStorage
  localStorage.setItem('userName', userName);
  localStorage.setItem('hasCompletedOnboarding', 'true');
  localStorage.setItem('familyMembers', JSON.stringify(
    familyMembers.map(m => m.name)
  ));
  
  // Notify parent component
  onComplete();
};
```

## Family Member Management
```typescript
interface FamilyMember {
  id: number;
  name: string;
  age?: number;
}

const handleAddMember = () => {
  if (memberName.trim()) {
    const newMember: FamilyMember = {
      id: Date.now(),
      name: memberName.trim(),
      age: memberAge || undefined
    };
    setFamilyMembers([...familyMembers, newMember]);
    onAddFamilyMember(memberName.trim(), memberAge);
  }
};
```

## Visual Design
- **Progress Bar**: Shows current step (1-4)
- **Warm Colors**: Amber/orange theme throughout
- **Card Layout**: White background with shadow
- **Animations**: Smooth transitions between steps

## User Experience Features

### Validation
```typescript
// Prevent advancing without required info
<button
  onClick={nextStep}
  disabled={!userName.trim()}
  className={`px-6 py-3 rounded-lg ${
    userName.trim() 
      ? 'bg-amber-500 hover:bg-amber-600' 
      : 'bg-gray-300 cursor-not-allowed'
  }`}
>
  Continue
</button>
```

### Back Navigation
```typescript
{step > 1 && (
  <button onClick={prevStep} className="text-amber-600">
    ← Back
  </button>
)}
```

## Integration Points

### With App.tsx
```typescript
// src/App.tsx
const handleOnboardingComplete = () => {
  localStorage.setItem('hasCompletedOnboarding', 'true');
  localStorage.setItem('familyMembers', JSON.stringify(familyMembers));
  setShowOnboarding(false);
};
```

### With Dashboard
- Family members → Populate dropdown in chore creation
- User name → Personalized greetings
- Completion status → Skip onboarding next time

## Customization Options

### Add More Steps
```typescript
// Add to step rendering
case 5:
  return (
    <>
      <h2>Set Family Goals</h2>
      {/* Goal setting UI */}
    </>
  );
```

### Skip Onboarding (Dev)
```typescript
// In App.tsx
localStorage.setItem('hasCompletedOnboarding', 'true');
localStorage.setItem('userName', 'Test User');
```

### Custom Welcome Messages
```typescript
// Based on time of day
const greeting = new Date().getHours() < 12 ? 'Good morning' : 'Hello';
<h2>{greeting}, {userName}!</h2>
```

## Related Features
- **Previous**: [Welcome Page](./02-WELCOME-PAGE.md)
- **Next**: [Family Dashboard](./04-FAMILY-DASHBOARD.md)
- **Uses**: [AI Assistant](./06-AI-ASSISTANT.md)

## Testing Flow
```javascript
// Reset onboarding
localStorage.removeItem('hasCompletedOnboarding');
localStorage.removeItem('userName');
localStorage.removeItem('familyMembers');
// Refresh page
```

## Benefits
1. **Personalization**: Collects family-specific data
2. **Education**: Introduces AI features
3. **Engagement**: Interactive multi-step process
4. **Data Collection**: Sets up initial family structure

## Future Enhancements
1. **Family Photos**: Upload profile pictures
2. **Preferences**: Set chore schedules, point values
3. **Roles**: Assign parent/child roles
4. **Themes**: Choose dashboard color scheme