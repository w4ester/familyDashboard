# 🔐 Login System

## Overview
The login system provides family privacy and personalization, ensuring each family's data stays separate and secure.

## Location in Codebase
- **Component**: `src/components/LoginPage.tsx`
- **Called from**: `src/App.tsx` (lines 72-74)

## How It Works

### 1. Initial Load Check
```typescript
// src/App.tsx (lines 19-37)
useEffect(() => {
  const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');
  const savedUserName = localStorage.getItem('userName');
  
  if (hasCompletedOnboarding === 'true' && savedUserName) {
    setShowLogin(false);
    // Skip directly to dashboard
  }
}, []);
```

### 2. Login Component Structure
```typescript
// src/components/LoginPage.tsx
export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  
  const handleLogin = () => {
    if (password === 'family2024') {
      onLogin();
    } else {
      alert('Incorrect password. Hint: family + current year');
    }
  };
```

### 3. Password Protection
- **Default Password**: `family2024`
- **Storage**: No password stored (simple validation)
- **Security Level**: Basic (suitable for home use)

## User Flow
1. User opens app → Login page appears
2. Enter password → Click "Enter Dashboard"
3. Correct password → Redirect to Welcome page
4. Wrong password → Show hint alert

## Customization Options

### Change Password
Edit `src/components/LoginPage.tsx` line ~11:
```typescript
if (password === 'yourNewPassword') {
```

### Add Username Field
```typescript
const [username, setUsername] = useState('');
// Add input field for username
<input
  type="text"
  placeholder="Family Name"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
/>
```

### Skip Login for Development
Uncomment in `src/App.tsx` line 21:
```typescript
// localStorage.clear();
```

## Visual Design
- **Background**: Warm gradient (orange to amber)
- **Card Style**: White with shadow, centered
- **Input Style**: Large, family-friendly text
- **Button**: Orange with hover effect

## Accessibility Features
- ✅ Keyboard navigation (Enter to submit)
- ✅ Clear visual feedback
- ✅ Password hint on error
- ✅ Large touch targets for tablets

## Future Enhancements
1. **Multi-family support**: Different passwords per family
2. **Biometric login**: Face ID / Touch ID on devices
3. **Parent/Child modes**: Different access levels
4. **Password recovery**: Email reset option

## Related Features
- **Next**: [Welcome Page](./02-WELCOME-PAGE.md) - Shows after login
- **Skip to**: [Family Dashboard](./04-FAMILY-DASHBOARD.md) - If already logged in

## Code Snippet - Complete Login Flow
```typescript
// User clicks login button
handleLogin() {
  if (password === 'family2024') {
    onLogin(); // Triggers App.tsx handleLogin
  }
}

// App.tsx handles the transition
const handleLogin = () => {
  setShowLogin(false);
  setShowWelcome(true);
};
```

## Testing the Feature
1. Clear localStorage: `localStorage.clear()`
2. Refresh page
3. Try wrong password: See hint
4. Enter `family2024`
5. Should see Welcome page

## Common Issues
- **Stuck on login**: Clear browser cache
- **Password not working**: Check for typos, it's case-sensitive
- **Auto-logout**: Check if localStorage is disabled