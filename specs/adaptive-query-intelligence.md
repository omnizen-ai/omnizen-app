# Adaptive Query Intelligence Architecture

## Overview

OmniZen implements an evolutionary query intelligence system that learns from successful queries and improves over time. This document outlines the architecture for a self-improving, token-efficient agent system that leverages collective intelligence across users, organizations, and the platform.

## Core Concept

The system operates on natural selection principles:
- **Successful queries survive** and get reused as examples
- **Failed queries die out** and are discarded
- **Common patterns evolve** into templates
- **Mistakes become anti-patterns** to avoid

## Architecture Components

### 1. Query Evolution Pipeline

```
User Query → Intent Classification → Context Injection
                                           ↓
                              [User Context + Top Scored Examples]
                                           ↓
                                    SQL Generation
                                           ↓
                                 Success? → Cache & Score
                                 Failure? → Discard
```

### 2. Three-Tier Agent Orchestration

```
┌─────────────────────────────────────────────┐
│         OMNI (Master Orchestrator)          │
│   - Intent Classification & Routing         │
│   - Context State Management                │
│   - Token Budget Allocation                 │
│   - Context Stitching from Cache            │
└─────────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
┌──────────────────┐      ┌──────────────────┐
│  Domain Agents   │      │  Domain Agents   │
├──────────────────┤      ├──────────────────┤
│ • Finance Agent  │      │ • Personal Agent │
│ • Inventory Agent│      │ • Analytics Agent│
│ • Orders Agent   │      │ • Automation Agent│
└──────────────────┘      └──────────────────┘
        │                           │
        ▼                           ▼
┌──────────────────────────────────────────┐
│           Specialist Tools               │
│ • SQL Generator  • Report Builder        │
│ • Data Validator • Semantic Mapper       │
└──────────────────────────────────────────┘
```

### 3. Redis Cache Structure

```typescript
interface QueryCache {
  // Key: hash of (intent + domain + org_id)
  id: string;
  
  // Core Query Data
  sql: string;
  intent: string;  // "show monthly revenue"
  domain: string[];  // ["finance", "analytics"]
  
  // Metadata for Scoring
  success_count: number;
  failure_count: number;
  avg_execution_time: number;
  last_used: timestamp;
  
  // Context
  tables_used: string[];
  user_role: string;
  org_id: string;
  workspace_id?: string;
  
  // Performance
  result_count: number;
  user_satisfaction?: number;  // thumbs up/down
  
  // Variations
  similar_queries: string[];  // IDs of related queries
  parent_template?: string;   // If derived from template
}
```

### 4. Multi-Level Learning Hierarchy

```
Platform Level (Global)
├── Universal patterns (work across all orgs)
├── Common mistakes to avoid
└── Optimized query structures

Organization Level
├── Company-specific metrics
├── Custom field mappings
└── Business rule patterns

Workspace Level
├── Department-specific queries
├── Team conventions
└── Local optimizations

User Level
├── Personal shortcuts
├── Frequently asked questions
└── Individual preferences
```

### 5. Dynamic Context Injection

```typescript
interface DynamicContext {
  // Static user context (always included)
  userContext: {
    org_id: string;
    workspace_id: string;
    role: string;
    accessible_tables: string[];
  };
  
  // Dynamic examples (top 5-10 based on intent)
  examples: {
    exact_matches: QueryCache[];     // Same intent
    similar_domain: QueryCache[];    // Same domain
    similar_pattern: QueryCache[];   // Similar SQL structure
  };
  
  // Minimal schema (only referenced tables)
  schema: TableDefinition[];
  
  // Anti-patterns to avoid
  antiPatterns: QueryMistake[];
}
```

### 6. Query Scoring Algorithm

```typescript
function scoreQuery(query: QueryCache): number {
  const successRate = query.success_count / 
    (query.success_count + query.failure_count);
  const recencyScore = 1 / (1 + daysSince(query.last_used));
  const frequencyScore = Math.log(query.success_count + 1);
  const performanceScore = 1 / (1 + query.avg_execution_time);
  
  return (
    successRate * 0.4 +
    recencyScore * 0.2 +
    frequencyScore * 0.2 +
    performanceScore * 0.2
  );
}
```

### 7. Context Window Strategy

**Dynamic Context Windows:**
- **Narrow Context**: Single table/view operations (2-3k tokens)
- **Domain Context**: Related tables within module (5-8k tokens)  
- **Cross-Domain Context**: Multi-module operations (10-15k tokens)
- **Full Context**: Complete semantic view access (20k+ tokens)

Context size dynamically adjusts based on:
- Query complexity
- Available cached examples
- Token budget
- User's query history

### 8. Agent Specialization

#### Omni (Master Orchestrator)
- **Primary Role**: Context stitcher and router
- **Responsibilities**:
  - Intent classification using semantic catalog
  - Fetch relevant cached queries
  - Build minimal, focused context
  - Route to appropriate domain agent
  - Maintain conversation state

