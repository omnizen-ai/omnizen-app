# Progressive Task Curriculum for Competitive Learning

## Overview

Tasks are designed to progressively build capabilities, starting from atomic operations and advancing to complex enterprise workflows. Each level builds upon previous learnings, creating a natural curriculum for the AI system.

## Task Progression Structure

```
Level 1: Atomic Reads (Single table, simple queries)
    ↓
Level 2: Joins & Relationships (Multi-table queries)
    ↓
Level 3: Calculations & Aggregations (Business metrics)
    ↓
Level 4: Comparative Analysis (Time-based, dimensional)
    ↓
Level 5: Data Mutations (CRUD operations)
    ↓
Level 6: Transactions & Validations (Multi-step writes)
    ↓
Level 7: Reports & Dashboards (Complex reads with formatting)
    ↓
Level 8: Workflows (Multi-step business processes)
    ↓
Level 9: Automation (Triggered actions, bulk operations)
    ↓
Level 10: Enterprise Orchestration (Full business cycles)
```

## Detailed Task Curriculum

### Level 1: Atomic Reads (Days 1-3)
**Goal**: Master basic data retrieval

```typescript
const level1Tasks = [
  // 1.1 Single table queries
  "Show all customers",
  "List products",
  "Get invoices",
  
  // 1.2 Filtered queries
  "Show active customers",
  "Find products under $100",
  "Get unpaid invoices",
  
  // 1.3 Specific lookups
  "Find customer John Doe",
  "Get invoice #1234",
  "Show product SKU-789",
  
  // 1.4 Count operations
  "How many customers do we have?",
  "Count unpaid invoices",
  "Total number of products"
];

// Expected patterns to learn:
// - Basic SELECT statements
// - WHERE clauses
// - COUNT operations
// - RLS awareness (org_id filtering)
```

### Level 2: Joins & Relationships (Days 4-6)
**Goal**: Understand data relationships

```typescript
const level2Tasks = [
  // 2.1 Simple joins
  "Show invoices with customer names",
  "List products with their categories",
  "Get orders with customer details",
  
  // 2.2 Nested relationships
  "Show invoice line items with product names",
  "Get customer orders with all products",
  "List employees with their departments",
  
  // 2.3 Optional relationships
  "Show customers with or without orders",
  "Products with and without inventory",
  "Invoices with partial payments"
];

// Expected patterns to learn:
// - INNER JOIN vs LEFT JOIN
// - Multiple join conditions
// - Handling NULL values
```

### Level 3: Calculations & Aggregations (Days 7-9)
**Goal**: Compute business metrics

```typescript
const level3Tasks = [
  // 3.1 Sum operations
  "Calculate total revenue",
  "Sum of unpaid invoices",
  "Total inventory value",
  
  // 3.2 Averages and statistics
  "Average order value",
  "Mean customer lifetime value",
  "Median invoice amount",
  
  // 3.3 Group by operations
  "Revenue by customer",
  "Sales by product category",
  "Expenses by department",
  
  // 3.4 Complex calculations
  "Calculate gross margin",
  "Compute tax totals",
  "Determine commission amounts"
];

// Expected patterns to learn:
// - Aggregate functions (SUM, AVG, COUNT)
// - GROUP BY clauses
// - HAVING conditions
// - Calculated fields
```

### Level 4: Comparative Analysis (Days 10-12)
**Goal**: Time-based and dimensional comparisons

```typescript
const level4Tasks = [
  // 4.1 Period comparisons
  "Compare this month to last month revenue",
  "Year-over-year growth",
  "Week-over-week sales trend",
  
  // 4.2 Ranking operations
  "Top 10 customers by revenue",
  "Bottom performing products",
  "Best selling items this month",
  
  // 4.3 Variance analysis
  "Budget vs actual expenses",
  "Forecast vs real sales",
  "Target vs achievement by salesperson",
  
  // 4.4 Cohort analysis
  "Customer retention by signup month",
  "Revenue by customer segment",
  "Product performance by region"
];

// Expected patterns to learn:
// - Window functions
// - CTEs (Common Table Expressions)
// - Date arithmetic
// - RANK() and ROW_NUMBER()
```

### Level 5: Data Mutations (Days 13-15)
**Goal**: Safe data modifications

```typescript
const level5Tasks = [
  // 5.1 Single inserts
  "Add customer Jane Smith",
  "Create new product",
  "Add invoice for customer #123",
  
  // 5.2 Updates
  "Update customer email",
  "Change product price",
  "Mark invoice as paid",
  
  // 5.3 Conditional updates
  "Increase prices by 10% for category electronics",
  "Mark overdue invoices",
  "Update customer status based on payment history",
  
  // 5.4 Soft deletes
  "Archive old customers",
  "Deactivate discontinued products",
  "Cancel draft invoices"
];

// Expected patterns to learn:
// - INSERT with RETURNING
// - UPDATE with WHERE
// - Validation before mutation
// - Audit trail awareness
```

