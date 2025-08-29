# Implementation Roadmap

## Overview
Step-by-step implementation plan for the agent orchestration system, leveraging existing infrastructure and minimizing new code.

## Phase 1: Foundation (Week 1)
**Goal**: Set up core infrastructure using existing tools

### 1.1 Event System (2 days)
- [ ] Create `lib/events/emitter.ts` using AI SDK DataStream
- [ ] Create `components/providers/event-provider.tsx` 
- [ ] Add event types in `lib/types.ts`
- [ ] Test with existing chat streaming

**Uses existing**: 
- `createUIMessageStream` 
- React Context API
- AI SDK streaming

### 1.2 Tool Registry (2 days)
- [ ] Create `lib/tools/registry.ts` singleton
- [ ] Integrate existing tools (weather, documents, MCP)
- [ ] Add tool discovery methods
- [ ] Create tool testing utility

**Uses existing**:
- Current tool definitions
- MCP client integration
- Zod schemas

### 1.3 Agent Configuration (1 day)
- [ ] Create `lib/agents/config.ts` with agent definitions
- [ ] Define agent-tool mappings
- [ ] Add agent selection logic
- [ ] Store in existing Config system

**Uses existing**:
- Config management
- Database schema

## Phase 2: Core Agents (Week 2)
**Goal**: Implement essential agents using AI SDK

### 2.1 Planning Agent (2 days)
- [ ] Create `lib/agents/planner.ts`
- [ ] Implement planning tool with todo generation
- [ ] Add plan execution logic
- [ ] Test with simple goals

### 2.2 Data Explorer Agent (2 days)
- [ ] Create `lib/agents/data-explorer.ts`
- [ ] Leverage existing MCP database tools
- [ ] Add schema understanding
- [ ] Generate insights from queries

### 2.3 Spawn Agent Tool (1 day)
- [ ] Create `lib/tools/spawn-agent.ts`
- [ ] Implement child session creation
- [ ] Add context passing
- [ ] Handle result aggregation

**Uses existing**:
- MCP tools
- Session management
- Streaming infrastructure

## Phase 3: Orchestration (Week 3)
**Goal**: Enable multi-agent coordination

### 3.1 Session Hierarchy (2 days)
- [ ] Extend Chat/Message schema for parent-child
- [ ] Create migration with `drizzle-kit generate --custom`
- [ ] Implement session context management
- [ ] Add session state persistence

### 3.2 Todo System (2 days)
- [ ] Create Todo table schema
- [ ] Implement todo CRUD operations
- [ ] Add todo-agent assignment
- [ ] Create todo execution queue

### 3.3 Agent Coordination (1 day)
- [ ] Implement agent handoff logic
- [ ] Add result aggregation
- [ ] Create execution monitoring
- [ ] Handle failures and retries

**Uses existing**:
- Drizzle ORM
- Database migrations
- Error handling

## Phase 4: UI Integration (Week 4)
**Goal**: Rich user experience

### 4.1 Agent Selector (1 day)
- [ ] Create `components/agent-selector.tsx`
- [ ] Add to chat interface
- [ ] Store preference in session
- [ ] Show agent capabilities

### 4.2 Todo Panel (2 days)
- [ ] Create `components/todo-panel.tsx`
- [ ] Real-time todo updates via events
- [ ] Drag-drop priority management
- [ ] Progress visualization

### 4.3 Agent Status Display (1 day)
- [ ] Create `components/agent-status.tsx`
- [ ] Show active agents
- [ ] Display execution timeline
- [ ] Add performance metrics

### 4.4 Context Inspector (1 day)
- [ ] Create debug panel for development
- [ ] Show agent context
- [ ] Display tool calls
- [ ] Event stream viewer

**Uses existing**:
- React components
- Tailwind styling
- Framer Motion animations
- Radix UI components

## Phase 5: Advanced Features (Week 5+)
**Goal**: Enhanced capabilities

### 5.1 Workflow Automation
- [ ] Create workflow definition format
- [ ] Implement workflow executor
- [ ] Add workflow templates
- [ ] Create workflow builder UI

### 5.2 Learning & Adaptation
- [ ] Track agent performance
- [ ] Store successful patterns
- [ ] Implement preference learning
- [ ] Add feedback loop

### 5.3 Collaboration Features
- [ ] Multi-user agent sessions
- [ ] Shared context
- [ ] Agent handoff between users
- [ ] Team workflows

## Quick Wins (Can do immediately)

1. **Add Planning Prompt** (30 min)
   - Update `lib/ai/prompts.ts` with planning instructions
   - No new code needed

2. **Create Todo Tool** (1 hour)
   - Simple tool using existing patterns
   - Store in message metadata

3. **Add Agent Parameter** (30 min)
   - Add to chat request body
   - Select tools based on agent

4. **Event Streaming** (1 hour)
   - Add to existing `dataStream.writeData()`
   - Display in UI

## Migration Strategy

### Database Migrations
```bash
# For each new table
pnpm drizzle-kit generate --custom --name add_agent_tables
# Edit SQL file
pnpm db:migrate
```

### Incremental Rollout
1. Start with single agent type
2. Test with small user group
3. Add agents incrementally
4. Monitor performance

### Backwards Compatibility
- Keep existing chat flow as default
- Agent system as opt-in feature
- Gradual migration of users

## Success Metrics

### Week 1
- [ ] Events flowing through system
- [ ] Tools registered and discoverable
- [ ] Basic agent selection working

### Week 2
- [ ] Planning agent creates todos
- [ ] Data explorer answers questions
- [ ] Agents can spawn subagents

### Week 3
- [ ] Multi-step workflows execute
- [ ] Todos track progress
- [ ] Context passes between agents

### Week 4
- [ ] UI shows agent activity
- [ ] Users can select agents
- [ ] Real-time status updates

## Risk Mitigation

### Performance
- Limit agent depth (max 3 levels)
- Timeout long-running agents
- Cache common operations

### Cost
- Track token usage per agent
- Set limits per user
- Optimize prompts

### Complexity
- Start simple, iterate
- Hide complexity from users
- Provide good defaults

## Resources Needed

### External
- No new dependencies required
- All tools available in current stack

### Internal
- 1 developer for 4-5 weeks
- Design review for UI components
- Testing with real users

## Next Steps

1. **Review specs** with team
2. **Prioritize features** based on user needs
3. **Start with Phase 1.1** (Event System)
4. **Deploy incrementally** with feature flags