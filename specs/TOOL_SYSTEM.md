# Tool System Specification

## Overview
Enhanced tool system built on Vercel AI SDK, supporting dynamic discovery, composition, and agent-specific tools.

## Current Tools Inventory

### ✅ Existing Tools We Keep
- **getWeather** - Weather information
- **createDocument** - Create artifacts (text, code, sheets)
- **updateDocument** - Update existing documents
- **requestSuggestions** - Get follow-up suggestions
- **MCP Database Tools** (6 tools via Supabase)
  - `db_discover_schema`
  - `db_query`
  - `db_list_tables`
  - `db_get_table_data`
  - `db_insert_data`
  - `db_update_data`

### 🆕 New Tools to Add

#### Core Agent Tools
```typescript
// 1. Spawn Agent Tool
const spawnAgentTool = tool({
  description: 'Delegate a task to a specialized agent',
  parameters: z.object({
    agentType: z.enum([
      'data-explorer',
      'researcher', 
      'document-creator',
      'business-analyst',
      'workflow-automator'
    ]),
    task: z.string(),
    context: z.record(z.any()).optional(),
    waitForCompletion: z.boolean().default(true)
  }),
  execute: async ({ agentType, task, context, waitForCompletion }) => {
    // Implementation below
  }
});

// 2. Planning Tool
const planTool = tool({
  description: 'Create a step-by-step plan to achieve a goal',
  parameters: z.object({
    goal: z.string(),
    constraints: z.array(z.string()).optional(),
    maxSteps: z.number().default(10)
  }),
  execute: async ({ goal, constraints, maxSteps }) => {
    // Generate todos
    // Return structured plan
  }
});

// 3. Todo Management
const todoTool = tool({
  description: 'Manage task list and track progress',
  parameters: z.object({
    action: z.enum(['create', 'update', 'list', 'complete']),
    todos: z.array(z.object({
      id: z.string().optional(),
      content: z.string(),
      status: z.enum(['pending', 'in_progress', 'completed']),
      priority: z.enum(['high', 'medium', 'low'])
    })).optional()
  }),
  execute: async ({ action, todos }) => {
    // Manage todos in session context
  }
});

// 4. Web Search Tool (using existing SDK)
const webSearchTool = tool({
  description: 'Search the web for current information',
  parameters: z.object({
    query: z.string(),
    maxResults: z.number().default(5)
  }),
  execute: async ({ query, maxResults }) => {
    // Use AI SDK's web search
  }
});

// 5. Analytics Tool
const analyticsTool = tool({
  description: 'Analyze data and generate insights',
  parameters: z.object({
    data: z.array(z.record(z.any())),
    analysisType: z.enum(['summary', 'trends', 'anomalies', 'forecast']),
    options: z.record(z.any()).optional()
  }),
  execute: async ({ data, analysisType, options }) => {
    // Perform analysis
    // Return insights
  }
});
```

## Tool Registry Architecture

```typescript
// lib/tools/registry.ts
class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, Tool> = new Map();
  private agentTools: Map<string, Set<string>> = new Map();
  
  // Singleton
  static getInstance(): ToolRegistry {
    if (!this.instance) {
      this.instance = new ToolRegistry();
    }
    return this.instance;
  }
  
  // Register static tools
  registerStaticTools() {
    this.register('weather', getWeather);
    this.register('createDocument', createDocument);
    this.register('updateDocument', updateDocument);
    this.register('requestSuggestions', requestSuggestions);
    this.register('spawnAgent', spawnAgentTool);
    this.register('plan', planTool);
    this.register('todo', todoTool);
    this.register('webSearch', webSearchTool);
    this.register('analytics', analyticsTool);
  }
  
  // Register MCP tools (existing implementation)
  async registerMCPTools() {
    const mcpTools = await mcpClient.getTools();
    Object.entries(mcpTools).forEach(([name, tool]) => {
      this.register(name, tool);
    });
  }
  
  // Register agent-specific access
  configureAgentTools(agentId: string, toolIds: string[]) {
    this.agentTools.set(agentId, new Set(toolIds));
  }
  
  // Get tools for specific agent
  getToolsForAgent(agentId: string): Record<string, Tool> {
    const allowedTools = this.agentTools.get(agentId) || new Set();
    const result: Record<string, Tool> = {};
    
    allowedTools.forEach(toolId => {
      const tool = this.tools.get(toolId);
      if (tool) result[toolId] = tool;
    });
    
    return result;
  }
  
  // Get all tools
  getAllTools(): Record<string, Tool> {
    return Object.fromEntries(this.tools);
  }
}
```

