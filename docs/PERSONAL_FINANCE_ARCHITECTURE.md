# Personal Finance Architecture

## Overview
The personal finance system leverages the existing multi-tenant ERP infrastructure with a clever organizational structure:

## Architecture Design

### 1. Meta-Organization Structure
```
OmniZen (Organization)
├── organization_type: 'personal'
├── is_personal_finance: true
├── plan_tier: 'family' (or 'personal-free', 'personal-plus', 'personal-pro')
└── Workspaces
    ├── John Doe Personal (workspace_type: 'personal')
    ├── Jane Smith Personal (workspace_type: 'personal')
    └── Smith Family (workspace_type: 'family')
```

### 2. Data Isolation Levels

#### Organization Level (OmniZen)
- **Shared Data**: Personal categories, tax settings
- **Purpose**: Common configuration across all users
- **Access**: Read-only for most users

#### Workspace Level (Individual Users)
- **Isolated Data**: 
  - Financial goals
  - Budget rules
  - Investment holdings
  - Personal subscriptions
  - Bank transactions
- **Purpose**: Complete privacy between users
- **Access**: Full control within own workspace

### 3. Key Design Decisions

#### Why `organization_type`?
- **Business**: Traditional B2B ERP customers (e.g., "Anchorblock Technology")
- **Personal**: B2C personal finance platform (e.g., "OmniZen")
- **Hybrid**: Organizations offering both services

#### Why Single OmniZen Organization?
1. **Simplified Management**: One organization to manage all personal users
2. **Shared Resources**: Common categories, templates, and settings
3. **Efficient Scaling**: Add users as workspaces, not organizations
4. **Cost Optimization**: Single organization = lower infrastructure overhead

### 4. RLS (Row Level Security) Implementation

All tables use workspace-level isolation:
```sql
-- Example RLS policy for financial_goals
CREATE POLICY workspace_isolation ON financial_goals
  FOR ALL 
  USING (workspace_id = auth_workspace_id());
```

### 5. User Journey

1. **Signup**: User signs up for personal finance
2. **Workspace Creation**: System creates workspace under OmniZen
3. **Data Access**: User only sees their workspace data
4. **Shared Resources**: Can use OmniZen's categories and templates

### 6. Multi-User Scenarios

#### Individual User
```sql
-- John Doe's workspace
workspace_id = '2e5b5ae6-5993-4cd1-bfdf-2dc8ed484686'
workspace_type = 'personal'
```

#### Family Account
```sql
-- Smith Family workspace (shared by multiple family members)
workspace_id = '3bd22c88-9cb8-4cb5-9562-045135ad018a'
workspace_type = 'family'
```

### 7. Advantages

1. **Reuses Existing Infrastructure**: No separate database or schema
2. **Maintains Security**: RLS ensures complete isolation
3. **Scalable**: Can handle millions of users as workspaces
4. **Flexible**: Supports individual, couple, and family accounts
5. **Unified Platform**: Same codebase for B2B and B2C

### 8. Implementation Details

#### Database Tables
- All personal finance tables include both `organization_id` and `workspace_id`
- `organization_id` always points to OmniZen
- `workspace_id` provides the actual isolation

#### Semantic Views
- Views respect RLS through `auth_workspace_id()` function
- Aggregate data only from user's workspace
- No cross-workspace data leakage

### 9. Example Queries

```sql
-- Get all goals for current user (RLS enforced)
SELECT * FROM financial_goals 
WHERE workspace_id = auth_workspace_id();

-- Admin view (all workspaces)
SELECT 
    w.name as user_workspace,
    COUNT(fg.id) as total_goals,
    SUM(fg.target_amount) as total_target
FROM workspaces w
LEFT JOIN financial_goals fg ON fg.workspace_id = w.id
WHERE w.organization_id = '82609731-f11a-4c01-9749-a6fab5f5639b' -- OmniZen
GROUP BY w.id, w.name;
```

## Summary

The `organization_type = 'personal'` identifies OmniZen as a personal finance platform, while actual user isolation happens at the workspace level. This design elegantly reuses the enterprise multi-tenant architecture for B2C personal finance without any structural changes.