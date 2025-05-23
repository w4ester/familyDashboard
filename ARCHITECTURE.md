# Family Dashboard Architecture Guide

## Overview

This document outlines the architecture principles and patterns used in the Family Dashboard application to ensure maintainability and scalability as the project grows.

## Architecture Principles

### 1. **Feature-Based Organization**
- Code is organized by feature rather than by file type
- Each feature is self-contained with its own components, services, and utilities
- Shared code is extracted to common modules

### 2. **Separation of Concerns**
- **Presentation Layer**: React components handle UI
- **Business Logic Layer**: Services handle business rules
- **Data Layer**: API clients and data persistence
- **Integration Layer**: MCP and AI integrations

### 3. **Dependency Direction**
- Dependencies flow inward: UI → Services → Core
- Core business logic doesn't depend on external frameworks
- External integrations are abstracted behind interfaces

## Directory Structure

```
src/
├── features/              # Feature-based modules
│   ├── chores/           # Chore tracking feature
│   │   ├── components/   # React components
│   │   ├── services/     # Business logic
│   │   ├── hooks/        # Custom React hooks
│   │   ├── types/        # TypeScript types
│   │   └── index.ts      # Public API
│   ├── assignments/      # School assignments
│   ├── calendar/         # Family calendar
│   ├── ai-assistant/     # AI integration
│   └── auth/             # Authentication
├── core/                 # Core business logic
│   ├── models/           # Domain models
│   ├── utils/            # Pure utility functions
│   └── constants/        # App-wide constants
├── shared/               # Shared components/utilities
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Shared React hooks
│   └── services/         # Shared services
├── infrastructure/       # External integrations
│   ├── api/             # API clients
│   ├── mcp/             # MCP integration
│   ├── storage/         # Data persistence
│   └── ai/              # AI/LLM providers
└── App.tsx              # Main app component
```

## Component Architecture

### Container/Presentational Pattern
```typescript
// Container Component (Smart)
const ChoreListContainer: React.FC = () => {
  const { chores, loading } = useChores();
  const { addChore } = useChoreActions();
  
  return <ChoreList chores={chores} onAdd={addChore} loading={loading} />;
};

// Presentational Component (Dumb)
const ChoreList: React.FC<ChoreListProps> = ({ chores, onAdd, loading }) => {
  // Pure UI rendering
};
```

## Service Layer Architecture

### Service Interface Pattern
```typescript
// Define interface
interface ChoreService {
  getChores(): Promise<Chore[]>;
  addChore(chore: ChoreInput): Promise<Chore>;
  updateChore(id: string, updates: Partial<Chore>): Promise<Chore>;
  deleteChore(id: string): Promise<void>;
}

// Implementation
class ChoreServiceImpl implements ChoreService {
  constructor(private storage: StorageService) {}
  
  async getChores(): Promise<Chore[]> {
    return this.storage.get('chores') || [];
  }
  // ... other methods
}
```

## State Management

### Context + Hooks Pattern
```typescript
// Feature-specific context
const ChoreContext = createContext<ChoreContextValue | null>(null);

// Custom hook for consuming
export const useChores = () => {
  const context = useContext(ChoreContext);
  if (!context) throw new Error('useChores must be used within ChoreProvider');
  return context;
};
```

## Integration Points

### MCP Integration
- All MCP communication goes through the `infrastructure/mcp` layer
- Feature services use MCP client abstraction
- No direct MCP dependencies in components

### AI Integration
- AI features are encapsulated in `features/ai-assistant`
- LLM providers are abstracted in `infrastructure/ai`
- Prompt templates are managed centrally

## Testing Strategy

### Test Organization
```
__tests__/
├── unit/              # Unit tests for services/utils
├── integration/       # Integration tests
├── components/        # Component tests
└── e2e/              # End-to-end tests
```

## Code Quality Standards

### TypeScript Configuration
- Strict mode enabled
- No implicit any
- Explicit return types for public APIs

### Linting and Formatting
- ESLint for code quality
- Prettier for consistent formatting
- Pre-commit hooks for validation

## Performance Considerations

### Code Splitting
- Lazy load feature modules
- Dynamic imports for heavy dependencies
- Route-based code splitting

### Data Management
- Optimistic updates for better UX
- Caching strategies for API calls
- Debouncing for search/filter operations

## Security Guidelines

### API Security
- All API calls use authentication
- Sensitive data encrypted at rest
- Input validation on all forms

### AI/LLM Security
- Sanitize user inputs before sending to LLMs
- Rate limiting on AI features
- No sensitive data in prompts

## Development Workflow

### Feature Development
1. Create feature folder structure
2. Define types and interfaces
3. Implement service layer
4. Build UI components
5. Add tests
6. Update documentation

### Code Review Checklist
- [ ] Follows architecture patterns
- [ ] Has appropriate tests
- [ ] Documentation updated
- [ ] No circular dependencies
- [ ] Performance considerations addressed

## Migration Strategy

### Gradual Migration
1. Start with new features using new architecture
2. Refactor existing features incrementally
3. Extract shared code as patterns emerge
4. Update tests alongside refactoring

## Documentation Standards

### Component Documentation
```typescript
/**
 * ChoreList displays a list of chores with filtering and sorting
 * @param chores - Array of chore objects
 * @param onAdd - Callback for adding new chore
 * @param loading - Loading state indicator
 */
```

### Service Documentation
- Document public APIs
- Include usage examples
- Note any side effects

## Monitoring and Debugging

### Error Boundaries
- Wrap features in error boundaries
- Log errors to monitoring service
- Provide user-friendly error messages

### Development Tools
- React DevTools for component debugging
- Redux DevTools for state inspection
- Network tab for API debugging

## Future Considerations

### Scalability Plans
- Consider state management library (Redux/Zustand) when needed
- Plan for offline-first architecture
- Prepare for multi-tenant support

### Technology Upgrades
- Keep dependencies updated
- Plan major version migrations
- Document breaking changes
