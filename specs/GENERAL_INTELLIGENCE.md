# General Intelligence Orchestration

## Core Insight
LLMs (Sonnet, Opus) are input/output machines. But with general intelligence patterns, they become powerful agents that can manage entire organizations.

## General Intelligence Patterns (Not Specific Tools)

### Core Patterns Every Intelligent Agent Needs:
1. **Explore** - Try different approaches
2. **Verify** - Check if output is correct
3. **Iterate** - Refine based on feedback
4. **Understand Context** - Know the bigger picture
5. **Learn from Errors** - Trial and error to success

## Example: Intelligent SQL Agent

```typescript
// Not a "SQL tool" but an intelligent agent with SQL expertise
class IntelligentAgent {
  expertise: string; // "SQL Expert", "CFO", "Product Manager"
  
  async solve(request: string): Promise<Result> {
    // 1. UNDERSTAND - What's really being asked?
    const context = await this.understandContext(request);
    
    // 2. EXPLORE - Try initial approach
    let attempt = await this.generateApproach(context);
    
    // 3. VERIFY & ITERATE - Trial and error until correct
    while (!this.isCorrect(attempt)) {
      const error = this.diagnoseError(attempt);
      attempt = await this.refineApproach(attempt, error);
    }
    
    // 4. EXECUTE - Run the verified solution
    return await this.execute(attempt);
  }
}
```

## Real-World Example: Organization Management

### The Agents:
1. **SQL Expert Agent**
   - Writes complex queries through iteration
   - Verifies results make sense
   - Optimizes for performance

2. **CFO Agent** 
   - Uses SQL agent to get financial data
   - Makes financial decisions
   - Updates forecasts in database

3. **Product Manager Agent**
   - Uses SQL agent to get user metrics
   - Makes product decisions  
   - Updates roadmap in database

### The Intelligence Flow:
```
PM: "Why did user retention drop last month?"
    ↓
SQL Agent: 
  - Try query 1: SELECT * FROM users... (too broad)
  - Try query 2: SELECT cohort, retention... (missing data)
  - Try query 3: SELECT cohort, retention, feature_usage... (✓ correct)
  - Verify: Results show correlation with feature X removal
    ↓
PM Agent:
  - Understands: Feature X was critical for retention
  - Decision: Restore Feature X with improvements
  - Action: UPDATE roadmap SET priority='urgent' WHERE feature='X'
```

## Implementation: General Intelligence Layer

```typescript
// lib/omni/intelligence/core.ts
export class GeneralIntelligence {
  // Core intelligence patterns - same for ALL agents
  
  async explore(problem: Problem): Promise<Approach[]> {
    // Generate multiple approaches
  }
  
  async verify(result: any, expected: any): Promise<boolean> {
    // Check if result meets criteria
  }
  
  async iterate(current: Approach, feedback: Feedback): Promise<Approach> {
    // Refine based on what didn't work
  }
  
  async understandContext(request: string): Promise<Context> {
    // Extract true intent and constraints
  }
  
  async learnFromError(error: Error): Promise<Learning> {
    // Extract patterns from failures
  }
}

// lib/omni/agents/sql-expert.ts
export class SQLExpertAgent extends GeneralIntelligence {
  expertise = "Elite SQL and database optimization";
  
  async writeQuery(need: string): Promise<string> {
    // Use general intelligence to iterate until correct
    let query = this.generateInitialQuery(need);
    
    while (true) {
      const result = await this.testQuery(query);
      if (await this.verify(result, need)) break;
      
      // Learn from error and try again
      const learning = await this.learnFromError(result.error);
      query = await this.iterate(query, learning);
    }
    
    return query;
  }
}
```

## The Key Difference

### Not This (Specific Tools):
```typescript
// Rigid, limited
export const sqlTool = tool({
  description: 'Run SQL query',
  execute: ({ query }) => db.execute(query)
});
```

### But This (Intelligent Agent):
```typescript
// Flexible, intelligent
export class SQLAgent {
  async fulfillNeed(need: string) {
    // Figures out the query through intelligence
    // Tries multiple approaches
    // Verifies results make sense
    // Returns exactly what's needed
  }
}
```

## Why This Works

1. **Trial & Error = Real Intelligence**
   - Humans don't get things right first time
   - Iteration leads to correct solutions

2. **Verification = Trust**
   - Agent checks its own work
   - Self-corrects before returning results

3. **Context = Better Decisions**
   - Understands the "why" not just the "what"
   - Makes decisions like a human expert would

4. **General Patterns = Any Domain**
   - Same intelligence works for SQL, Finance, Product
   - Just change the expertise layer

## Next Steps

1. Build general intelligence patterns (explore, verify, iterate)
2. Create expertise layers (SQL, Finance, Product)
3. Let agents use trial & error to solve problems
4. Database as source of truth for decisions

This is TRUE intelligence - not pre-programmed responses, but agents that figure things out!