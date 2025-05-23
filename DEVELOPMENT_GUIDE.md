# Family Dashboard Development Guidelines

## Quick Start for New Features

When adding a new feature to the Family Dashboard, follow these steps:

### 1. Create Feature Structure

```bash
# Create feature directory
mkdir -p src/features/your-feature/{components,services,hooks,types}

# Create index file
touch src/features/your-feature/index.ts
```

### 2. Define Types First

Create your TypeScript interfaces in `src/features/your-feature/types/index.ts`:

```typescript
export interface YourFeatureData {
  // Define your data structure
}

export interface YourFeatureFilters {
  // Define filter options
}
```

### 3. Create Service Layer

Create service in `src/features/your-feature/services/yourService.ts`:

```typescript
import { BaseService } from '../../../shared/services/BaseService';

export class YourFeatureService extends BaseService {
  // Implement CRUD operations
  // Handle business logic
  // Emit events for state changes
}
```

### 4. Build React Components

Follow the container/presentational pattern:

```typescript
// Container component (smart)
export const YourFeatureContainer = () => {
  const { data, loading } = useYourFeature();
  return <YourFeatureView data={data} loading={loading} />;
};

// Presentational component (dumb)
export const YourFeatureView = ({ data, loading }) => {
  // Pure UI rendering
};
```

### 5. Create Custom Hooks

Create hooks in `src/features/your-feature/hooks/`:

```typescript
export const useYourFeature = () => {
  // Handle state management
  // Call services
  // Return data and actions
};
```

## Code Standards

### TypeScript

- **Strict mode**: Always use strict TypeScript settings
- **Explicit types**: Define return types for all functions
- **No any**: Avoid using `any` type, use `unknown` if needed
- **Interfaces over types**: Prefer interfaces for object shapes

### React

- **Functional components**: Use function components with hooks
- **Props interfaces**: Always define props with TypeScript
- **Error boundaries**: Wrap features in error boundaries
- **Memoization**: Use React.memo for expensive components

### File Naming

- **Components**: PascalCase (e.g., `ChoreList.tsx`)
- **Services**: camelCase (e.g., `choreService.ts`)
- **Utilities**: camelCase (e.g., `dateHelpers.ts`)
- **Types**: PascalCase for interfaces/types

### Import Order

1. External libraries
2. Core imports
3. Shared imports
4. Feature imports
5. Relative imports

```typescript
// External
import React, { useState } from 'react';
import { format } from 'date-fns';

// Core
import { Chore } from '@/core/models';

// Shared
import { Button } from '@/shared/components';

// Feature
import { useChores } from '../hooks/useChores';

// Relative
import './ChoreList.css';
```

## Testing Strategy

### Unit Tests

Test services and utilities:

```typescript
describe('ChoreService', () => {
  it('should calculate points correctly', () => {
    // Test implementation
  });
});
```

### Component Tests

Test components with React Testing Library:

```typescript
describe('ChoreList', () => {
  it('should render chores', () => {
    render(<ChoreList chores={mockChores} />);
    expect(screen.getByText('Dishes')).toBeInTheDocument();
  });
});
```

### Integration Tests

Test feature workflows:

```typescript
describe('Chore Management Flow', () => {
  it('should complete full chore workflow', async () => {
    // Test adding, completing, and point calculation
  });
});
```

## State Management

### Local State

Use React hooks for component state:

```typescript
const [isOpen, setIsOpen] = useState(false);
```

### Feature State

Use Context + Hooks pattern:

```typescript
const ChoreContext = createContext<ChoreContextValue>(null);

export const useChores = () => {
  const context = useContext(ChoreContext);
  if (!context) throw new Error('...');
  return context;
};
```

### Global State

For cross-feature state, use the app context:

```typescript
const AppContext = createContext<AppContextValue>(null);
```

## Performance Guidelines

### Code Splitting

```typescript
const ChoreStats = lazy(() => import('./ChoreStats'));
```

### Memoization

```typescript
const expensiveValue = useMemo(() => {
  return calculateExpensive(data);
}, [data]);
```

### Debouncing

```typescript
const debouncedSearch = useMemo(
  () => debounce(handleSearch, 300),
  []
);
```

## AI Integration Guidelines

### Prompt Engineering

Store prompts in dedicated files:

```typescript
// prompts/choreAssistant.ts
export const CHORE_ASSISTANT_PROMPT = `
You are a helpful assistant for managing family chores.
Current context: {{context}}
`;
```

### AI Service Calls

Always handle errors and provide fallbacks:

```typescript
try {
  const suggestion = await aiService.getSuggestion(prompt);
  return suggestion;
} catch (error) {
  console.error('AI service error:', error);
  return getDefaultSuggestion();
}
```

### User Privacy

- Never send personal data to external AI services
- Use local models when possible
- Anonymize data before sending to APIs

## Security Guidelines

### Input Validation

Always validate user input:

```typescript
const validateChore = (chore: unknown): Chore => {
  if (!isValidChore(chore)) {
    throw new ValidationError('Invalid chore data');
  }
  return chore as Chore;
};
```

### API Security

- Use authentication tokens
- Implement rate limiting
- Validate all API inputs

### Data Encryption

- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Don't store sensitive data in localStorage

## Deployment Checklist

Before deploying:

- [ ] All tests passing
- [ ] No console errors
- [ ] Performance audit complete
- [ ] Security review done
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version bumped

## Common Patterns

### Loading States

```typescript
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
return <YourComponent data={data} />;
```

### Form Handling

```typescript
const handleSubmit = async (values: FormValues) => {
  try {
    setSubmitting(true);
    await service.submit(values);
    showSuccess('Saved successfully');
  } catch (error) {
    showError('Failed to save');
  } finally {
    setSubmitting(false);
  }
};
```

### Event Handling

```typescript
useEffect(() => {
  const handleUpdate = (data: UpdateData) => {
    setData(data);
  };

  service.on('update', handleUpdate);
  return () => service.off('update', handleUpdate);
}, []);
```

## Troubleshooting

### Common Issues

1. **Circular dependencies**: Check import paths
2. **Type errors**: Ensure all types are exported
3. **Performance issues**: Check for unnecessary re-renders
4. **Build errors**: Clear node_modules and reinstall

### Debug Tools

- React DevTools
- Redux DevTools (if using Redux)
- Network tab for API issues
- Performance profiler

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Testing Library](https://testing-library.com/)
- [Tailwind CSS](https://tailwindcss.com/)
