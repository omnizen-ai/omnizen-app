# Agent Architecture Evolution - OmniZen Platform

## Executive Summary

This document captures the evolution of OmniZen's agent architecture from initial concept to final implementation strategy. Through iterative refinement, we developed a sophisticated system that combines:
- **Turn-based memory** (complete request-response cycles)
- **Normalized intent layer** (universal routing and embedding key)
- **Hybrid scoring** (turn success + query quality)
- **Natural selection** (only successful patterns survive)
- **Domain-specific embeddings** (256d optimized for SQL)

## The Journey: How Our Thinking Evolved

### Stage 1: Traditional Agent Architecture
**Initial Concept**: Multiple specialized agents with static routing

```
User Query → Intent Matching → Agent Selection → Execution
```

**Why We Moved On**: 
- Static routing couldn't handle complex, cross-domain queries
- No learning from past executions
- Token-inefficient (dumping entire schema into context)
- Agents couldn't leverage successful patterns from previous interactions

### Stage 2: Query-Level Intelligence
**Evolution**: Store and reuse successful SQL queries

```typescript
interface QueryCache {
  sql: string;
  intent: string;
  success_count: number;
  failure_count: number;
}
```

**Key Insight**: "Successful queries survive, failed queries die out - natural selection"

**Why We Evolved Further**:
- Individual queries lost execution context
- Fragmented learning (queries separate from routing decisions)
- Couldn't capture multi-step workflows
- Missing the relationship between queries in a conversation

### Stage 3: Delegation Memory
**Evolution**: Track which agent handled what successfully

```typescript
interface DelegationMemory {
  intent: string;
  agent_used: string;
  tools_used: string[];
  success: boolean;
}
```

**Why We Evolved Further**:
- Still fragmented (delegation separate from queries)
- Complex to maintain multiple tracking systems
- Lost the holistic view of complete executions

### Stage 4: Vector Embeddings vs Redis Scoring
**The Debate**: Should we use Redis with scoring algorithms or vector embeddings?

**Redis Approach**:
- Deterministic scoring
- Transparent ranking
- Fast mutations
- Manual similarity matching

**Vector Approach**:
- Semantic understanding ("unpaid invoices" ≈ "outstanding bills")
- Automatic clustering by context
- Handles variations naturally

**Decision**: **Hybrid approach using PGVector** 
- Embeddings for semantic similarity
- Fitness scoring for natural selection
- Best of both worlds

**Key Realization**: When metadata (user, org, workspace) is included in embeddings, queries naturally cluster by context - same user's queries colocate automatically!

### Stage 5: Intent Normalization as Universal Key
**Breakthrough**: LLM-normalized intent serves dual purpose

```typescript
const normalizedIntent = await llm.normalize(userQuery);
// Use for BOTH:
// 1. Routing to correct agent
// 2. Creating embeddings for similarity search
```

**Why This Works**:
- Single LLM call serves multiple purposes
- Standardized intents cluster perfectly in vector space
- Cross-language support (different phrasings map to same intent)
- Enables both routing AND learning

### Stage 6: Domain-Specific Embeddings
**Realization**: We don't need 1536-dimension general-purpose embeddings for SQL!

```typescript
// General purpose
embedding: vector(1536)  // Understands everything

// Domain-specific  
embedding: vector(256)   // Optimized for SQL + business domain
```

**Benefits**:
- 6x faster similarity search
- 6x less storage
- Real-time capable
- Future: Custom SQL-specific encoder (128d)

## Final Architecture: Turn-Based Hybrid Memory

### Core Concept
**A "turn" is a complete request-response cycle** - from user message to final agent response, potentially containing multiple steps and tool calls.

```typescript
interface TurnMemory {
  // Identity
  turn_id: string;
  chat_id: string;
  
  // The Request
  user_message: string;
  normalized_intent: string;  // LLM-normalized, used for routing AND embedding
  
  // The Execution
  execution_summary: {
    total_steps: number;
    agents_sequence: string[];  // Order matters!
    tools_used: string[];
    successful_queries: string[];  // ONLY successful SQL
    execution_flow: string;  // "finance_agent→sql→analytics_agent→format"
  };
  
  // The Outcome
  turn_fitness: number;  // Overall success
  query_avg_fitness: number;  // Quality of SQL queries
  composite_fitness: number;  // Weighted combination
  
  // The Learning
  turn_embedding: vector(256);  // Domain-specific, includes intent + context
  
  // Metadata
  user_id: string;
  org_id: string;
  workspace_id: string;
  model_used: string;
}
```

### Why Turn-Based?
1. **Natural Boundaries**: Aligns with AI SDK's `onFinish` callback
2. **Complete Context**: Preserves execution flow and relationships
3. **Atomic Learning**: Success/failure at the right granularity
4. **User-Centric**: Matches how users think about interactions

### The Hybrid Scoring System

