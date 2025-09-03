# Research Notes: Competitive Learning & Fine-tuning Pipeline for OmniZen

## Abstract

This document outlines a novel approach to training an ERP-specific AI assistant through competitive multi-instance learning, pattern extraction, and eventual model fine-tuning. By leveraging DeepSeek's open-weight architecture, we create a self-improving system that evolves from context-dependent to natively intelligent through competitive training and curated dataset generation.

## Table of Contents

1. [Core Hypothesis](#core-hypothesis)
2. [Architecture Overview](#architecture-overview)
3. [Competitive Learning Framework](#competitive-learning-framework)
4. [Pattern Storage & Retrieval](#pattern-storage--retrieval)
5. [Fine-tuning Pipeline](#fine-tuning-pipeline)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Expected Outcomes](#expected-outcomes)

## Core Hypothesis

**Traditional approaches to multi-agent systems introduce unnecessary complexity through premature abstraction.** Instead of building elaborate orchestration layers, we propose:

1. A single model (Omni) with direct tool access
2. Competitive training to discover optimal execution patterns
3. Pattern injection as dynamic orchestration
4. Fine-tuning to embed learned intelligence directly into model weights

**Key Insight**: Orchestration is not a structural requirement but an emergent property of learned patterns.

## Architecture Overview

### Current System State
```typescript
// Existing implementation (minimal changes needed)
streamText({
  model: myProvider.languageModel('deepseek-chat'),
  system: systemPrompt,  // Enhance with patterns
  tools: allTools,       // Add DB tools
  onFinish: async (result) => {
    await storeTurnPattern(result);  // Add pattern storage
  }
});
```

### Proposed Architecture

```
┌─────────────────────────────────────────┐
│         Competitive Training            │
│   5 Omni instances compete on tasks     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Pattern Extraction              │
│   Store successful execution patterns   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Context Injection               │
│   Runtime pattern matching & injection  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Dataset Curation                │
│   Select best patterns for training     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Model Fine-tuning               │
│   Embed intelligence into DeepSeek      │
└─────────────────────────────────────────┘
```

## Competitive Learning Framework

### Competition Structure

```typescript
interface Competition {
  instances: OmniInstance[];  // 5 competing instances
  challenges: Challenge[];     // ERP tasks of varying difficulty
  scoring: ScoringRubric;      // Multi-factor evaluation
  evolution: EvolutionStrategy; // Natural selection mechanism
}
```

### Challenge Design

```typescript
const challenges = [
  // Level 1: Basic Operations
  {
    category: 'finance',
    difficulty: 1,
    task: "Get total revenue for current month",
    optimal_steps: 2,
    expected_outcome: { type: 'number', validation: 'positive' }
  },
  
  // Level 2: Comparative Analysis
  {
    category: 'finance',
    difficulty: 2,
    task: "Compare revenue month-over-month",
    optimal_steps: 3,
    expected_outcome: { type: 'comparison', fields: ['current', 'previous', 'change'] }
  },
  
  // Level 3: Multi-step Operations
  {
    category: 'inventory',
    difficulty: 3,
    task: "Identify low stock and create purchase orders",
    optimal_steps: 5,
    expected_outcome: { type: 'action', verification: 'orders_created' }
  },
  
  // Level 4: Complex Reporting
  {
    category: 'reporting',
    difficulty: 4,
    task: "Generate P&L with variance analysis",
    optimal_steps: 7,
    expected_outcome: { type: 'report', sections: ['revenue', 'expenses', 'variance'] }
  },
  
  // Level 5: Workflow Automation
  {
    category: 'finance',
    difficulty: 5,
    task: "Perform month-end close",
    optimal_steps: 12,
    expected_outcome: { type: 'workflow', checkpoints: ['reconciled', 'adjusted', 'closed'] }
  }
];
```

### Competitive Execution

```typescript
class CompetitiveTrainer {
  async runTournament() {
    for (const challenge of challenges) {
      // Parallel execution across instances
      const results = await Promise.all([
        this.instances.alpha.execute(challenge),
        this.instances.beta.execute(challenge),
        this.instances.gamma.execute(challenge),
        this.instances.delta.execute(challenge),
        this.instances.epsilon.execute(challenge),
      ]);
      
      // Extract learnings from ALL attempts
      await this.extractPatterns(results, challenge);
      
      // Natural selection
      await this.evolveInstances(results);
    }
  }
  
  async extractPatterns(results: ExecutionResult[], challenge: Challenge) {
    // Store successful patterns regardless of overall outcome
    for (const result of results) {
      const successfulQueries = result.queries.filter(q => q.success);
      
      if (successfulQueries.length > 0) {
        await this.storePattern({
          intent: this.normalizeIntent(challenge.task),
          tool_sequence: result.tool_calls,
          successful_queries: successfulQueries,
          fitness: this.calculateFitness(result, challenge)
        });
      }
    }
  }
}
```

### Strategy Variations

Each instance employs different strategies to promote diverse solution discovery:

```typescript
const strategies = {
  alpha: { prefer_views: true, risk_tolerance: 'low' },    // Conservative
  beta: { prefer_views: false, risk_tolerance: 'high' },   // Aggressive
  gamma: { balanced: true },                               // Balanced
  delta: { use_todos: true, verify_steps: true },         // Methodical
  epsilon: { exploration_rate: 0.3 }                      // Experimental
};
```

## Pattern Storage & Retrieval

### Turn Memory Schema

```sql
CREATE TABLE turn_memories (
  id UUID PRIMARY KEY,
  
  -- Core Pattern
  normalized_intent TEXT NOT NULL,
  role TEXT NOT NULL,  -- Universal roles, not user-specific
  
  -- Execution Details
  tool_sequence TEXT[],  -- ['dbRead', 'aggregate', 'format']
  successful_queries JSONB,  -- Only successful SQL
  
  -- Quality Metrics
  turn_fitness FLOAT,
  query_avg_fitness FLOAT,
  composite_fitness FLOAT GENERATED ALWAYS AS (
    (query_avg_fitness * 0.6) + (turn_fitness * 0.4)
  ) STORED,
  
  -- Embedding (domain-specific, 256d)
  embedding vector(256),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_synthetic BOOLEAN DEFAULT true,  -- From competition
  
  -- Indexes
  INDEX idx_embedding USING ivfflat (embedding vector_cosine_ops),
  INDEX idx_fitness (composite_fitness DESC),
  INDEX idx_intent (normalized_intent)
);
```

### Critical Design Decisions

1. **No Failed Queries**: Never store failed SQL, even from successful turns
2. **Intent-First**: Normalized intent is the primary key for pattern matching
3. **Role-Based, Not User-Based**: Patterns are universal (CFO, Accountant), not personalized
4. **Composite Scoring**: Values query quality over turn completion

### Pattern Retrieval

```typescript
async function findRelevantPatterns(query: string, role: string) {
  const intent = await normalizeIntent(query);
  
  const embedding = await createEmbedding(`
    Intent: ${intent}
    Role: ${role}
  `);  // Simple, focused embedding
  
  return await sql`
    SELECT 
      tool_sequence,
      successful_queries,
      composite_fitness
    FROM turn_memories
    WHERE 
      1 - (embedding <=> ${embedding}) > 0.75  -- High similarity
      AND composite_fitness > 0.7              -- Quality threshold
      AND successful_queries IS NOT NULL       -- Has examples
    ORDER BY 
      similarity DESC,
      composite_fitness DESC
    LIMIT 5
  `;
}
```

## Fine-tuning Pipeline

### Stage 1: Dataset Curation

```typescript
class DatasetCurator {
  async createFinetuningDataset() {
    // Extract gold-standard patterns
    const goldPatterns = await sql`
      SELECT 
        normalized_intent as instruction,
        role as context,
        tool_sequence,
        successful_queries,
        composite_fitness
      FROM turn_memories
      WHERE 
        composite_fitness > 0.85
        AND successful_queries::text != '[]'
        AND NOT is_synthetic  -- Prefer real user patterns when available
      ORDER BY composite_fitness DESC
      LIMIT 10000
    `;
    
    // Format for DeepSeek fine-tuning
    return goldPatterns.map(pattern => ({
      messages: [
        {
          role: "system",
          content: "You are OmniZen ERP assistant with database access."
        },
        {
          role: "user",
          content: pattern.instruction
        },
        {
          role: "assistant",
          content: this.formatIdealResponse(pattern)
        }
      ]
    }));
  }
  
  formatIdealResponse(pattern: Pattern): string {
    return `<process>
Intent: ${pattern.normalized_intent}
Tools needed: ${pattern.tool_sequence.join(', ')}
</process>

I'll help you with that.

${pattern.tool_sequence.map((tool, i) => {
  if (tool === 'dbRead' && pattern.successful_queries[i]) {
    return `[Tool: dbRead]\n${pattern.successful_queries[i].sql}\n\n${pattern.successful_queries[i].result_summary}`;
  }
  return `[Tool: ${tool}]\n${this.getToolOutput(tool)}`;
}).join('\n\n')}`;
  }
}
```

### Stage 2: Progressive Fine-tuning

```python
# fine_tune_pipeline.py
import json
from pathlib import Path

class ProgressiveFineTuner:
    def __init__(self, base_model="deepseek-chat"):
        self.base_model = base_model
        
    def prepare_datasets(self):
        """Create staged datasets of increasing size and complexity"""
        
        # Stage 1: Core patterns (1K examples)
        core_patterns = self.select_patterns(
            fitness_threshold=0.9,
            limit=1000,
            categories=['basic_queries', 'simple_operations']
        )
        
        # Stage 2: Extended patterns (5K examples)
        extended_patterns = self.select_patterns(
            fitness_threshold=0.85,
            limit=5000,
            categories=['all']
        )
        
        # Stage 3: Comprehensive (20K examples)
        comprehensive = self.select_patterns(
            fitness_threshold=0.75,
            limit=20000,
            categories=['all'],
            include_variations=True
        )
        
        return {
            'core': core_patterns,
            'extended': extended_patterns,
            'comprehensive': comprehensive
        }
    
    def train_progressive(self):
        """Three-stage fine-tuning for optimal results"""
        
        datasets = self.prepare_datasets()
        
        # Stage 1: Learn core patterns deeply
        model_v1 = self.fine_tune(
            base_model=self.base_model,
            dataset=datasets['core'],
            epochs=5,
            learning_rate=1e-5
        )
        
        # Stage 2: Expand knowledge
        model_v2 = self.fine_tune(
            base_model=model_v1,
            dataset=datasets['extended'],
            epochs=3,
            learning_rate=5e-6
        )
        
        # Stage 3: Polish and generalize
        model_final = self.fine_tune(
            base_model=model_v2,
            dataset=datasets['comprehensive'],
            epochs=1,
            learning_rate=1e-6
        )
        
        return model_final
```

### Stage 3: Evaluation & Deployment

```typescript
class ModelEvaluator {
  async evaluate(baseModel: Model, fineTunedModel: Model) {
    const testCases = await this.getTestCases();
    
    const results = {
      base: { accuracy: 0, speed: 0, tokens: 0 },
      fineTuned: { accuracy: 0, speed: 0, tokens: 0 }
    };
    
    for (const test of testCases) {
      // Test base model with context injection
      const baseResult = await this.testWithContext(baseModel, test);
      results.base.accuracy += baseResult.correct ? 1 : 0;
      results.base.speed += baseResult.time;
      results.base.tokens += baseResult.tokens;
      
      // Test fine-tuned model without context
      const ftResult = await this.testDirect(fineTunedModel, test);
      results.fineTuned.accuracy += ftResult.correct ? 1 : 0;
      results.fineTuned.speed += ftResult.time;
      results.fineTuned.tokens += ftResult.tokens;
    }
    
    return {
      accuracyImprovement: (results.fineTuned.accuracy / results.base.accuracy - 1) * 100,
      speedImprovement: (results.base.speed / results.fineTuned.speed - 1) * 100,
      tokenReduction: (1 - results.fineTuned.tokens / results.base.tokens) * 100
    };
  }
}
```

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
```typescript
// 1. Add minimal tool set
const tools = {
  dbRead: safeReadTool(),
  dbWrite: safeWriteTool(),
  schemaInfo: schemaInfoTool(),
  viewsList: viewsListTool(),
  todoList: todoListTool()
};

// 2. Create pattern storage
await createTurnMemoriesTable();

// 3. Add pattern capture to existing system
onFinish: async (result) => {
  await capturePattern(result);
};
```

### Phase 2: Competition (Week 3-4)
```typescript
// 1. Implement competition framework
const trainer = new CompetitiveTrainer({
  instances: 5,
  challenges: ERPChallenges,
  iterations: 100
});

// 2. Run initial competitions
await trainer.runTournament();

// 3. Analyze patterns
const patterns = await analyzeCompetitionResults();
```

### Phase 3: Context Injection (Week 5-6)
```typescript
// 1. Implement pattern retrieval
const patternService = new PatternService();

// 2. Enhance system prompt
const enrichedPrompt = basePrompt + patternService.format(patterns);

// 3. Deploy with context injection
const enhancedOmni = new OmniWithPatterns(patternService);
```

### Phase 4: Dataset Curation (Week 7-8)
```typescript
// 1. Curate training data
const curator = new DatasetCurator();
const dataset = await curator.createFinetuningDataset();

// 2. Validate quality
await validateDataset(dataset);

// 3. Export for fine-tuning
await exportToJSONL(dataset, 'training_data.jsonl');
```

### Phase 5: Fine-tuning (Week 9-10)
```python
# 1. Fine-tune DeepSeek
trainer = ProgressiveFineTuner()
model = trainer.train_progressive()

# 2. Evaluate improvements
evaluator = ModelEvaluator()
results = evaluator.compare_models()

# 3. Deploy if successful
if results['accuracy_improvement'] > 20:
    deploy_model(model)
```

### Phase 6: Production (Week 11+)
```typescript
// Before: Context injection required
const response = await omni.process(query, patterns);  // ~700 tokens

// After: Direct execution
const response = await omniFineTuned.process(query);   // ~200 tokens

// 70% token reduction, 3x faster response
```

## Expected Outcomes

### Quantitative Metrics

| Metric | Baseline | With Patterns | Fine-tuned | Improvement |
|--------|----------|---------------|------------|-------------|
| Accuracy | 60% | 85% | 92% | +53% |
| Token Usage | 1000 | 700 | 200 | -80% |
| Response Time | 3s | 2s | 0.8s | -73% |
| Query Success Rate | 70% | 90% | 95% | +36% |
| Cost per Request | $0.01 | $0.007 | $0.002 | -80% |

### Qualitative Benefits

1. **Emergent Intelligence**: System discovers optimal patterns through competition
2. **No Orchestration Overhead**: Patterns provide implicit routing
3. **Continuous Improvement**: Every interaction improves the system
4. **Domain Expertise**: Model becomes ERP-specialized
5. **Maintainability**: Simple architecture, complex behavior

### Learning Acceleration

```
Traditional: 1 instance × 1000 attempts = 1,000 patterns
Competitive: 5 instances × 1000 attempts = 5,000 patterns
            + Cross-pollination
            + Failure mining
            + Strategy diversity
            = 10x effective learning rate
```

## Key Insights & Principles

### 1. Simplicity Over Complexity
- **No sub-agents**: Flat architecture with tools
- **No explicit routing**: Patterns provide guidance
- **No orchestration layer**: Emergent from learned patterns

### 2. Competition Drives Evolution
- Multiple strategies discover diverse solutions
- Failed attempts still contribute valuable queries
- Natural selection ensures quality

### 3. Progressive Intelligence
```
Stage 1: Generic model + Tools
Stage 2: + Learned patterns (context injection)
Stage 3: + Fine-tuning (embedded intelligence)
```

### 4. Universal Before Personal
- Learn role-based patterns (CFO, Accountant)
- Avoid user/org-specific training initially
- Add personalization only with real data

### 5. Quality Through Filtering
- Never store failed queries
- Composite scoring weighs query quality heavily
- Natural selection removes poor patterns

## Theoretical Foundation

This approach combines several established principles:

1. **Evolutionary Computation**: Competition and natural selection
2. **Few-shot Learning**: Pattern injection as examples
3. **Transfer Learning**: Fine-tuning for domain specialization
4. **Emergent Behavior**: Complex orchestration from simple rules

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Overfitting to synthetic data | Include real user patterns ASAP |
| Query quality degradation | Strict filtering, never store failures |
| Model drift after fine-tuning | Continuous evaluation, rollback capability |
| Competition local optima | Diversity through strategy variations |

## Conclusion

By combining competitive learning, pattern extraction, and fine-tuning, we create a system that:

1. **Learns without explicit programming** through competition
2. **Improves continuously** through pattern accumulation
3. **Becomes natively intelligent** through fine-tuning
4. **Maintains simplicity** despite complex behavior

The key insight: **Orchestration is not architecture, it's learned behavior.**

This approach transforms OmniZen from a rule-based system to an adaptive intelligence that understands ERP operations at a fundamental level, ultimately embedding this knowledge directly into the model weights for maximum efficiency and accuracy.

## Appendix A: Tool Definitions

```typescript
const tools = {
  dbRead: {
    description: "Execute SELECT queries with RLS",
    parameters: { sql: 'string' },
    safety: 'read-only'
  },
  
  dbWrite: {
    description: "Execute INSERT/UPDATE/DELETE with validation",
    parameters: { sql: 'string', confirm: 'boolean' },
    safety: 'validated, audited'
  },
  
  schemaInfo: {
    description: "Get relevant table schemas",
    parameters: { tables?: 'string[]', intent?: 'string' },
    returns: 'schema with relationships'
  },
  
  viewsList: {
    description: "List semantic views",
    parameters: { domain?: 'string' },
    returns: 'available optimized views'
  },
  
  todoList: {
    description: "Manage multi-step tasks",
    parameters: { action: 'string', items?: 'string[]' },
    useCase: 'complex workflows'
  }
};
```

## Appendix B: Sample Training Data

```jsonl
{"messages": [{"role": "system", "content": "You are OmniZen ERP assistant."}, {"role": "user", "content": "Show revenue this month"}, {"role": "assistant", "content": "<process>\nIntent: Retrieve current period revenue\nTools: dbRead, format\n</process>\n\nI'll get this month's revenue.\n\n[Tool: dbRead]\nSELECT SUM(amount) as revenue FROM invoices WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE) AND org_id = $1\n\nRevenue this month: $45,230"}]}

{"messages": [{"role": "system", "content": "You are OmniZen ERP assistant."}, {"role": "user", "content": "Compare to last month"}, {"role": "assistant", "content": "<process>\nIntent: Period over period comparison\nTools: dbRead (x2), calculate\n</process>\n\nI'll compare this month's revenue to last month.\n\n[Tool: dbRead]\nSELECT date_trunc('month', created_at) as month, SUM(amount) as revenue FROM invoices WHERE created_at >= date_trunc('month', CURRENT_DATE - interval '1 month') AND org_id = $1 GROUP BY 1\n\nRevenue comparison:\n- Last month: $42,100\n- This month: $45,230\n- Change: +$3,130 (+7.4%)"}]}
```

## Appendix C: Evaluation Metrics

```typescript
interface EvaluationMetrics {
  // Accuracy Metrics
  task_completion_rate: number;  // % of tasks completed successfully
  query_success_rate: number;    // % of SQL queries that execute
  result_accuracy: number;        // % of correct results
  
  // Efficiency Metrics
  steps_to_completion: number;    // Average steps per task
  token_usage: number;            // Average tokens per request
  response_time_ms: number;       // Average response time
  
  // Quality Metrics
  query_optimization: number;     // Query efficiency score
  pattern_reuse: number;         // % of executions using learned patterns
  user_satisfaction: number;      // Simulated or real feedback
  
  // Learning Metrics
  pattern_discovery_rate: number; // New patterns per 100 attempts
  fitness_improvement: number;    // Average fitness over time
  convergence_speed: number;      // Iterations to stable performance
}
```

---

*Last Updated: [Current Date]*
*Status: Research & Development Phase*
*Next Review: After Phase 2 Competition Results*