## Tool Composition Pattern

```typescript
// Tools can call other tools
const workflowTool = tool({
  description: 'Execute a multi-step workflow',
  parameters: z.object({
    workflow: z.array(z.object({
      tool: z.string(),
      params: z.record(z.any()),
      dependsOn: z.array(z.string()).optional()
    }))
  }),
  execute: async ({ workflow }, context) => {
    const results: Record<string, any> = {};
    
    for (const step of workflow) {
      // Wait for dependencies
      if (step.dependsOn) {
        await Promise.all(
          step.dependsOn.map(dep => results[dep])
        );
      }
      
      // Execute tool
      const tool = registry.getTool(step.tool);
      results[step.tool] = await tool.execute(step.params, context);
    }
    
    return results;
  }
});
```

## Agent-Tool Configuration

```typescript
// Agent tool permissions
const agentConfigs = {
  'assistant': {
    tools: ['*'], // All tools
  },
  'planner': {
    tools: ['plan', 'todo', 'spawnAgent'],
  },
  'data-explorer': {
    tools: ['db_*', 'analytics', 'createDocument'],
  },
  'researcher': {
    tools: ['webSearch', 'createDocument', 'requestSuggestions'],
  },
  'document-creator': {
    tools: ['createDocument', 'updateDocument'],
  },
  'business-analyst': {
    tools: ['db_*', 'analytics', 'createDocument', 'webSearch'],
  },
  'workflow-automator': {
    tools: ['workflow', 'spawnAgent', 'todo'],
  }
};
```

## Tool Execution Context

```typescript
interface ToolContext {
  sessionId: string;
  messageId: string;
  agentId: string;
  userId: string;
  dataStream: DataStreamWriter;
  abort: AbortSignal;
  metadata: (data: any) => void;
  
  // Access to other tools
  callTool: (name: string, params: any) => Promise<any>;
  
  // Access to session state
  getSessionState: () => SessionState;
  updateSessionState: (state: Partial<SessionState>) => void;
}
```

## Tool Result Structure

```typescript
interface ToolResult {
  // Required
  success: boolean;
  output: any;
  
  // Optional metadata
  title?: string;
  summary?: string;
  visualizations?: Array<{
    type: 'chart' | 'table' | 'markdown';
    data: any;
  }>;
  suggestions?: string[];
  nextSteps?: TodoItem[];
  
  // For streaming
  stream?: ReadableStream;
}
```

## Integration with Chat Route

```typescript
// app/(chat)/api/chat/route.ts
export async function POST(request: Request) {
  const { message, selectedAgent } = requestBody;
  
  // Get registry instance
  const registry = ToolRegistry.getInstance();
  
  // Initialize tools if needed
  await registry.registerMCPTools();
  
  // Get tools for selected agent
  const agentTools = registry.getToolsForAgent(selectedAgent);
  
  const stream = createUIMessageStream({
    execute: ({ writer: dataStream }) => {
      const result = streamText({
        model: myProvider.languageModel(selectedChatModel),
        tools: agentTools,
        onToolCall: async ({ toolName, args }) => {
          // Emit tool events
          dataStream.writeData({
            type: 'tool-event',
            event: 'executing',
            tool: toolName,
            params: args
          });
        }
      });
    }
  });
}
```

## Tool Discovery UI

```typescript
// components/tool-explorer.tsx
export function ToolExplorer() {
  const [tools, setTools] = useState<Tool[]>([]);
  
  useEffect(() => {
    const registry = ToolRegistry.getInstance();
    setTools(Object.values(registry.getAllTools()));
  }, []);
  
  return (
    <div>
      {tools.map(tool => (
        <ToolCard 
          key={tool.name}
          tool={tool}
          onTest={(params) => testTool(tool, params)}
        />
      ))}
    </div>
  );
}
```

## Benefits

1. **Unified Interface** - All tools follow same pattern
2. **Dynamic Discovery** - MCP + static tools
3. **Agent Scoping** - Tools per agent type
4. **Composition** - Tools calling tools
5. **Type Safety** - Zod schemas throughout
6. **Streaming Support** - Real-time updates
7. **Testing** - Easy to test individual tools