```typescript
// Turn fitness (40% weight)
const turnScore = turn.finish_reason === 'stop' ? 1.0 : 0.3;

// Query fitness (60% weight) - MORE IMPORTANT!
const queryScore = successfulQueries.length > 0
  ? average(successfulQueries.map(q => q.fitness))
  : 0;

// Composite allows learning even from partial success
const compositeFitness = (queryScore * 0.6) + (turnScore * 0.4);
```

**Critical Rule**: **NEVER store failed SQL queries**, even if the turn succeeds!

### The Search Strategy

```typescript
async function findRelevantContext(userMessage: string, context: UserContext) {
  // 1. Normalize intent (universal key)
  const normalizedIntent = await normalizeIntent(userMessage);
  
  // 2. Create embedding with intent + context
  const searchEmbedding = await createEmbedding({
    intent: normalizedIntent,  // Primary component
    message: userMessage,      // Original for nuance
    org_id: context.org_id,   // Automatic clustering
    role: context.role
  });
  
  // 3. Find similar successful turns
  const similarTurns = await searchByEmbedding(searchEmbedding)
    .filter(turn => turn.successful_query_count > 0)  // Must have good SQL
    .filter(turn => turn.composite_fitness > 0.6);    // Quality threshold
  
  return {
    execution_patterns: similarTurns,  // Complete workflows
    proven_queries: extractQueries(similarTurns)  // Reusable SQL
  };
}
```

## Implementation Strategy

### Phase 1: Foundation
1. Create turn_memories table with vector support
2. Implement intent normalization service
3. Add turn capture to AI SDK's onFinish callback
4. Store only successful queries within turns

### Phase 2: Intelligence
1. Implement similarity search with PGVector
2. Add composite fitness scoring
3. Build context injection before streamText
4. Create natural selection cleanup job

### Phase 3: Optimization
1. Reduce embeddings to 256 dimensions
2. Add query deduplication via fingerprinting
3. Implement anti-pattern tracking (separate system)
4. Build performance monitoring dashboard

## Key Design Decisions

### What We Keep
- **Normalized intents** as universal routing/embedding key
- **Turn-based memory** for complete execution context
- **Hybrid scoring** (turn + query fitness)
- **Strict filtering** of failed queries
- **Domain-specific embeddings** (256d)
- **Contextual clustering** via metadata in embeddings

### What We Reject
- Fragment tracking (separate queries/delegations)
- Failed SQL storage in main memory
- General-purpose embeddings (1536d)
- Static routing rules
- Redis-only scoring (no semantic understanding)

## Critical Insights

1. **Intent normalization is the bridge** between human language and system understanding
2. **Turns are the natural unit** of learning, not individual queries
3. **Successful queries are assets** that can survive even failed turns
4. **Failed queries are toxic** and must never contaminate the learning pool
5. **Embeddings with metadata** create automatic organizational clustering
6. **Domain-specific embeddings** are 6x more efficient than general-purpose

## The Evolutionary Advantage

Our system exhibits true evolutionary characteristics:
- **Variation**: Different execution paths for same intent
- **Selection**: Fitness scoring determines survival
- **Inheritance**: Successful patterns passed to future executions
- **Adaptation**: System improves with each interaction

## Future Enhancements

### Near Term (1-3 months)
- Query template extraction from patterns
- Cross-organization learning (privacy-preserved)
- Automated index recommendations from query patterns

### Medium Term (3-6 months)
- Custom SQL-specific encoder (128d embeddings)
- Multi-language query normalization
- Predictive pre-caching of likely queries

### Long Term (6-12 months)
- Federated learning across deployments
- Query cost prediction and optimization
- Natural language to SQL fine-tuning

## Conclusion

Through this evolution, we've designed a system that:
- **Learns** from every interaction
- **Improves** through natural selection
- **Scales** efficiently with domain-specific embeddings
- **Adapts** to each organization's unique patterns
- **Remembers** complete execution contexts, not fragments

The key insight: By tracking complete turns with normalized intents and hybrid scoring, we create a system where **intelligence emerges from usage** rather than being programmed.

## Appendix: Why Each Evolution Was Necessary

| Stage | What We Learned | Why We Moved On |
|-------|----------------|-----------------|
| Static Agents | Need specialization | No learning capability |
| Query Caching | Patterns valuable | Lost execution context |
| Delegation Memory | Routing patterns matter | Too fragmented |
| Vector vs Redis | Need semantic understanding | Why not both? |
| Intent Normalization | Universal key needed | Dual-purpose brilliance |
| Turn-Based Memory | Natural boundaries | Complete context preserved |
| Hybrid Scoring | Queries + outcomes | Best of both worlds |
| Domain Embeddings | 1536d overkill for SQL | 6x efficiency gain |

The evolution from static agents to turn-based hybrid memory with domain-specific embeddings represents a journey from rule-based to truly adaptive intelligence.