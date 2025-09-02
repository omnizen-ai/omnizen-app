# OmniZen - AI-Powered ERP Platform

An intelligent enterprise resource planning (ERP) platform that combines traditional business operations with AI agents for automated workflows, financial management, and semantic data access.

## 🚀 Features

### Core Capabilities
- **Dual Authentication**: Seamless integration of NextAuth and Supabase Auth with RLS
- **Multi-tenant Architecture**: Complete organization and workspace isolation
- **AI Agent Integration**: Built-in AI agents for business automation
- **Financial Management**: Comprehensive accounting, invoicing, and billing
- **Inventory & Warehouse**: Multi-location inventory tracking and management
- **Order Management**: Sales and purchase order processing with fulfillment tracking
- **Semantic Views**: AI-optimized data views for intelligent querying

### Technical Features
- **Type-safe Database**: Drizzle ORM with full TypeScript support
- **Row Level Security**: PostgreSQL RLS with dual auth support
- **Real-time Updates**: Supabase real-time subscriptions
- **AI Chat Interface**: Conversational interface for ERP operations
- **Document Management**: AI-powered document processing and storage

## 📋 Prerequisites

- Node.js 18+ 
- pnpm 9.12.3+
- PostgreSQL 17+ (via Supabase local or cloud)
- Supabase CLI

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/omnizen-app.git
cd omnizen-app
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Database
POSTGRES_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Supabase (for local development)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# NextAuth
AUTH_SECRET=your-auth-secret-min-32-chars

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

4. **Start Supabase locally**
```bash
supabase start
```

5. **Run database migrations**
```bash
# Complete setup (tables + RLS + views)
pnpm migrate:local

# Or run separately:
pnpm db:migrate        # Drizzle migrations (tables)
pnpm supabase:migrate:local  # Supabase migrations (RLS/views)
```

6. **Start the development server**
```bash
pnpm dev
```