#### Domain Agents

**Finance Agent:**
- Tables: invoices, bills, payments, journals, chart_of_accounts
- Views: v_balance_sheet, v_profit_loss, v_cash_flow
- Specialties: Multi-currency, tax calculations, reconciliation

**Inventory Agent:**
- Tables: warehouses, inventory_levels, stock_moves
- Views: v_inventory_status
- Specialties: Stock tracking, reorder points, movements

**Orders Agent:**  
- Tables: sales_orders, purchase_orders, fulfillments
- Views: v_order_pipeline
- Specialties: Order lifecycle, fulfillment logic

**Personal Finance Agent:**
- Tables: personal_budgets, expenses, goals
- Views: v_personal_dashboard
- Specialties: Budget tracking, expense categorization

**Analytics Agent:**
- All semantic views
- Specialties: KPI calculation, trend analysis, forecasting

### 9. Query Lifecycle Example

```
Day 1: User asks "Show me unpaid invoices"
→ Agent generates SQL (with basic context)
→ Success! Cache with metadata
→ Score: 1.0 (initial)

Day 7: Same user asks "List overdue invoices"  
→ System finds similar cached query
→ Includes as example in context
→ Agent writes better SQL instantly
→ Success! Both queries scored higher

Day 30: Different user, same org asks "What invoices need attention?"
→ System includes org-level successful patterns
→ Near-perfect SQL on first try
→ Pattern recognized, score boosted

Day 90: Platform has 1000s of invoice queries
→ Top patterns become templates
→ New orgs benefit from collective intelligence
→ Common mistakes documented as anti-patterns
```

### 10. Mistake Prevention System

```typescript
interface QueryMistake {
  pattern: string;      // The problematic SQL pattern
  issue: string;        // What went wrong
  correction: string;   // How to fix it
  frequency: number;    // How often this mistake occurs
  domains: string[];    // Where this mistake happens
}

// Examples injected as anti-patterns:
context.antiPatterns = [
  "-- DON'T: This query causes cartesian join",
  "-- DON'T: Missing org_id filter (RLS violation)",
  "-- DON'T: Hardcoded dates instead of parameters",
  "-- DON'T: Using * in production queries"
];
```

### 11. Implementation Phases

#### Phase 1: Foundation (Weeks 1-2)
- Basic Redis caching of successful queries
- Simple scoring based on success/failure
- Manual intent classification
- Single-level cache (org level only)

#### Phase 2: Intelligence (Weeks 3-4)
- Multi-level hierarchy (user/org/platform)
- Smart scoring algorithm
- Similar query detection
- Anti-pattern collection

#### Phase 3: Evolution (Weeks 5-6)
- Automatic template generation
- Cross-org pattern learning
- Query optimization suggestions
- Performance monitoring

#### Phase 4: Optimization (Ongoing)
- Token usage analytics
- Cache pruning strategies
- Query plan optimization
- Automated A/B testing of patterns

### 12. Token Optimization Benefits

1. **Reduced Context Size**: Only relevant, proven examples included
2. **Faster Generation**: Models learn from successful patterns
3. **Fewer Retries**: Mistakes avoided through anti-patterns
4. **Cached Results**: Common queries served from cache
5. **Progressive Enhancement**: Context grows only when needed

### 13. Monitoring & Metrics

```typescript
interface QueryMetrics {
  // Efficiency Metrics
  avg_tokens_per_query: number;
  cache_hit_rate: number;
  first_attempt_success_rate: number;
  
  // Learning Metrics
  patterns_discovered: number;
  mistakes_prevented: number;
  templates_generated: number;
  
  // Performance Metrics
  avg_query_time: number;
  avg_context_size: number;
  token_savings_percentage: number;
}
```

### 14. Security & Privacy

- **Data Isolation**: Queries never leak across organizations
- **PII Protection**: Sensitive data patterns flagged and filtered
- **Role-Based Access**: Query examples respect user permissions
- **Audit Trail**: All query generation logged for compliance

### 15. Future Enhancements

1. **Semantic Similarity**: Use embeddings for better example matching
2. **Query Explanation**: Auto-generate explanations for complex queries
3. **Performance Prediction**: Estimate query cost before execution
4. **Collaborative Filtering**: Recommend queries based on similar users
5. **Automated Indexing**: Suggest database indexes based on query patterns

## Summary

This adaptive query intelligence system creates a self-improving platform where:
- Every successful query makes the system smarter
- Mistakes are learned once and avoided forever
- Organizations benefit from collective intelligence
- Token usage decreases over time as patterns solidify
- New users get expert-level query generation from day one

The key insight: **Omni doesn't just route queries, it stitches optimal context from evolutionary query patterns**, creating an intelligent system that improves with every interaction.