# Agent Orchestration System Specification

## Overview
This document specifies the design of an intelligent agent orchestration system for the OmniZen app, adapting OpenCode's patterns while leveraging existing Vercel AI SDK capabilities and project infrastructure.

## Existing Infrastructure We'll Leverage

### ✅ Already Have
1. **Vercel AI SDK** - Tool management, streaming, MCP client
2. **MCP Integration** - Dynamic tool discovery from Supabase
3. **Streaming UI** - `createUIMessageStream`, real-time updates
4. **Database Tools** - 6 MCP tools for data operations
5. **NextAuth** - User session management
6. **Drizzle ORM** - Database operations
7. **Supabase** - Edge functions, storage, database
8. **Document Tools** - Create/update artifacts

### 🚫 Don't Need (Web-focused)
- File system operations (Read, Write, Edit)
- Code execution tools (Bash, etc.)
- IDE/LSP integrations
- Git operations

## Core Components

### 1. Agent System

#### Agent Types
```typescript
interface Agent {
  id: string;
  name: string;
  description: string;
  type: 'primary' | 'subagent' | 'specialist';
  model?: {
    provider: string;
    model: string;
  };
  tools: string[];  // Tool IDs this agent can use
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}
```

#### Proposed Agents

**Primary Agents** (User-facing):
- `assistant` - General purpose, routes to specialists
- `planner` - Creates action plans with todos
- `analyzer` - Data analysis and insights

**Subagents** (Task-specific):
- `data-explorer` - Database queries, schema exploration
- `researcher` - Web search, information gathering
- `document-creator` - Creates documents, reports
- `business-analyst` - Business metrics, KPIs
- `workflow-automator` - Multi-step workflows

### 2. Event Bus System

Using existing Next.js/React patterns instead of custom bus:

```typescript
// Use React Context + Server-Sent Events for real-time updates
interface EventBus {
  // Client-side events
  emit(event: string, data: any): void;
  on(event: string, handler: Function): () => void;
  
  // Server-side streaming via AI SDK
  streamEvent(event: AgentEvent): void;
}

type AgentEvent = 
  | { type: 'agent.started', agentId: string, taskId: string }
  | { type: 'agent.completed', agentId: string, result: any }
  | { type: 'tool.executing', toolName: string, params: any }
  | { type: 'tool.completed', toolName: string, result: any }
  | { type: 'plan.created', steps: TodoItem[] }
  | { type: 'plan.updated', todos: TodoItem[] }
```

### 3. Task Orchestration

Leverage AI SDK's existing tool system:

```typescript
// Subagent spawning using AI SDK tool
const spawnAgentTool = tool({
  description: 'Spawn a specialized agent for a specific task',
  parameters: z.object({
    agentType: z.enum(['data-explorer', 'researcher', ...]),
    task: z.string(),
    context: z.record(z.any()).optional(),
  }),
  execute: async ({ agentType, task, context }) => {
    // Create child session
    // Execute with specialized prompt
    // Stream results back
  }
});
```

### 4. Session Management

Extend existing chat sessions:

```typescript
interface AgentSession {
  id: string;
  parentId?: string;  // For sub-sessions
  chatId: string;     // Link to existing Chat table
  agentId: string;
  status: 'active' | 'completed' | 'failed';
  context: Record<string, any>;
  todos: TodoItem[];
  createdAt: Date;
}
```

### 5. Todo/Planning System

```typescript
interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  agentId?: string;  // Assigned agent
  dependencies?: string[];  // Other todo IDs
  result?: any;
}

// Planning tool using AI SDK
const planTool = tool({
  description: 'Create an execution plan',
  parameters: z.object({
    goal: z.string(),
    constraints: z.array(z.string()).optional(),
  }),
  execute: async ({ goal, constraints }) => {
    // Generate plan
    // Create todos
    // Return structured plan
  }
});
```

### 6. Tool Registry Enhancement

Extend existing tool system:

```typescript
class ToolRegistry {
  private tools: Map<string, Tool>;
  
  // Static tools (weather, documents, etc.)
  registerStaticTools() { }
  
  // MCP tools (already implemented)
  async registerMCPTools() { }
  
  // Agent-specific tools
  registerAgentTools() { }
  
  // Get tools for specific agent
  getToolsForAgent(agentId: string): Tool[] { }
}
```

## Integration Points

### 1. Chat Route Enhancement
```typescript
// app/(chat)/api/chat/route.ts
export async function POST(request: Request) {
  // Existing code...
  
  // Determine agent type from message
  const agent = await selectAgent(message);
  
  // Get agent-specific tools
  const agentTools = await toolRegistry.getToolsForAgent(agent.id);
  
  // Merge with MCP tools
  const allTools = { ...mcpTools, ...agentTools };
  
  // Stream with agent context
  const result = streamText({
    model: agent.model || defaultModel,
    system: agent.systemPrompt || defaultPrompt,
    tools: allTools,
    // ... existing streaming
  });
}
```

### 2. UI Components

**Agent Selector** - Let users choose agent type
**Todo Panel** - Show current plan/todos
**Agent Status** - Show active agents/subagents
**Context Inspector** - Debug agent context

### 3. Database Schema

```sql
-- New tables needed
CREATE TABLE "AgentSession" (
  id UUID PRIMARY KEY,
  parent_id UUID REFERENCES "AgentSession"(id),
  chat_id UUID REFERENCES "Chat"(id),
  agent_id VARCHAR NOT NULL,
  status VARCHAR NOT NULL,
  context JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "Todo" (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES "AgentSession"(id),
  content TEXT NOT NULL,
  status VARCHAR NOT NULL,
  priority VARCHAR NOT NULL,
  agent_id VARCHAR,
  dependencies JSONB,
  result JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Event system using SSE + React Context
- [ ] Agent registry and configuration
- [ ] Basic agent selection logic

### Phase 2: Core Agents (Week 2)
- [ ] Implement planner agent with todos
- [ ] Implement data-explorer using MCP tools
- [ ] Agent spawning tool

### Phase 3: Orchestration (Week 3)
- [ ] Parent-child session management
- [ ] Multi-agent coordination
- [ ] Context passing between agents

### Phase 4: UI Integration (Week 4)
- [ ] Agent selector component
- [ ] Todo/planning visualization
- [ ] Real-time status updates

## Key Differences from OpenCode

1. **Web-focused** - No file system or code execution
2. **Leverage AI SDK** - Use built-in streaming, tools
3. **React/Next.js native** - SSE instead of custom bus
4. **Database-centric** - Focus on business data operations
5. **UI-first** - Rich visual feedback, not CLI

## Success Metrics

- Agent selection accuracy > 90%
- Task completion rate > 85%
- Average time to complete multi-step tasks < 30s
- User satisfaction with agent responses > 4.5/5