### Level 6: Transactions & Validations (Days 16-18)
**Goal**: Multi-step operations with consistency

```typescript
const level6Tasks = [
  // 6.1 Multi-table inserts
  "Create invoice with line items",
  "Add order with products",
  "Register customer with initial purchase",
  
  // 6.2 Dependent updates
  "Transfer inventory between warehouses",
  "Apply payment to multiple invoices",
  "Adjust credit across accounts",
  
  // 6.3 Validations
  "Check inventory before order",
  "Verify credit limit before invoice",
  "Validate tax calculation",
  
  // 6.4 Rollback scenarios
  "Reverse payment if failed",
  "Undo inventory movement if invalid",
  "Cancel order if insufficient stock"
];

// Expected patterns to learn:
// - Transaction blocks
// - Validation queries before mutations
// - Dependent operations
// - Error handling
```

### Level 7: Reports & Dashboards (Days 19-21)
**Goal**: Complex data presentation

```typescript
const level7Tasks = [
  // 7.1 Financial reports
  "Generate P&L statement",
  "Create balance sheet",
  "Produce cash flow report",
  
  // 7.2 Operational dashboards
  "Sales dashboard with KPIs",
  "Inventory status report",
  "Customer analytics summary",
  
  // 7.3 Formatted outputs
  "Monthly report with charts",
  "Executive summary with highlights",
  "Department performance scorecard",
  
  // 7.4 Drill-down reports
  "Revenue breakdown by product, region, and time",
  "Expense analysis with variance explanations",
  "Customer segmentation with behavior patterns"
];

// Expected patterns to learn:
// - Complex multi-query sequences
// - Data formatting
// - Using semantic views
// - Result aggregation and presentation
```

### Level 8: Business Workflows (Days 22-24)
**Goal**: End-to-end business processes

```typescript
const level8Tasks = [
  // 8.1 Order fulfillment
  "Process complete order from quote to delivery",
  "Handle return and refund workflow",
  "Manage backorder fulfillment",
  
  // 8.2 Financial workflows
  "Process month-end close",
  "Perform bank reconciliation",
  "Execute payment run for vendors",
  
  // 8.3 Inventory workflows
  "Run inventory replenishment cycle",
  "Process stock take adjustments",
  "Execute inter-warehouse transfers",
  
  // 8.4 Customer workflows
  "Onboard new enterprise customer",
  "Process credit application",
  "Handle contract renewal"
];

// Expected patterns to learn:
// - Multi-step processes
// - Conditional branching
// - State management
// - Checkpoint validation
```

### Level 9: Automation & Bulk Operations (Days 25-27)
**Goal**: Efficient mass operations

```typescript
const level9Tasks = [
  // 9.1 Bulk updates
  "Apply 10% discount to all customers in segment A",
  "Update pricing for entire product category",
  "Batch process 100 invoices",
  
  // 9.2 Scheduled operations
  "Generate weekly reports for all departments",
  "Send monthly statements to all customers",
  "Process recurring invoices",
  
  // 9.3 Triggered actions
  "Alert when inventory below threshold",
  "Auto-create purchase orders for low stock",
  "Send payment reminders for overdue invoices",
  
  // 9.4 Data cleanup
  "Archive records older than 2 years",
  "Merge duplicate customer records",
  "Standardize data formats across system"
];

// Expected patterns to learn:
// - Batch operations
// - Performance optimization
// - Async processing awareness
// - Data integrity maintenance
```

### Level 10: Enterprise Orchestration (Days 28-30)
**Goal**: Complex multi-department scenarios

```typescript
const level10Tasks = [
  // 10.1 Cross-functional processes
  "Coordinate product launch across sales, marketing, and inventory",
  "Manage merger integration with data consolidation",
  "Execute company-wide pricing strategy change",
  
  // 10.2 Compliance and audit
  "Generate quarterly compliance report package",
  "Perform full financial audit trail",
  "Execute SOX compliance checks",
  
  // 10.3 Strategic operations
  "Analyze and optimize supply chain",
  "Restructure chart of accounts",
  "Implement new revenue recognition rules",
  
  // 10.4 Crisis management
  "Handle mass product recall",
  "Process emergency vendor payments",
  "Execute disaster recovery procedures"
];

// Expected patterns to learn:
// - Cross-system coordination
// - Complex state machines
// - Rollback strategies
// - Business rule engines
```

## Competition Scoring by Level

```typescript
interface LevelScoringWeights {
  level1_3: {  // Basic operations
    completion: 50,    // Focus on getting it done
    accuracy: 30,      // Correct results
    efficiency: 20     // Speed matters less
  },
  
  level4_6: {  // Intermediate operations
    completion: 40,
    accuracy: 35,      // Accuracy more important
    efficiency: 25     // Starting to optimize
  },
  
  level7_8: {  // Complex operations
    completion: 35,
    accuracy: 40,      // Must be correct
    efficiency: 25,
    elegance: 10       // Bonus for clean solutions
  },
  
  level9_10: {  // Enterprise operations
    completion: 30,
    accuracy: 40,
    efficiency: 20,
    elegance: 10,
    scalability: 10    // Must handle large data
  }
}
```

