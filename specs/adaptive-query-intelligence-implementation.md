# Adaptive Query Intelligence - Implementation Plan

## Executive Summary

OmniZen's Adaptive Query Intelligence system uses evolutionary learning principles combined with vector embeddings to create a self-improving SQL generation platform. The system learns from every interaction, with successful queries surviving and failed ones being eliminated through natural selection.

## Core Architecture

### System Overview

```
User Query → Intent Normalization → Contextual Embedding → Vector Search 
    ↓                                                           ↓
Query Generation ← Similar Successful Queries ← Fitness Scoring
    ↓
Execute & Track → Update Fitness → Natural Selection
```

### Key Innovations

1. **Normalized Intent Layer**: LLM normalizes varied user queries into standardized business intents
2. **Contextual Embeddings**: Queries automatically cluster by org, workspace, role, and industry
3. **Fitness Scoring**: Natural selection ensures only working queries survive
4. **Domain-Specific Embeddings**: 256-dimension vectors optimized for SQL domain (6x faster than general-purpose)

## Database Schema

```sql
-- Core query intelligence table
CREATE TABLE query_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User Input & Normalization
  user_query TEXT NOT NULL,
  normalized_intent TEXT NOT NULL,  -- LLM-generated standardized intent
  intent_category TEXT,              -- financial_reporting, operational_query, etc.
  
  -- Embeddings (256d for SQL domain optimization)
  embedding vector(256),             -- 6x smaller than general-purpose
  embedding_input TEXT,              -- What we embedded (for debugging)
  
  -- SQL & Execution
  sql_query TEXT NOT NULL,
  execution_time_ms INTEGER,
  result_row_count INTEGER,
  error_message TEXT,
  
  -- Fitness Metrics (Natural Selection)
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  user_satisfaction FLOAT,           -- 0-1 score from thumbs up/down
  last_used TIMESTAMPTZ DEFAULT NOW(),
  
  -- Computed Fitness Score
  fitness_score FLOAT GENERATED ALWAYS AS (
    CASE 
      WHEN success_count + failure_count = 0 THEN 0.5
      ELSE (
        (success_count::FLOAT / (success_count + failure_count) * 0.4) +
        (1.0 / (1 + EXTRACT(EPOCH FROM (NOW() - last_used))/86400) * 0.2) +
        (COALESCE(user_satisfaction, 0.5) * 0.2) +
        (CASE WHEN execution_time_ms > 0 
          THEN (1.0 / (1 + execution_time_ms/1000.0) * 0.2)
          ELSE 0.2 END)
      )
    END
  ) STORED,
  
  -- Context & Metadata
  org_id UUID REFERENCES organizations(id),
  workspace_id UUID REFERENCES workspaces(id),
  user_id UUID REFERENCES users(id),
  user_role TEXT,
  industry TEXT,
  company_size TEXT,
  
  -- Query Analysis
  tables_used TEXT[],
  operations_used TEXT[],           -- ['SELECT', 'JOIN', 'GROUP BY']
  complexity_score INTEGER,          -- 1-5 scale
  is_template BOOLEAN DEFAULT FALSE,
  parent_query_id UUID REFERENCES query_intelligence(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_qi_embedding ON query_intelligence 
  USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_qi_fitness ON query_intelligence(fitness_score DESC);
CREATE INDEX idx_qi_org ON query_intelligence(org_id, fitness_score DESC);
CREATE INDEX idx_qi_category ON query_intelligence(intent_category);
CREATE INDEX idx_qi_tables ON query_intelligence USING GIN(tables_used);

-- Query lineages for conversation tracking
CREATE TABLE query_lineages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  parent_query_id UUID REFERENCES query_intelligence(id),
  child_query_id UUID REFERENCES query_intelligence(id),
  transformation_type TEXT,  -- 'drill_down', 'filter', 'aggregate', 'pivot'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Anti-patterns learned from failures
CREATE TABLE query_antipatterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern TEXT NOT NULL,
  issue_description TEXT,
  suggested_fix TEXT,
  occurrence_count INTEGER DEFAULT 1,
  domains TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

#### Objectives
- Set up basic query caching with embeddings
- Implement intent normalization
- Create simple fitness tracking

#### Tasks

1. **Database Setup**
```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Create tables
-- Run the schema from above

-- Add to existing agent tables
ALTER TABLE agent_executions 
  ADD COLUMN query_intelligence_id UUID REFERENCES query_intelligence(id);
