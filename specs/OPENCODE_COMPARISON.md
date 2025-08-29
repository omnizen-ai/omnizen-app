# OpenCode vs Our Approach Comparison

## OpenCode's Architecture

### What They Have:
1. **Custom Tool System** (`Tool.define()`)
   - Own tool abstraction, not using AI SDK's `tool()` directly
   - Tools have context with sessionID, messageID, abort signal
   - Returns structured output with title, metadata, output

2. **Event Bus** (`Bus`)
   - Custom pub/sub system with Zod schemas
   - Type-safe event definitions
   - Global state management with subscriptions

3. **Agent System**
   - Complex agent definitions with permissions
   - Built-in agents (general, build, plan)
   - Agent modes: subagent, primary, all
   - Tool permissions per agent

4. **Session Management**
   - Parent-child session hierarchy
   - Session state persistence
   - Complex message handling

5. **Heavy Infrastructure**
   - Custom state management (`App.state()`)
   - Custom ID system (ulid)
   - Custom logging system
   - Plugin system
   - MCP integration
   - LSP integration

### OpenCode's Complexity:
- **1000+ lines** just for session management
- **Custom abstractions** for everything
- **CLI-focused** architecture
- **File system operations** are core
- **Complex permission system** for file/bash access

## Our Approach (Hybrid/Atomic)

### What We're Taking:
✅ **Organization** - Everything in `lib/omni/` folder
✅ **Tool Registry Concept** - But using AI SDK's `tool()` directly
✅ **Todo Management** - Similar concept, simpler implementation
✅ **Agent Types** - But as simple personas, not complex system
✅ **Session Context** - But much simpler (just a Map)

### What We're Avoiding:
❌ **Custom Tool Abstraction** - Use AI SDK's `tool()` directly
❌ **Complex Event Bus** - Start with console.log, add streaming later
❌ **Heavy State Management** - Use React state/database directly
❌ **Permission System** - Not needed for web
❌ **File System Focus** - We're web-focused
❌ **Plugin System** - YAGNI
❌ **Custom ID System** - Use crypto.randomUUID()
❌ **Complex Agent System** - Start with simple personas

### Key Differences:

| Aspect | OpenCode | Our Approach |
|--------|----------|--------------|
| **Tool Definition** | Custom `Tool.define()` | AI SDK `tool()` |
| **State Management** | Custom `App.state()` | React state + DB |
| **Events** | Complex Bus system | Simple streaming |
| **Agents** | Complex with permissions | Simple personas |
| **Focus** | CLI/File operations | Web/Chat interface |
| **Architecture** | All upfront | Incremental growth |
| **Abstraction** | Heavy from start | Add when needed |
| **Testing** | Complex setup | Immediate in chat |

## Why Our Approach is Better (For Us)

### 1. **Ship Faster**
- OpenCode: Weeks of infrastructure before first feature
- Ours: Planning tool in 30 minutes

### 2. **Less Complexity**
- OpenCode: ~5000+ lines of infrastructure
- Ours: ~100 lines to start

### 3. **Web-Native**
- OpenCode: CLI-first, file operations central
- Ours: Web-first, chat interface central

### 4. **Incremental Growth**
- OpenCode: Big bang architecture
- Ours: Add complexity only when needed

### 5. **Use What Works**
- OpenCode: Reinvents everything
- Ours: Leverages AI SDK, React, Drizzle

## Code Comparison

### Tool Definition

**OpenCode:**
```typescript
export const TodoWriteTool = Tool.define("todowrite", {
  description: DESCRIPTION_WRITE,
  parameters: z.object({
    todos: z.array(TodoInfo)
  }),
  async execute(params, opts) {
    const todos = state()
    todos[opts.sessionID] = params.todos
    return {
      title: `${params.todos.length} todos`,
      output: JSON.stringify(params.todos, null, 2),
      metadata: { todos: params.todos }
    }
  }
})
```

**Our Approach:**
```typescript
export const todoTool = tool({
  description: 'Manage todos',
  inputSchema: z.object({
    action: z.enum(['create', 'list', 'complete']),
    content: z.string().optional()
  }),
  execute: async ({ action, content }) => {
    // Direct implementation, no abstraction
    if (action === 'create') {
      todos.set(Date.now(), { content, status: 'pending' });
    }
    return { todos: Array.from(todos.values()) };
  }
});
```

### Events

**OpenCode:**
```typescript
// Complex bus system
Bus.publish(SessionEvents.MessageCreated, {
  sessionID: session.id,
  message: message
});

Bus.subscribe(SessionEvents.MessageCreated, (event) => {
  // Handle event
});
```

**Our Approach:**
```typescript
// Start simple
console.log('[Omni] Tool executed:', { tool: 'todo', result });

// Later add streaming
dataStream.writeData({ type: 'omni-event', data: { tool: 'todo', result }});
```

## Lessons Learned

### From OpenCode:
1. **Good organization** helps future portability
2. **Tool registry** is useful pattern
3. **Session context** enables smarter tools
4. **Agent personas** add value

### Our Improvements:
1. **Start simple** - Don't build what you don't need
2. **Use existing tools** - AI SDK, React, Drizzle work great
3. **Ship incrementally** - Value every day
4. **Test immediately** - In the actual interface
5. **Add abstraction later** - When you know what you need

## Conclusion

OpenCode is impressive but **over-engineered for our needs**. They built a Ferrari when we need a bicycle that we can upgrade to a motorcycle later.

Our approach:
- **Takes the good ideas** (organization, patterns)
- **Avoids the complexity** (custom everything)
- **Ships faster** (30 min vs weeks)
- **Grows naturally** (add what we need, when we need it)

The key insight: **We don't need to solve portability on day one. We need to ship value today.**