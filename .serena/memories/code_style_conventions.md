# Code Style and Conventions

## TypeScript Configuration
- **Strict mode enabled** - All TypeScript strict checks are active
- **Target**: ESNext
- **Module Resolution**: Bundler
- **JSX**: Preserve
- **Path Aliases**: Use `@/*` for absolute imports from project root

## File Organization

### Naming Conventions
- **Components**: PascalCase (e.g., `ChatMessage.tsx`)
- **Utilities/Hooks**: camelCase (e.g., `useChat.ts`, `formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- **File Extensions**: `.tsx` for React components, `.ts` for pure TypeScript

### Component Structure
```typescript
// Imports (external libraries first, then internal)
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// Type definitions
interface ComponentProps {
  title: string;
  onAction: () => void;
}

// Component definition
export function ComponentName({ title, onAction }: ComponentProps) {
  // Component logic
  return <div>...</div>;
}
```

## React Patterns
- Use **React Server Components** where possible
- Prefer **Server Actions** for data mutations
- Use `"use client"` directive only when client-side interactivity is needed
- Leverage Next.js App Router features

## Styling Conventions
- **Tailwind CSS** for all styling
- Use **tailwind-merge** for conditional classes
- Leverage **shadcn/ui** components as base
- Follow utility-first approach
- Use CSS variables for theming

## Import Organization
1. External packages
2. Next.js specific imports
3. UI components (`@/components/ui/*`)
4. Application components (`@/components/*`)
5. Utilities and helpers (`@/lib/*`)
6. Types (`@/lib/types`)
7. Constants (`@/lib/constants`)

## Code Quality Tools
- **Biome** for formatting and linting (primary)
- **ESLint** for additional Next.js specific rules
- **Prettier** config compatibility through ESLint

## Best Practices
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use TypeScript types/interfaces extensively
- Avoid `any` type - use proper typing
- Implement proper error boundaries
- Use environment variables for configuration
- Follow Next.js optimization recommendations
- Implement proper loading and error states

## Database Conventions
- Use **Drizzle ORM** for all database operations
- Define schemas in `lib/db/schema.ts`
- Use migrations for schema changes
- Follow naming conventions for tables and columns (snake_case)

## Authentication
- Use **Auth.js** (NextAuth) patterns
- Implement proper session management
- Follow security best practices

## Testing
- Write tests using **Playwright**
- Follow test file naming: `*.test.ts` or `*.spec.ts`
- Test critical user flows

## Comments and Documentation
- Avoid unnecessary comments
- Write self-documenting code
- Use JSDoc for complex functions when needed
- Keep README updated with setup instructions