# Event System Specification

## Overview
Real-time event system for agent orchestration using existing Next.js/React patterns and Vercel AI SDK streaming capabilities.

## Architecture

### Server-Side Events (Using AI SDK Streaming)

```typescript
// Leverage existing createUIMessageStream
interface AgentStreamEvent {
  type: 'agent' | 'tool' | 'plan' | 'status';
  event: string;
  data: any;
  timestamp: Date;
}

// Extend existing message streaming
const stream = createUIMessageStream({
  execute: ({ writer: dataStream }) => {
    // Existing AI streaming...
    
    // Add agent events
    dataStream.writeData({
      type: 'agent',
      event: 'subagent.spawned',
      data: { agentId, task }
    });
  }
});
```

### Client-Side Event Handling

```typescript
// React Context for event distribution
interface EventContextValue {
  events: AgentStreamEvent[];
  subscribe: (handler: EventHandler) => () => void;
  emit: (event: AgentStreamEvent) => void;
}

const EventContext = createContext<EventContextValue>();

// Hook for components
function useAgentEvents(filter?: EventFilter) {
  const { events, subscribe } = useContext(EventContext);
  // Return filtered events
}
```

## Event Types

### Agent Lifecycle Events
```typescript
type AgentLifecycleEvent = 
  | { event: 'agent.initialized', agentId: string, config: AgentConfig }
  | { event: 'agent.started', agentId: string, sessionId: string }
  | { event: 'agent.thinking', agentId: string, thought: string }
  | { event: 'agent.completed', agentId: string, result: any }
  | { event: 'agent.failed', agentId: string, error: string }
  | { event: 'agent.spawned_child', parentId: string, childId: string }
```

### Tool Execution Events
```typescript
type ToolEvent = 
  | { event: 'tool.called', toolName: string, params: any }
  | { event: 'tool.executing', toolName: string, progress?: number }
  | { event: 'tool.result', toolName: string, result: any }
  | { event: 'tool.error', toolName: string, error: string }
```

### Planning Events
```typescript
type PlanEvent = 
  | { event: 'plan.generating', goal: string }
  | { event: 'plan.created', todos: TodoItem[] }
  | { event: 'plan.step_started', todoId: string }
  | { event: 'plan.step_completed', todoId: string, result: any }
  | { event: 'plan.updated', todos: TodoItem[] }
  | { event: 'plan.completed', summary: string }
```

### MCP Events
```typescript
type MCPEvent = 
  | { event: 'mcp.connecting', server: string }
  | { event: 'mcp.connected', server: string, tools: string[] }
  | { event: 'mcp.tool_discovered', toolName: string }
  | { event: 'mcp.error', server: string, error: string }
```

## Implementation

### 1. Server-Side Event Emitter

```typescript
// lib/events/emitter.ts
class AgentEventEmitter {
  constructor(private dataStream: DataStreamWriter) {}
  
  emit(event: AgentStreamEvent) {
    this.dataStream.writeData({
      type: 'agent-event',
      ...event,
      timestamp: new Date()
    });
  }
  
  // Helper methods
  agentStarted(agentId: string) {
    this.emit({
      type: 'agent',
      event: 'agent.started',
      data: { agentId }
    });
  }
  
  toolExecuting(toolName: string, params: any) {
    this.emit({
      type: 'tool',
      event: 'tool.executing',
      data: { toolName, params }
    });
  }
}
```

### 2. Client-Side Event Consumer

```typescript
// components/providers/event-provider.tsx
export function EventProvider({ children }) {
  const [events, setEvents] = useState<AgentStreamEvent[]>([]);
  const handlers = useRef(new Set<EventHandler>());
  
  // Listen to stream
  useEffect(() => {
    const handleStreamData = (data: any) => {
      if (data.type === 'agent-event') {
        setEvents(prev => [...prev, data]);
        handlers.current.forEach(h => h(data));
      }
    };
    // Subscribe to stream
  }, []);
  
  const subscribe = useCallback((handler: EventHandler) => {
    handlers.current.add(handler);
    return () => handlers.current.delete(handler);
  }, []);
  
  return (
    <EventContext.Provider value={{ events, subscribe, emit }}>
      {children}
    </EventContext.Provider>
  );
}
```

### 3. Event Visualization Components

```typescript
// components/agent-status.tsx
export function AgentStatus() {
  const events = useAgentEvents({ type: 'agent' });
  const activeAgents = useMemo(() => {
    // Calculate active agents from events
  }, [events]);
  
  return (
    <div className="agent-status">
      {activeAgents.map(agent => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}

// components/execution-timeline.tsx  
export function ExecutionTimeline() {
  const events = useAgentEvents();
  
  return (
    <Timeline>
      {events.map(event => (
        <TimelineItem key={event.timestamp} event={event} />
      ))}
    </Timeline>
  );
}
```

## Integration with Existing Code

### Modify Chat Route
```typescript
// app/(chat)/api/chat/route.ts
const stream = createUIMessageStream({
  execute: ({ writer: dataStream }) => {
    const eventEmitter = new AgentEventEmitter(dataStream);
    
    // Emit events during execution
    eventEmitter.agentStarted(selectedAgent.id);
    
    const result = streamText({
      // ... existing config
      onToolCall: ({ toolName, args }) => {
        eventEmitter.toolExecuting(toolName, args);
      }
    });
  }
});
```

### Extend Message Types
```typescript
// lib/types.ts
export interface ChatMessage {
  // ... existing fields
  events?: AgentStreamEvent[];  // Attach events to messages
}
```

## Benefits Over Custom Bus

1. **Native Integration** - Works with existing streaming
2. **Type Safety** - Full TypeScript support
3. **React Patterns** - Familiar Context/Hook APIs
4. **No Extra Dependencies** - Uses what we have
5. **SSE Support** - Real-time updates built-in

## Usage Examples

### Listen to Agent Events
```typescript
function MyComponent() {
  const { events } = useAgentEvents({ 
    type: 'agent',
    event: 'agent.completed' 
  });
  
  useEffect(() => {
    const completed = events[events.length - 1];
    if (completed) {
      toast.success(`Agent ${completed.data.agentId} completed!`);
    }
  }, [events]);
}
```

### Track Tool Execution
```typescript
function ToolMonitor() {
  const [executing, setExecuting] = useState<string[]>([]);
  
  useAgentEvents({
    type: 'tool',
    handler: (event) => {
      if (event.event === 'tool.executing') {
        setExecuting(prev => [...prev, event.data.toolName]);
      } else if (event.event === 'tool.result') {
        setExecuting(prev => prev.filter(t => t !== event.data.toolName));
      }
    }
  });
  
  return <ToolList tools={executing} />;
}