Visit [http://localhost:3333](http://localhost:3333)

## 🗄️ Database Structure

### Schema Organization

The database is organized into logical schemas:

- **`public`**: Core application tables (default schema)
- **`core`**: Organization and user management (logical grouping)
- **`finance`**: Financial and accounting tables (logical grouping)
- **`ai`**: AI agent and automation tables (logical grouping)
- **`semantic`**: Read-only views optimized for AI agents
- **`drizzle`**: Migration tracking (managed by Drizzle)

### Key Tables

#### Core System (25 tables)
- `organizations` - Tenant organizations
- `organization_members` - User-organization relationships
- `workspaces` - Workspace within organizations
- `User` - User accounts (NextAuth)
- `auth_accounts` - OAuth accounts
- `sessions` - User sessions

#### Financial Module (20 tables)
- `contacts` - Customers and vendors
- `products` - Products and services
- `invoices` / `invoice_lines` - Sales invoices
- `bills` / `bill_lines` - Purchase bills
- `payments` / `payment_allocations` - Payment tracking
- `chart_accounts` - Chart of accounts
- `journal_entries` / `journal_lines` - General ledger
- `tax_codes` - Tax configuration
- `exchange_rates` - Multi-currency support

#### Warehouse & Inventory (5 tables)
- `warehouses` - Warehouse locations
- `inventory_levels` - Current stock levels
- `stock_moves` - Stock movements
- `inventory_adjustments` - Stock adjustments
- `inventory_adjustment_lines` - Adjustment details

#### Order Management (8 tables)
- `sales_orders` / `sales_order_lines` - Sales orders
- `purchase_orders` / `purchase_order_lines` - Purchase orders
- `order_fulfillments` / `fulfillment_lines` - Order fulfillment
- `purchase_receipts` / `receipt_lines` - Goods receipts

#### AI & Automation (12 tables)
- `ai_agents` - AI agent configurations
- `agent_executions` - Execution history
- `agent_conversations` - Conversation threads
- `knowledge_base` - Knowledge articles
- `semantic_catalog` - Semantic metadata
- `query_templates` - Query templates
- `agent_erp_permissions` - Agent permissions
- `financial_guardrails` - Financial limits

### Semantic Views (10 views)

AI-optimized views in the `semantic` schema:

- `v_balance_sheet` - Real-time balance sheet
- `v_profit_loss_statement` - P&L statement
- `v_cash_flow_statement` - Cash flow analysis
- `v_ar_aging_report` - Accounts receivable aging
- `v_ap_aging_report` - Accounts payable aging
- `v_customer_revenue` - Customer revenue analysis
- `v_inventory_status` - Inventory overview
- `v_order_pipeline` - Order status pipeline
- `v_financial_ratios` - Key financial ratios
- `v_kpi_dashboard` - Business KPIs

## 🔄 Migration System

The project uses a dual migration system:

### Drizzle Migrations (TypeScript → SQL)
- **Location**: `/lib/db/migrations/`
- **Purpose**: Create tables, columns, indexes from TypeScript schemas
- **Command**: `pnpm db:migrate`

### Supabase Migrations (Pure SQL)
- **Location**: `/supabase/migrations/`
- **Purpose**: RLS functions, policies, views, triggers
- **Command**: `pnpm supabase:migrate:local`

### Migration Commands

```bash
# Development
pnpm db:generate       # Generate new migration from schema changes
pnpm db:migrate        # Run Drizzle migrations
pnpm supabase:migrate:local  # Run Supabase migrations locally
pnpm migrate:local     # Run both (complete setup)

# Reset database
pnpm db:reset:local    # Reset and recreate everything

# Production
pnpm migrate:prod      # Run all migrations in production
pnpm supabase:migrate:prod  # Run Supabase migrations in production

# Utilities
pnpm db:studio         # Open Drizzle Studio
supabase studio        # Open Supabase Studio
```

## 🔐 Authentication

### Dual Authentication System

The platform uses a unique dual authentication approach:

1. **NextAuth**: Primary authentication for web application
   - Handles user sessions and JWT tokens
   - Manages login/logout flow
   - Provides user context to React components

2. **Supabase Auth Bridge**: Synchronizes with Supabase RLS
   - Creates Supabase-compatible JWTs
   - Sets RLS context for database queries
   - Ensures tenant isolation

### Verification

Run the auth verification script:
```bash
npx tsx scripts/verify-dual-auth.ts
```

This checks:
- Environment variables
- Database connection
- RLS functions
- Organization tables
- Supabase Auth
- RLS policies
- Semantic views

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run specific test suites
pnpm test:auth
pnpm test:api
pnpm test:integration
```

## 📚 API Documentation

### REST API Endpoints

The application provides RESTful APIs for all ERP operations:

- `/api/auth/*` - Authentication endpoints
- `/api/organizations/*` - Organization management
- `/api/finance/*` - Financial operations
- `/api/inventory/*` - Inventory management
- `/api/orders/*` - Order processing
- `/api/ai/*` - AI agent interactions

### Database Functions

Key PostgreSQL functions for RLS:

- `auth_org_id()` - Get current organization ID
- `auth_user_id()` - Get current user ID
- `auth_workspace_id()` - Get current workspace ID
- `auth_role()` - Get user role
- `set_auth_context()` - Set RLS context
- `verify_auth_context()` - Verify RLS setup
- `clear_auth_context()` - Clear RLS context

## 🚀 Deployment

### Vercel Deployment

1. Push to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Supabase Cloud

1. Create Supabase project
2. Update `.env.local` with cloud credentials
3. Run production migrations:
```bash
pnpm migrate:prod
```

## 📖 Documentation

- [Database Schema](./docs/database-schema.md)
- [API Reference](./docs/api-reference.md)
- [AI Agent Guide](./docs/ai-agents.md)
- [Security Model](./docs/security.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

[MIT License](LICENSE)

## 🆘 Support

- [Documentation](https://docs.omnizen.ai)
- [Discord Community](https://discord.gg/omnizen)
- [GitHub Issues](https://github.com/your-org/omnizen-app/issues)

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org)
- [Supabase](https://supabase.com)
- [Drizzle ORM](https://orm.drizzle.team)
- [NextAuth.js](https://next-auth.js.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Vercel AI SDK](https://sdk.vercel.ai)