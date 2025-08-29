# Atomic Implementation Roadmap

## Principles
- Each step is a complete, working feature
- Each step can be tested immediately
- Each step provides value on its own
- No step depends on future steps to work
- Each step takes 2-4 hours max

## Architecture Strategy: Hybrid Approach (Option 3)
1. **Start with AI SDK compatibility** - Use Vercel AI SDK tool format directly
2. **Organize in lib/omni/** - Keep all intelligent features together
3. **Export clean API** - Simple interface for the app to consume
4. **Abstract later** - Add portability layer only when needed
5. **Ship fast, evolve smart** - Working code > perfect architecture

## Implementation Steps

> **Note**: We'll use AI SDK's `tool()` function directly but organize everything in `lib/omni/`.
> Abstraction will be added incrementally as needed, not upfront.

### Step 1: Simple Planning Tool ✅ Immediately Testable
**What**: Add a `plan` tool that generates structured plans
- Create `lib/omni/tools/plan.ts` using AI SDK's `tool()` function
- Create `lib/omni/index.ts` that exports `{ planTool }`
- Import in chat route: `import { planTool } from '@/lib/omni'`
- Add to tools: `{ ...existingTools, plan: planTool }`
- **Test**: Type "make a plan for launching a startup" in chat
- **Value**: Users can generate structured plans immediately

### Step 2: Todo Tool ✅ Immediately Testable  
**What**: Add a `todo` tool that creates/manages todos in memory
- Create `lib/omni/tools/todo.ts` using AI SDK's `tool()` function
- Create `lib/omni/state/todos.ts` for in-memory Map storage
- Export from `lib/omni/index.ts`: `{ planTool, todoTool }`
- Add to chat route tools: `{ ...existingTools, plan: planTool, todo: todoTool }`
- **Test**: "add todo: write introduction" in chat
- **Value**: Basic task tracking within chat session

### Step 3: Todo Persistence ✅ Immediately Testable
**What**: Save todos to database
- Add `todos` table to Drizzle schema
- Create `lib/omni/storage/todos-db.ts` with save/load functions
- Update `todoTool` to use database instead of memory
- No abstraction yet - direct Drizzle usage is fine
- **Test**: Todos persist across page refreshes
- **Value**: Todos are permanently saved

### Step 4: Todo UI Panel ✅ Immediately Testable
**What**: Show todos in sidebar
- Create `lib/omni/components/todo-panel.tsx` React component
- Import directly in chat layout: `import { TodoPanel } from '@/lib/omni/components/todo-panel'`
- Use database queries directly (no abstraction needed yet)
- Add drag to reorder, click to complete
- **Test**: See todos appear in sidebar as you chat
- **Value**: Visual task management

### Step 5: Simple Event Logging ✅ Immediately Testable
**What**: Log tool executions to console
- Add console.log to tool executions in `planTool` and `todoTool`
- Create `lib/omni/utils/logger.ts` with structured logging
- Format: `[Omni] Tool: plan | Input: {...} | Output: {...}`
- **Test**: See formatted logs in browser console
- **Value**: Debug tool execution

### Step 6: Event Stream to UI ✅ Immediately Testable
**What**: Stream events to frontend
- In tool execution, add: `dataStream.writeData({ type: 'omni-event', data: {...} })`
- Update `DataStreamHandler` to handle `omni-event` type
- Dispatch as custom DOM event for components to listen
- **Test**: Events flow from server to client
- **Value**: Real-time feedback

### Step 7: Event Monitor Component ✅ Immediately Testable
**What**: Visual event monitor
- Create `lib/omni/components/event-monitor.tsx`
- Listen to DOM events from Step 6
- Show last 10 events with timestamps in collapsible panel
- Add to layout only in development mode
- **Test**: See live events as you interact
- **Value**: System transparency

### Step 8: Web Search Tool ✅ Immediately Testable
**What**: Add web search capability
- Create `lib/omni/tools/web-search.ts` using `tool()` function
- Use fetch to call a search API (or AI SDK's web search if available)
- Export from `lib/omni/index.ts` and add to chat route
- **Test**: "search for latest AI developments"
- **Value**: Current information access

### Step 9: Analytics Tool ✅ Immediately Testable
**What**: Analyze data from queries
- Create `lib/omni/tools/analytics.ts` using `tool()` function
- Takes data array and generates summary statistics
- Returns insights in markdown format
- **Test**: "analyze this data: [1,2,3,4,5]"
- **Value**: Data insights

### Step 10: Spawn Subtask Tool ✅ Immediately Testable
**What**: Break tasks into subtasks
- Create `lib/omni/tools/spawn-subtask.ts`
- Reuses `todoTool` internally to create linked todos
- Sets parentId field on child todos
- **Test**: "break down: launch a product"
- **Value**: Task decomposition

### Step 11: Session Context ✅ Immediately Testable
**What**: Track execution context
- Create `lib/omni/state/context.ts` with Map for session data
- Tools can read/write to context: `context.set('lastPlan', plan)`
- Pass context to all tool executions
- **Test**: Second tool can reference first tool's output
- **Value**: Smarter tool chaining

### Step 12: Agent Personas ✅ Immediately Testable
**What**: Different AI personalities
- Create `lib/omni/agents/personas.ts` with persona definitions
- Add selector component: `lib/omni/components/agent-selector.tsx`
- Modify system prompt based on selection
- **Test**: Select "Technical Expert" vs "Creative Writer"
- **Value**: Tailored responses

### Step 13: Tool Permissions ✅ Immediately Testable
**What**: Limit tools by agent
- Create `lib/omni/agents/tool-mapping.ts`
- Filter tools in chat route based on selected agent
- Example: Planner only gets `planTool` and `todoTool`
- **Test**: Different agents have different capabilities
- **Value**: Specialized agents

### Step 14: Workflow Templates ✅ Immediately Testable
**What**: Pre-built workflows
- Create `lib/omni/workflows/templates.ts` with JSON definitions
- Create `lib/omni/tools/workflow.ts` that executes templates
- Templates are sequences of tool calls
- **Test**: "run workflow: blog creation"
- **Value**: One-click complex tasks

### Step 15: Progress Tracking ✅ Immediately Testable
**What**: Visual progress bars
- Track todo completion percentage
- Show progress in UI
- Animate on updates
- **Test**: See progress bar fill as todos complete
- **Value**: Visual feedback

### Step 16: Error Recovery ✅ Immediately Testable
**What**: Graceful error handling
- Catch and log tool errors
- Suggest alternatives on failure
- Retry with backoff
- **Test**: Intentionally fail a tool
- **Value**: Robustness

### Step 17: Export Results ✅ Immediately Testable
**What**: Export chat/todos
- Export to Markdown
- Export to JSON
- Copy to clipboard
- **Test**: Click export button
- **Value**: Share results

### Step 18: Tool Composition ✅ Immediately Testable
**What**: Tools calling tools
- Allow tools to invoke other tools
- Pass results between tools
- **Test**: Plan tool creates todos automatically
- **Value**: Automation

### Step 19: Conditional Execution ✅ Immediately Testable
**What**: If-then logic in tools
- Add condition checking
- Branch execution paths
- **Test**: "if weather is good, plan outdoor activity"
- **Value**: Smart automation

### Step 20: User Preferences ✅ Immediately Testable
**What**: Remember user preferences
- Store preferences in user profile
- Apply to all sessions
- **Test**: Set preference for detailed explanations
- **Value**: Personalization

## Success Metrics per Step
- Can be tested within 30 seconds of implementation
- Adds visible value to the user
- Works without any future steps
- Can be shipped to production alone

## Implementation Order
Start with Step 1 and go sequentially. Each step builds value but doesn't depend on future steps.

## Time Estimates
- Each step: 2-4 hours
- Total: ~60 hours (2-3 weeks at normal pace)
- Can ship value every single day

## Quick Wins (Do First)
1. Step 1: Planning Tool (30 minutes)
2. Step 2: Todo Tool (1 hour) 
3. Step 4: Todo UI Panel (2 hours)
→ **3.5 hours to visible task management!**

## Testing Strategy
Each step includes its test right in the description. No separate testing phase needed.

## Rollback Strategy
Each step is independent. Can disable any feature with a flag without affecting others.