```

2. **Intent Normalization Service**
```typescript
// lib/ai/services/intent-normalizer.ts
export class IntentNormalizer {
  async normalize(userQuery: string, context: UserContext): Promise<NormalizedIntent> {
    const prompt = `
      Analyze this query and generate a standardized intent description.
      
      User Query: "${userQuery}"
      User Role: ${context.role}
      Industry: ${context.industry}
      
      Return a JSON object with:
      - intent: Clear technical description using standard business terms
      - category: One of [financial_reporting, operational_query, data_entry, analytics]
      - tables_needed: Array of likely table names
      - complexity: 1-5 scale
      
      Examples:
      Query: "What do I owe?"
      Intent: "Retrieve accounts payable balance with aging analysis"
      
      Query: "Show revenue"  
      Intent: "Calculate total revenue for current period"
    `;
    
    const response = await llm.complete(prompt);
    return JSON.parse(response);
  }
}
```

3. **Embedding Service with Reduced Dimensions**
```typescript
// lib/ai/services/embedding-service.ts
export class EmbeddingService {
  async createEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      input: text,
      model: "text-embedding-3-small",
      dimensions: 256  // Optimized for SQL domain
    });
    return response.data[0].embedding;
  }
  
  async createContextualEmbedding(
    intent: string, 
    userQuery: string,
    context: UserContext
  ): Promise<number[]> {
    // Build rich context for embedding
    const embeddingText = `
      Intent: ${intent}
      Query: ${userQuery}
      Organization: ${context.org_name} (${context.industry})
      Role: ${context.role}
      Workspace: ${context.workspace_name}
    `;
    
    return this.createEmbedding(embeddingText);
  }
}
```

4. **Query Intelligence Repository**
```typescript
// lib/ai/repositories/query-intelligence.ts
export class QueryIntelligenceRepository {
  async findSimilar(
    embedding: number[], 
    context: UserContext,
    limit: number = 10
  ): Promise<QueryIntelligence[]> {
    return await sql`
      WITH ranked_queries AS (
        SELECT 
          *,
          1 - (embedding <=> ${embedding}::vector) as similarity,
          CASE
            WHEN user_id = ${context.user_id} THEN 0.3
            WHEN workspace_id = ${context.workspace_id} THEN 0.2
            WHEN org_id = ${context.org_id} THEN 0.1
            ELSE 0
          END as context_bonus
        FROM query_intelligence
        WHERE org_id IN (${context.org_id}, NULL)
          AND fitness_score > 0.3
      )
      SELECT *,
        (similarity * 0.7 + context_bonus + fitness_score * 0.3) as final_score
      FROM ranked_queries
      WHERE similarity > 0.7
      ORDER BY final_score DESC
      LIMIT ${limit}
    `;
  }
  
  async updateFitness(queryId: string, success: boolean): Promise<void> {
    if (success) {
      await sql`
        UPDATE query_intelligence 
        SET success_count = success_count + 1,
            last_used = NOW()
        WHERE id = ${queryId}
      `;
    } else {
      await sql`
        UPDATE query_intelligence 
        SET failure_count = failure_count + 1
        WHERE id = ${queryId}
      `;
    }
  }
}
```

### Phase 2: Intelligence Layer (Week 3-4)

#### Objectives
- Implement natural selection algorithm
- Add query lineage tracking
- Build anti-pattern detection

#### Tasks

1. **Natural Selection Service**
```typescript
// lib/ai/services/natural-selection.ts
export class NaturalSelectionService {
  async evolve(): Promise<void> {
    // Kill unfit queries
    await sql`
      DELETE FROM query_intelligence
      WHERE fitness_score < 0.2
        AND created_at < NOW() - INTERVAL '30 days'
        AND success_count < 3
    `;
    
    // Promote high-performers to templates
    await sql`
      UPDATE query_intelligence
      SET is_template = true
      WHERE fitness_score > 0.85
        AND success_count > 20
        AND is_template = false
    `;
    
    // Record anti-patterns from failures
    await sql`
      INSERT INTO query_antipatterns (pattern, issue_description, domains)
      SELECT 
        sql_query,
        error_message,
        ARRAY[intent_category]
      FROM query_intelligence
      WHERE failure_count > success_count * 2
        AND error_message IS NOT NULL
      ON CONFLICT DO NOTHING
    `;
  }
}
```

2. **Query Lineage Tracker**
```typescript
// lib/ai/services/query-lineage.ts
export class QueryLineageService {
  private sessionQueries: Map<string, string[]> = new Map();
  