## Learning Expectations

### Week 1 (Levels 1-3)
- **Focus**: Basic operations mastery
- **Patterns**: 100+ basic query patterns
- **Success Rate**: 90%+ on simple queries

### Week 2 (Levels 4-6)
- **Focus**: Business logic understanding
- **Patterns**: 200+ complex patterns
- **Success Rate**: 80%+ on calculations

### Week 3 (Levels 7-8)
- **Focus**: Workflow orchestration
- **Patterns**: 150+ workflow patterns
- **Success Rate**: 75%+ on multi-step

### Week 4 (Levels 9-10)
- **Focus**: Enterprise capabilities
- **Patterns**: 100+ advanced patterns
- **Success Rate**: 70%+ on complex scenarios

## Pattern Evolution Example

```typescript
// Day 1: Level 1 - Simple query
"Show customers"
→ Pattern: SELECT * FROM customers WHERE org_id = $1

// Day 7: Level 3 - Aggregation
"Revenue by customer"
→ Pattern: SELECT c.name, SUM(i.amount) FROM customers c 
           JOIN invoices i ON c.id = i.customer_id 
           GROUP BY c.id

// Day 15: Level 5 - Mutation
"Create invoice for customer"
→ Pattern: INSERT INTO invoices (customer_id, amount, org_id) 
           VALUES ($1, $2, $3) RETURNING *

// Day 22: Level 8 - Workflow
"Process month-end close"
→ Pattern: [reconcile_accounts(), adjust_accruals(), 
           generate_reports(), lock_period()]

// Day 30: Level 10 - Enterprise
"Implement pricing strategy"
→ Pattern: Complex 50+ step workflow with validations, 
           rollback points, and cross-system coordination
```

## Success Metrics

```typescript
interface ProgressionMetrics {
  // Capability growth
  patterns_learned: {
    day_1: 10,
    day_7: 150,
    day_14: 400,
    day_21: 700,
    day_30: 1000
  },
  
  // Complexity handling
  max_query_complexity: {
    day_1: 'single_table',
    day_7: 'multi_join_aggregate',
    day_14: 'cte_window_functions',
    day_21: 'multi_statement_transaction',
    day_30: 'full_workflow_orchestration'
  },
  
  // Performance improvement
  success_rate_by_level: {
    level_1: 95,  // Should master basics
    level_5: 85,  // Good at CRUD
    level_8: 75,  // Decent at workflows
    level_10: 65  // Reasonable at enterprise
  }
}
```

## Key Design Principles

1. **Progressive Difficulty**: Each level builds on previous knowledge
2. **Real-World Alignment**: Tasks mirror actual business operations
3. **Error Recovery**: Higher levels include failure handling
4. **Performance Scaling**: Later tasks require optimization
5. **Business Logic**: Advanced levels embed domain knowledge

## Competition Advantages

By using progressive difficulty:
- **Faster Learning**: Simple patterns learned quickly, provide foundation
- **Better Generalization**: Gradual complexity prevents overfitting
- **Natural Curriculum**: Mimics human learning progression
- **Quality Patterns**: Early success builds confident patterns
- **Robust Failures**: Advanced tasks fail gracefully with partial success

## Implementation Notes

```typescript
class ProgressiveCompetition {
  async runCurriculum() {
    const levels = this.getProgressiveTasks();
    
    for (const level of levels) {
      console.log(`Starting Level ${level.number}: ${level.description}`);
      
      // Run easier tasks more times for solid foundation
      const iterations = level.number <= 3 ? 100 : 50;
      
      for (let i = 0; i < iterations; i++) {
        const task = this.selectTask(level);
        const results = await this.runCompetition(task);
        
        // Require higher success rate for basic tasks
        const requiredSuccess = level.number <= 3 ? 0.9 : 0.7;
        
        if (this.getSuccessRate(results) < requiredSuccess) {
          // Repeat level if not meeting threshold
          console.log(`Repeating level ${level.number}`);
          i--;
        }
      }
      
      // Graduate to next level
      await this.consolidatePatterns(level);
    }
  }
}
```

## Expected Outcome

After 30 days of progressive training:

1. **1000+ learned patterns** from simple to complex
2. **95% success on basic queries** (Level 1-3)
3. **75% success on workflows** (Level 7-8)
4. **Handling enterprise scenarios** (Level 10)
5. **Ready for fine-tuning** with comprehensive dataset

The progressive curriculum ensures that when real users arrive, the system can handle everything from "Show me my invoices" to "Execute quarterly financial close with SOX compliance."