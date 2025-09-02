# Database Schema Organization

## Overview
The OmniZen project uses a dual-type system combining Drizzle ORM schemas with Supabase-generated types for maximum type safety and developer experience.

## Schema Structure

### Directory Layout
```
lib/db/
├── index.ts                 # Main database client and exports
├── schema.ts               # Legacy schemas (backward compatibility)
├── schema/
│   ├── index.ts           # Central export point for all schemas
│   ├── core/              # Core system schemas
│   │   ├── organizations.ts
│   │   └── users.ts
│   ├── finance/           # Financial module schemas
│   │   ├── accounts.ts
│   │   └── transactions.ts
│   ├── ai/                # AI and automation schemas
│   │   ├── agents.ts
│   │   └── erp-permissions.ts
│   ├── erp/               # ERP module schemas
│   │   ├── banking.ts
│   │   ├── warehouses.ts
│   │   └── orders.ts
│   └── semantic/          # Semantic layer schemas
│       └── catalog.ts
└── supabase/
    └── types.ts           # Supabase-generated types
```

## Type Systems

### 1. Drizzle Schemas
- **Purpose**: Define table structures, generate migrations, provide query builder objects
- **Location**: `lib/db/schema/**/*.ts`
- **Usage**: 
  ```typescript
  import { bankAccounts } from '@/lib/db/schema';
  const accounts = await db.select().from(bankAccounts);
  ```

### 2. Supabase Types
- **Purpose**: Provide TypeScript types for data structures
- **Location**: `lib/supabase/types.ts`
- **Generation**: `pnpm db:types`
- **Usage**:
  ```typescript
  import type { Database } from '@/lib/supabase/types';
  type BankAccount = Database['public']['Tables']['bank_accounts']['Row'];
  ```

## Import Patterns

### Option 1: Import from Central Index
```typescript
// Import everything from the central index
import { 
  bankAccounts, 
  warehouses, 
  salesOrders,
  type BankAccount,
  type Warehouse 
} from '@/lib/db/schema';
```

### Option 2: Import from Specific Files
```typescript
// Import directly from specific schema files
import { bankAccounts, type BankAccount } from '@/lib/db/schema/erp/banking';
import { warehouses, type Warehouse } from '@/lib/db/schema/erp/warehouses';
```

### Option 3: Import from Database Client
```typescript
// Import from the main database file (includes all exports)
import { db, bankAccounts, warehouses } from '@/lib/db';
```

## Key Files and Their Roles

### `drizzle.config.ts`
- Discovers schema files via glob patterns
- Generates SQL migrations from TypeScript schemas
- Includes: `'./lib/db/schema/**/*.ts'`

### `lib/db/index.ts`
- Creates the database client with all schemas
- Exports all schemas for application use
- Provides RLS helper functions

### `lib/db/schema/index.ts`
- Central export point for all schema modules
- Maintains backward compatibility with legacy schemas
- Organizes exports by module (core, finance, ai, erp)

## Migration System

### Drizzle Migrations (Tables)
- **Location**: `/lib/db/migrations/`
- **Purpose**: Create/modify tables from TypeScript schemas
- **Commands**:
  ```bash
  pnpm db:generate   # Generate migration from schema changes
  pnpm db:migrate    # Apply Drizzle migrations
  ```

### Supabase Migrations (RLS/Views)
- **Location**: `/supabase/migrations/`
- **Purpose**: RLS policies, views, functions, triggers
- **Commands**:
  ```bash
  pnpm supabase:migrate:local  # Apply locally
  pnpm supabase:migrate:prod   # Apply to production
  ```

## Best Practices

1. **Keep Both Type Systems**: Use Drizzle for migrations/queries, Supabase types for data structures
2. **Consistent Imports**: Use the central index (`@/lib/db/schema`) for consistency
3. **Separation of Concerns**: Tables in Drizzle, RLS/views in Supabase migrations
4. **Type Generation**: Run `pnpm db:types` after schema changes
5. **Testing**: Always test with `pnpm db:generate` after schema modifications

## Common Commands

```bash
# Database operations
pnpm db:generate          # Generate migrations from schema changes
pnpm db:migrate           # Apply Drizzle migrations
pnpm db:types            # Generate Supabase types
pnpm migrate:local       # Run both migration systems
pnpm db:reset:local      # Reset and rebuild database

# Development
pnpm dev                 # Start dev server
pnpm db:studio          # Open Drizzle Studio
supabase studio         # Open Supabase Studio
```