# Claude AI Assistant Instructions - OmniZen Project

## 🚨 Critical Information

### Migration System (IMPORTANT - Updated!)

We use a **dual migration system** with clear separation of concerns:

#### 1. Drizzle Migrations (TypeScript → Tables)
- **Location**: `/lib/db/migrations/`
- **Purpose**: Create/modify tables, columns, indexes from TypeScript schemas
- **Commands**:
  ```bash
  pnpm db:generate   # Generate migration from schema changes
  pnpm db:migrate    # Apply Drizzle migrations
  ```

#### 2. Supabase Migrations (SQL → RLS/Views)
- **Location**: `/supabase/migrations/`
- **Purpose**: RLS functions, policies, views, triggers
- **Commands**:
  ```bash
  pnpm supabase:migrate:local  # Apply Supabase migrations locally
  pnpm supabase:migrate:prod   # Apply to production
  ```

#### 3. Combined Commands
```bash
pnpm migrate:local     # Run both Drizzle + Supabase (complete setup)
pnpm db:reset:local    # Reset database and run all migrations
```

**⚠️ NEVER mix table creation in Supabase migrations or RLS in Drizzle migrations!**

## 📁 Database Structure

### Schema Organization
- **`public`**: All application tables (64 tables total)
- **`semantic`**: AI-optimized views (10 views)
- **`core`, `finance`, `ai`**: Logical organization (schemas exist but tables are in public)

### Key Table Groups

#### Core System (25 tables)
- Organizations & workspaces
- Users & authentication
- Sessions & audit logs

#### Financial Module (20 tables)
- Contacts, products, invoices, bills
- Payments, journals, chart of accounts
- Tax codes, exchange rates

#### Warehouse & Inventory (5 tables)
- Warehouses, inventory levels
- Stock moves, adjustments

#### Order Management (8 tables)
- Sales/purchase orders & lines
- Fulfillments, receipts

#### AI & Automation (12 tables)
- AI agents, executions, conversations
- Semantic catalog, query templates
- Agent permissions, guardrails

### TypeScript Schema Files
```
/lib/db/schema/
├── core/
│   ├── organizations.ts  # Organizations, workspaces, members
│   └── users.ts          # Users, sessions, auth
├── finance/
│   ├── transactions.ts   # Invoices, bills, payments
│   └── accounting.ts     # Journals, chart of accounts
├── ai/
│   ├── agents.ts         # AI agents, executions
│   └── erp-permissions.ts # Agent permissions, guardrails
├── erp/
│   ├── warehouses.ts     # Inventory management
│   ├── banking.ts        # Bank accounts, transactions
│   └── orders.ts         # Sales/purchase orders
└── semantic/
    └── catalog.ts        # Semantic metadata

```

## 🔐 Authentication Setup

### Dual Authentication System
1. **NextAuth**: Primary web authentication
2. **Supabase Auth Bridge**: RLS context synchronization

### Key Files
- `/app/(auth)/auth.ts` - NextAuth configuration
- `/lib/auth/auth-bridge.ts` - Bridge implementation
- `/middleware.ts` - Auth middleware

### RLS Functions
All tables use these helper functions:
- `auth_org_id()` - Current organization
- `auth_user_id()` - Current user
- `auth_workspace_id()` - Current workspace
- `auth_role()` - User role

### Verification
```bash
npx tsx scripts/verify-dual-auth.ts
```

## 🛠️ Development Workflow

### Adding New Tables
1. Create TypeScript schema in appropriate `/lib/db/schema/` file
2. Generate migration: `pnpm db:generate`
3. Apply migration: `pnpm db:migrate`
4. Add RLS policies in new Supabase migration if needed

### Adding Views or RLS
1. Create new file in `/supabase/migrations/`
2. Name format: `YYYYMMDDHHMMSS_description.sql`
3. Apply: `pnpm supabase:migrate:local`

### Testing Database Changes
```bash
# Reset everything and test from scratch
pnpm db:reset:local

# Verify all components
npx tsx scripts/verify-dual-auth.ts
```

## 🎯 Project Conventions

### Code Style
- TypeScript properties: `camelCase`
- Database columns: `snake_case`
- Drizzle ORM handles the conversion automatically

### File Naming
- TypeScript files: `kebab-case.ts`
- SQL migrations: `YYYYMMDDHHMMSS_snake_case.sql`
- React components: `PascalCase.tsx`

### Git Commits
- Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`
- Include emoji at end: 🤖 Generated with Claude Code

## 📊 Semantic Views

Located in `semantic` schema for AI agent consumption:

1. `v_balance_sheet` - Real-time balance sheet
2. `v_profit_loss_statement` - Income statement
3. `v_cash_flow_statement` - Cash flow analysis
4. `v_ar_aging_report` - Receivables aging
5. `v_ap_aging_report` - Payables aging
6. `v_customer_revenue` - Customer analysis
7. `v_inventory_status` - Stock overview
8. `v_order_pipeline` - Order tracking
9. `v_financial_ratios` - Key ratios
10. `v_kpi_dashboard` - Business KPIs

## 🔥 Common Commands

```bash
# Development
pnpm dev                   # Start dev server (port 3333)
pnpm db:studio            # Open Drizzle Studio
supabase studio           # Open Supabase Studio

# Database
pnpm db:generate          # Generate migration from schema
pnpm db:migrate           # Run Drizzle migrations
pnpm supabase:migrate:local # Run Supabase migrations
pnpm migrate:local        # Run both migrations
pnpm db:reset:local       # Reset database

# Testing
pnpm test                 # Run tests
npx tsx scripts/verify-dual-auth.ts  # Verify auth setup

# Linting & Formatting
pnpm lint                 # Run linter
pnpm format              # Format code
```

## 🚫 Things to Avoid

1. **NEVER** create tables in Supabase migrations (use Drizzle)
2. **NEVER** create RLS policies in Drizzle migrations (use Supabase)
3. **NEVER** use `npm` or `yarn` (always use `pnpm`)
4. **NEVER** commit secrets to git
5. **NEVER** bypass RLS without explicit user permission

## 📝 Test Credentials

### Langfuse
- Email: faruk@anchorblock.vc
- Password: 12345678

### Local Supabase
- Studio: http://localhost:54323
- API: http://localhost:54321
- Database: postgresql://postgres:postgres@localhost:54322/postgres

## 🆘 Troubleshooting

### Migration Issues
1. Check migration order in `/lib/db/migrations/meta/_journal.json`
2. Verify Supabase migrations ran: `supabase migration list`
3. Reset if needed: `pnpm db:reset:local`

### Auth Issues
1. Run verification: `npx tsx scripts/verify-dual-auth.ts`
2. Check RLS context: `SELECT auth_org_id(), auth_user_id();`
3. Verify env variables are set correctly

### Type Issues
1. Regenerate types: `pnpm db:types`
2. Check schema files in `/lib/db/schema/`
3. Ensure Drizzle config includes all schema files

## 📚 Important Links

- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [NextAuth.js Docs](https://next-auth.js.org)
- [Project README](./README.md)

---

**Remember**: When in doubt, check the migration system separation - Drizzle for tables, Supabase for RLS/views!