  async trackQuery(
    sessionId: string,
    queryId: string,
    parentId?: string
  ): Promise<void> {
    if (parentId) {
      const transformationType = await this.detectTransformation(parentId, queryId);
      
      await sql`
        INSERT INTO query_lineages 
        (session_id, parent_query_id, child_query_id, transformation_type)
        VALUES (${sessionId}, ${parentId}, ${queryId}, ${transformationType})
      `;
    }
    
    // Update session history
    const history = this.sessionQueries.get(sessionId) || [];
    history.push(queryId);
    this.sessionQueries.set(sessionId, history);
  }
  
  private async detectTransformation(
    parentId: string, 
    childId: string
  ): Promise<string> {
    // Analyze SQL differences to determine transformation type
    // drill_down, filter, aggregate, pivot, etc.
  }
}
```

3. **Anti-Pattern Injection**
```typescript
// lib/ai/services/query-generator.ts
export class QueryGenerator {
  async generate(
    intent: string,
    examples: QueryIntelligence[],
    antiPatterns: QueryAntiPattern[],
    context: UserContext
  ): Promise<string> {
    const prompt = `
      Generate SQL for this intent: ${intent}
      
      Context:
      - Organization: ${context.org_name}
      - User Role: ${context.role}
      - Available Tables: ${context.accessible_tables}
      
      SUCCESSFUL EXAMPLES (use these patterns):
      ${examples.map(e => `-- Intent: ${e.normalized_intent}\n${e.sql_query}`).join('\n\n')}
      
      AVOID THESE PATTERNS (they cause errors):
      ${antiPatterns.map(ap => `-- DON'T: ${ap.issue_description}\n-- Bad: ${ap.pattern}`).join('\n')}
      
      Requirements:
      - Include RLS filters (org_id = ?)
      - Use semantic views when available
      - Optimize for performance
    `;
    
    return await llm.generateSQL(prompt);
  }
}
```

### Phase 3: Evolution & Optimization (Week 5-6)

#### Objectives
- Implement query fingerprinting
- Add performance monitoring
- Build feedback loops

#### Tasks

1. **Query Fingerprinting**
```typescript
// lib/ai/services/query-fingerprint.ts
export class QueryFingerprintService {
  fingerprint(sql: string): string {
    // Normalize SQL for deduplication
    const normalized = sql
      .replace(/\s+/g, ' ')                    // Normalize whitespace
      .replace(/['"][\w\s]+['"]/g, '?')       // Replace literals with ?
      .replace(/\d+/g, '?')                    // Replace numbers with ?
      .replace(/\bIN\s*\([^)]+\)/gi, 'IN (?)') // Normalize IN clauses
      .toLowerCase();
    
    const tables = this.extractTables(normalized);
    const operations = this.extractOperations(normalized);
    
    return crypto
      .createHash('sha256')
      .update(`${normalized}|${tables.join(',')}|${operations.join(',')}`)
      .digest('hex');
  }
  
  private extractTables(sql: string): string[] {
    // Extract table names from FROM, JOIN clauses
  }
  
  private extractOperations(sql: string): string[] {
    // Extract SELECT, JOIN, GROUP BY, etc.
  }
}
```

2. **Performance Monitor**
```typescript
// lib/ai/services/performance-monitor.ts
export class PerformanceMonitor {
  async analyze(): Promise<QueryMetrics> {
    const metrics = await sql`
      SELECT 
        AVG(execution_time_ms) as avg_execution_time,
        AVG(LENGTH(embedding_input)) as avg_context_size,
        COUNT(*) FILTER (WHERE success_count > 0) / COUNT(*)::FLOAT as success_rate,
        COUNT(DISTINCT normalized_intent) as unique_intents,
        COUNT(*) FILTER (WHERE is_template) as template_count
      FROM query_intelligence
      WHERE created_at > NOW() - INTERVAL '7 days'
    `;
    
    return metrics;
  }
  
  async identifyBottlenecks(): Promise<Bottleneck[]> {
    // Find slow queries that need optimization
    return await sql`
      SELECT 
        normalized_intent,
        AVG(execution_time_ms) as avg_time,
        COUNT(*) as frequency,
        sql_query
      FROM query_intelligence
      WHERE execution_time_ms > 1000
      GROUP BY normalized_intent, sql_query
      HAVING COUNT(*) > 5
      ORDER BY frequency DESC
    `;
  }
}
```

3. **Feedback Loop Integration**
```typescript
// lib/ai/services/feedback-service.ts
export class FeedbackService {
  async recordUserFeedback(
    queryId: string, 
    satisfaction: number
  ): Promise<void> {
    await sql`
      UPDATE query_intelligence
      SET user_satisfaction = ${satisfaction}
      WHERE id = ${queryId}
    `;
    
    // If negative feedback, potentially record as anti-pattern
    if (satisfaction < 0.3) {
      await this.investigateFailure(queryId);
    }
  }
  
  private async investigateFailure(queryId: string): Promise<void> {
    // Analyze why query received negative feedback
    // Add to anti-patterns if systematic issue
  }
}
```

## API Endpoints

```typescript
// app/api/ai/query/route.ts
export async function POST(request: Request) {
  const { query } = await request.json();
  const context = await getUserContext();
  
  // 1. Normalize intent
  const normalized = await intentNormalizer.normalize(query, context);
  
  // 2. Create contextual embedding
  const embedding = await embeddingService.createContextualEmbedding(
    normalized.intent,
    query,
    context
  );
  
  // 3. Find similar successful queries
  const examples = await queryRepo.findSimilar(embedding, context);
  
  // 4. Get anti-patterns
  const antiPatterns = await antiPatternRepo.getRelevant(normalized.category);
  
  // 5. Generate SQL
  const sql = await queryGenerator.generate(
    normalized.intent,
    examples,
    antiPatterns,
    context
  );
  
  // 6. Execute and track
  const queryId = await queryRepo.create({
    user_query: query,
    normalized_intent: normalized.intent,
    sql_query: sql,
    embedding,
    ...context
  });
  
  try {
    const result = await executeQuery(sql);
    await queryRepo.updateFitness(queryId, true);
    return { success: true, result, queryId };
  } catch (error) {
    await queryRepo.updateFitness(queryId, false);
    return { success: false, error: error.message, queryId };
  }
}
```

## Monitoring & Analytics

### Key Metrics Dashboard

```sql
-- Query performance over time
CREATE VIEW v_query_performance AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  AVG(fitness_score) as avg_fitness,
  COUNT(*) as query_count,
  AVG(execution_time_ms) as avg_execution_time,
  COUNT(*) FILTER (WHERE success_count > 0) / COUNT(*)::FLOAT as success_rate
FROM query_intelligence
GROUP BY DATE_TRUNC('day', created_at);

-- Top performing patterns by domain
CREATE VIEW v_top_patterns AS
SELECT 
  intent_category,
  normalized_intent,
  MAX(fitness_score) as best_fitness,
  SUM(success_count) as total_successes,
  MIN(execution_time_ms) as best_time,
  ARRAY_AGG(DISTINCT sql_query ORDER BY fitness_score DESC) as sql_variations
FROM query_intelligence
WHERE fitness_score > 0.7
GROUP BY intent_category, normalized_intent;

-- Learning progression
CREATE VIEW v_learning_metrics AS
SELECT 
  org_id,
  COUNT(DISTINCT normalized_intent) as intents_learned,
  AVG(fitness_score) as avg_fitness,
  COUNT(*) FILTER (WHERE is_template) as templates_created,
  COUNT(DISTINCT user_id) as active_users
FROM query_intelligence
GROUP BY org_id;
```

## Migration Path from Current System

1. **Keep existing query_templates table**
2. **Parallel run new system for 30 days**
3. **Migrate high-performing queries to templates**
4. **Gradually shift traffic to new system**
5. **Deprecate static templates**

## Future Enhancements

### Month 3-6
- Custom embedding model training
- Multi-language support
- Query explanation generation
- Automated index recommendations

### Month 6-12
- Federated learning across organizations
- Query cost prediction
- Automated query optimization
- Natural language to SQL fine-tuning

## Success Criteria

- **Week 2**: 50% of queries use cached examples
- **Week 4**: 80% first-attempt success rate
- **Week 8**: 30% reduction in average query time
- **Week 12**: 50% reduction in support tickets for query issues

## Security Considerations

1. **Data Isolation**: Queries never leak across organizations
2. **PII Protection**: Automatic detection and masking
3. **Audit Trail**: Complete tracking via agent_audit_trail
4. **RLS Enforcement**: All queries include org_id filtering
5. **Permission Checks**: Respect user's accessible_tables

## Conclusion

This adaptive query intelligence system transforms OmniZen from a static SQL generator into a learning platform that improves with every interaction. By combining vector embeddings for semantic understanding with fitness scoring for natural selection, the system achieves both intelligence and efficiency, ultimately providing users with an experience that feels like having a data analyst who knows their business intimately.