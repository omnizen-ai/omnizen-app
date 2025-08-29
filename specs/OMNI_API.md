# Omni API Design

## Core Principle  
Omni is an **intelligent orchestration system** organized in `lib/omni/` for potential portability.

## Development Philosophy (Hybrid Approach)
1. **Start with what works** - Use AI SDK tools directly, no abstraction
2. **Organize for future** - Keep everything in `lib/omni/` folder
3. **Evolve when needed** - Add abstraction only when porting
4. **Ship value fast** - Working features > perfect architecture

## Folder Structure (Incremental Growth)
```
lib/omni/
├── index.ts              # Simple exports: { planTool, todoTool, ... }
├── tools/                # AI SDK tools
│   ├── plan.ts          # Step 1: Planning tool
│   ├── todo.ts          # Step 2: Todo tool
│   ├── web-search.ts    # Step 8: Web search
│   └── analytics.ts     # Step 9: Analytics
├── state/                # In-memory state (added as needed)
│   ├── todos.ts         # Step 2: Todo storage
│   └── context.ts       # Step 11: Session context
├── storage/              # Database operations (added in Step 3)
│   └── todos-db.ts      # Direct Drizzle usage
├── components/           # React components (added in Step 4)
│   ├── todo-panel.tsx   # Step 4: Todo UI
│   └── event-monitor.tsx # Step 7: Event monitor
├── agents/               # Agent logic (added in Step 12)
│   ├── personas.ts      # Step 12: Agent personas
│   └── tool-mapping.ts  # Step 13: Tool permissions
├── workflows/            # Workflows (added in Step 14)
│   └── templates.ts     # Step 14: Workflow templates
└── utils/                # Utilities (added as needed)
    └── logger.ts        # Step 5: Structured logging
```

## API Evolution by Step

### Step 1-2: Simple Exports
```typescript
// lib/omni/index.ts
export { planTool } from './tools/plan';
export { todoTool } from './tools/todo';
```

### Step 1-2: Usage in Chat
```typescript
// app/(chat)/api/chat/route.ts
import { planTool, todoTool } from '@/lib/omni';

const allTools = {
  ...existingTools,
  plan: planTool,
  todo: todoTool,
};
```

### Step 11: With Context
```typescript
// lib/omni/index.ts
import { context } from './state/context';

export { planTool, todoTool, context };
```

### Step 20: Final Form (if needed)
```typescript
// lib/omni/index.ts
class Omni {
  getTools() { /* return all tools */ }
  getContext() { /* return context */ }
  // ... other methods
}

export default new Omni();
```

## Usage in React Components

### Step 4: Direct Import
```typescript
// app/(chat)/layout.tsx
import { TodoPanel } from '@/lib/omni/components/todo-panel';

export default function Layout() {
  return <TodoPanel />; // Uses database directly
}
```

### Step 7: Event Monitor
```typescript
// app/(chat)/layout.tsx
import { TodoPanel } from '@/lib/omni/components/todo-panel';
import { EventMonitor } from '@/lib/omni/components/event-monitor';

export default function Layout() {
  return (
    <>
      <TodoPanel />
      {process.env.NODE_ENV === 'development' && <EventMonitor />}
    </>
  );
}
```

## Future Portability (Not Initial Focus)

When we need to make Omni portable:

1. **Add abstraction layer** over AI SDK tools
2. **Create storage adapters** for different databases  
3. **Export as npm package** `@omnizen/omni`
4. **Framework adapters** for Express, CLI, Electron, etc.

But for now:
- **Use AI SDK directly** - It works, ship it
- **Use Drizzle directly** - No abstraction needed
- **Import from lib/omni** - Good enough organization

## Benefits of Hybrid Approach

1. **Fast to ship** - Can add planning tool in 30 minutes
2. **Organized** - Everything in `lib/omni/` from start
3. **No over-engineering** - Use existing tools that work
4. **Future-ready** - Can add abstraction when needed
5. **Testable** - Each step works independently
6. **Incremental** - Grow the API as we add features

## Summary

- **Week 1**: Ship working tools using AI SDK directly
- **Week 2**: Add UI components and persistence  
- **Week 3**: Add advanced features (context, agents, workflows)
- **Future**: Abstract and package when we need portability

The key is: **Ship value now, refactor later when we know what we need.**