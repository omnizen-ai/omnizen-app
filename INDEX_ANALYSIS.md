# Index Analysis Report

## Budget Rules Indexes

### 1. `personal_budget_active_idx` (Drizzle)
- **Columns**: `(is_active)`
- **Purpose**: Fast filtering by active/inactive status only
- **Optimal for**: `WHERE is_active = true`
- **Example Query**: "Show all active budget rules across entire database"

### 2. `idx_budget_rules_active` (Supabase)
- **Columns**: `(organization_id, workspace_id, is_active)`
- **Purpose**: Composite index for RLS + status filtering
- **Optimal for**: `WHERE organization_id = ? AND workspace_id = ? AND is_active = true`
- **Example Query**: "Show active budget rules for current user's workspace"
- **Critical for RLS**: YES - This index is essential for Row Level Security performance

## Financial Goals Indexes

### 1. `idx_financial_goals_active` (Supabase)
- **Columns**: `(organization_id, workspace_id, status)`
- **Purpose**: Composite index for RLS + status filtering
- **Note**: Uses `status` column (enum), not `is_active` boolean
- **Optimal for**: `WHERE organization_id = ? AND workspace_id = ? AND status = 'active'`
- **Critical for RLS**: YES

### No Drizzle equivalent
- Drizzle creates `personal_goal_status_idx` on just `(status)`
- Different from the composite index

## Personal Subscriptions Indexes

### 1. `personal_sub_active_idx` (Drizzle)
- **Columns**: `(is_active)`
- **Purpose**: Fast filtering by active/inactive status only
- **Optimal for**: `WHERE is_active = true`

### 2. `idx_personal_subscriptions_active` (Supabase)
- **Columns**: `(organization_id, workspace_id, is_active)`
- **Purpose**: Composite index for RLS + status filtering
- **Optimal for**: `WHERE organization_id = ? AND workspace_id = ? AND is_active = true`
- **Critical for RLS**: YES

## Bank-Related Indexes (Supabase)

### 1. `idx_bank_transactions_org_account_date`
- **Columns**: `(organization_id, bank_account_id, transaction_date)`
- **Purpose**: Optimize time-based queries per account
- **Not in Drizzle**: Drizzle only has `(bank_account_id, transaction_date)`
- **Value**: Adds organization for better partition elimination

### 2. `idx_bank_transactions_category`
- **Columns**: `(category)` with `WHERE category IS NOT NULL`
- **Purpose**: Fast category-based aggregations
- **Partial Index**: Only indexes non-null categories (saves space)
- **Not in Drizzle**: Unique to Supabase migration

### 3. `idx_bank_accounts_org_workspace`
- **Columns**: `(organization_id, workspace_id)`
- **Purpose**: Fast workspace filtering for bank accounts
- **Not in Drizzle**: Critical for RLS performance

## Conclusion: NOT DUPLICATES!

These indexes serve **different query patterns**:

1. **Single-column indexes** (Drizzle): Optimize simple status filters
2. **Composite indexes** (Supabase): Optimize RLS queries with workspace isolation

### Why Both Are Needed:

```sql
-- Query 1: Benefits from personal_budget_active_idx
SELECT * FROM budget_rules WHERE is_active = true;

-- Query 2: Benefits from idx_budget_rules_active (composite)
SELECT * FROM budget_rules 
WHERE organization_id = auth_org_id() 
  AND workspace_id = auth_workspace_id() 
  AND is_active = true;
```

The composite index can't efficiently serve Query 1, and the single-column index can't efficiently serve Query 2.

## Performance Impact

Having both indexes:
- ✅ **Pros**: Optimal query performance for different access patterns
- ⚠️ **Cons**: Slight write overhead (minimal for low-write tables)
- ✅ **RLS Benefit**: Composite indexes are crucial for RLS performance

## Recommendation: KEEP ALL INDEXES

These are **complementary indexes**, not duplicates. They serve different query optimization needs:
- Drizzle indexes optimize application queries
- Supabase indexes optimize RLS and view queries

The slight storage overhead is worth the query performance benefits.