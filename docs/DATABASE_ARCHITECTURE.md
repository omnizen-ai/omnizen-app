# Database Architecture - OmniZen AI Agent SaaS Platform

## Overview

This document describes the integrated enterprise-grade database architecture for the OmniZen platform, combining AI agent capabilities with comprehensive ERP functionality.

## Architecture Highlights

- **Multi-tenant**: Complete organizational isolation with RLS
- **Scalable**: From small businesses to large enterprises
- **AI-First**: Semantic views optimized for LLM queries
- **Dual Authentication**: NextAuth for UI, Supabase for API/RLS
- **Progressive Enhancement**: Features unlock based on plan tier

## Database Structure

### Schema Organization

```
public/         - Legacy tables (chat, documents)
core/           - Organizations, users, authentication
finance/        - ERP tables (accounts, invoices, bills)
ai/             - AI agents and execution tracking
semantic/       - LLM-optimized views for safe querying
```

### Core Schema

#### Organizations
- Multi-tenant foundation
- Plan tiers: starter, professional, enterprise, custom
- Feature flags for progressive enhancement
- Workspace support for enterprise segregation

#### Users & Authentication
- Compatible with NextAuth
- Organization memberships with roles
- Audit logging for compliance
- Session management

### Finance Schema

#### Double-Entry Bookkeeping
- Chart of accounts with hierarchy
- Journal entries with balanced debits/credits
- Multi-currency support with FX rates
- Tax codes and calculations

#### Accounts Receivable (AR)
- Customer invoices
- Payment tracking
- Aging reports
- Revenue recognition

#### Accounts Payable (AP)
- Vendor bills
- Approval workflows
- Payment processing
- Expense tracking

### AI Schema

#### AI Agents
- Multiple agent types (assistant, accountant, analyst, etc.)
- LLM model configuration
- Capabilities and permissions
- Tool access control

#### Execution Tracking
- Complete execution history
- Token usage and costs
- Performance metrics
- Error tracking

#### Knowledge Base
- Document storage for RAG
- Vector embeddings
- Version control
- Access control

## Authentication Strategy

### Dual-Auth Pattern

1. **NextAuth** - Frontend authentication
   - Social logins
   - Session management
   - User experience

2. **Supabase Auth** - Backend authentication
   - RLS policies
   - API access
   - Service-to-service

### Auth Bridge

The `AuthBridge` service synchronizes NextAuth sessions with Supabase:

```typescript
// Example usage
const authBridge = AuthBridge.getInstance();
const supabaseClient = await authBridge.createAuthenticatedClient(session);
```

## Row-Level Security (RLS)

All tables have RLS enabled with policies based on:
- Organization ID
- User role
- Workspace access
- Feature flags

### RLS Helper Functions

```sql
auth_org_id()        -- Current organization
auth_user_id()       -- Current user
auth_workspace_id()  -- Current workspace
auth_role()          -- User role
```

## Semantic Layer

LLM-optimized views for safe querying:

- `semantic.v_gl_fact` - Flattened GL data
- `semantic.v_ar_open` - Open receivables
- `semantic.v_ap_open` - Open payables
- `semantic.v_revenue_by_customer` - Revenue analytics
- `semantic.v_cash_flow` - Cash flow summary
- `semantic.v_agent_metrics` - AI agent performance

## Progressive Feature Activation

Features activate based on organization plan:

### Starter Plan
- Basic invoicing
- Simple accounting
- 2 AI agents
- 5 users max

### Professional Plan
- Full accounting
- Inventory management
- AI automation
- 10 AI agents
- 25 users max

### Enterprise Plan
- Multiple workspaces
- Custom workflows
- API access
- Unlimited AI agents
- White-label options

## Migration Strategy

### Phase 1: Foundation (Current)
✅ Schema structure created
✅ Auth bridge implemented
✅ RLS policies defined
✅ Semantic views created

### Phase 2: Data Migration
- Migrate existing chat/document data
- Import sample ERP data
- Configure AI agents

### Phase 3: Testing
- RLS policy validation
- Performance testing
- AI agent integration testing

### Phase 4: Production
- Deploy to Supabase
- Enable monitoring
- Configure backups

## Database Commands

### Generate Migrations
```bash
pnpm db:generate
```

### Run Migrations
```bash
pnpm db:migrate
```

### Open Drizzle Studio
```bash
pnpm db:studio
```

### Push to Database
```bash
pnpm db:push
```

## Environment Variables

Required environment variables:

```env
# Database
POSTGRES_URL=postgresql://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...

# NextAuth
NEXTAUTH_URL=http://localhost:3333
NEXTAUTH_SECRET=...
```

## Performance Considerations

### Indexes
- B-tree indexes on foreign keys
- GIN indexes on JSONB columns
- Partial indexes for filtered queries
- Composite indexes for common joins

### Partitioning
- Large tables partitioned by organization
- Time-series data partitioned by date
- Automatic partition management

### Caching
- Redis for hot data
- Materialized views for reports
- Query result caching

## Security Best Practices

1. **Never disable RLS** on production tables
2. **Use prepared statements** to prevent SQL injection
3. **Encrypt sensitive data** at rest
4. **Audit all data access** through audit_logs table
5. **Rotate credentials** regularly
6. **Use least privilege** principle for roles

## Monitoring & Observability

### Metrics to Track
- Query performance
- Token usage by AI agents
- Storage growth
- Active users per organization
- Feature usage by plan tier

### Alerts
- Failed journal entry balance
- High token usage
- RLS policy violations
- Authentication failures

## Backup & Recovery

### Backup Strategy
- Daily automated backups
- Point-in-time recovery (PITR)
- Cross-region replication
- Regular backup testing

### Disaster Recovery
- RPO: 1 hour
- RTO: 4 hours
- Automated failover
- Data validation procedures

## Support & Maintenance

### Regular Tasks
- Vacuum and analyze tables
- Update statistics
- Review slow query log
- Archive old data
- Update AI model configurations

### Health Checks
- Database connectivity
- RLS policy effectiveness
- AI agent availability
- Payment processing status

## API Integration

### REST API
- Supabase auto-generated APIs
- Custom Edge Functions
- Rate limiting per organization

### GraphQL
- Available for enterprise tier
- Custom resolvers
- Subscription support

### Webhooks
- Real-time events
- Retry logic
- Event filtering

## Compliance

### Data Privacy
- GDPR compliant
- Data residency options
- Right to erasure
- Data portability

### Financial Compliance
- Audit trails
- Immutable journal entries
- Tax reporting ready
- Multi-currency support

## Future Enhancements

### Planned Features
- Advanced inventory management
- Manufacturing module
- Project management
- HR/Payroll integration
- Advanced AI reasoning

### Technical Improvements
- Database sharding
- Read replicas
- Edge caching
- Vector search optimization

## Troubleshooting

### Common Issues

1. **RLS Policy Violations**
   - Check auth context is set
   - Verify organization membership
   - Review policy definitions

2. **Journal Entry Balance Errors**
   - Ensure debits equal credits
   - Check for rounding issues
   - Verify currency conversions

3. **AI Agent Failures**
   - Check token limits
   - Verify permissions
   - Review execution logs

## Contact

For questions or support regarding the database architecture:
- Technical Lead: [Your Email]
- Documentation: [This Document]
- Issue Tracker: GitHub Issues