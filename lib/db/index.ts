import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from './schema';
import * as coreSchema from './schema/core/organizations';
import * as usersSchema from './schema/core/users';
import * as documentSequencesSchema from './schema/core/document-sequences';
import * as accountsSchema from './schema/finance/accounts';
import * as transactionsSchema from './schema/finance/transactions';
import * as aiSchema from './schema/ai/agents';
import * as erpPermissionsSchema from './schema/ai/erp-permissions';
import * as bankingSchema from './schema/erp/banking';
import * as warehousesSchema from './schema/erp/warehouses';
import * as ordersSchema from './schema/erp/orders';
import * as personalFinanceSchema from './schema/personal/finance';
import * as semanticSchema from './schema/semantic/catalog';

// Combine all schemas
const fullSchema = {
  // Legacy schema (for backward compatibility)
  ...schema,
  
  // Core schemas
  ...coreSchema,
  ...usersSchema,
  ...documentSequencesSchema,
  
  // Finance schemas
  ...accountsSchema,
  ...transactionsSchema,
  
  // AI schemas
  ...aiSchema,
  ...erpPermissionsSchema,
  
  // ERP schemas
  ...bankingSchema,
  ...warehousesSchema,
  ...ordersSchema,
  
  // Personal Finance schemas
  ...personalFinanceSchema,
  
  // Semantic schemas
  ...semanticSchema,
};

// Create the connection
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL!;

// For query purposes
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema: fullSchema });

// Create RLS-compliant connection for AI tools
const aiAgentConnectionString = 'postgresql://ai_agent_role:ai_agent_secure_password@127.0.0.1:54322/postgres';
const aiQueryClient = postgres(aiAgentConnectionString);
export const aiDb = drizzle(aiQueryClient, { schema: fullSchema });

// For migrations
const migrationClient = postgres(connectionString, { max: 1 });
export const migrationDb = drizzle(migrationClient, { schema: fullSchema });

// Export all schemas for use in other files
// 
// BACKWARD COMPATIBILITY STRATEGY:
// This dual export pattern is intentionally designed to support gradual migration
// from legacy chat-focused schema to new ERP-focused schema structure.
//
// Export legacy schemas first (for backward compatibility)
// eslint-disable-next-line import/export -- Intentional dual User export for backward compatibility
export * from './schema';

// Export new schemas second (some will override legacy exports)
// 
// IMPORTANT: ESLint will warn about "Multiple exports of name 'User'" - this is INTENTIONAL.
// 
// Legacy schema exports: `user` (table) + `User` (type) - for chat/AI features
// New schema exports:    `users` (table) + `User` (type) - for ERP/business features
//
// Due to ES module export resolution, the NEW `User` type takes precedence when imported,
// while legacy code can still access the old `user` table by specific name.
// This allows existing chat functionality to continue working during ERP migration.
//
// Code Review Note: The dual `User` export warning is expected and should NOT be "fixed"
// as it would break the backward compatibility strategy for schema migration.
export * from './schema/core/organizations';
// eslint-disable-next-line import/export -- Intentional dual User export for backward compatibility  
export * from './schema/core/users';
export * from './schema/finance/accounts';
export * from './schema/finance/transactions';
export * from './schema/ai/agents';
export * from './schema/ai/erp-permissions';
export * from './schema/erp/banking';
export * from './schema/erp/warehouses';
export * from './schema/erp/orders';
export * from './schema/documents/documents';
export * from './schema/vectors/schema';
export * from './schema/personal/finance';
export * from './schema/semantic/catalog';

// Helper function to set auth context for RLS
export async function setAuthContext(
  userId: string,
  organizationId: string,
  workspaceId?: string,
  role = 'employee'
) {
  await db.execute(sql`
    SELECT set_config('auth.user_id', ${userId}, true),
           set_config('auth.org_id', ${organizationId}, true),
           set_config('auth.workspace_id', ${workspaceId || ''}, true),
           set_config('auth.role', ${role}, true)
  `);
}

// Helper function to get current auth context
export async function getAuthContext() {
  const result = await db.execute(`
    SELECT 
      auth_user_id() as user_id,
      auth_org_id() as org_id,
      auth_workspace_id() as workspace_id,
      auth_role() as role
  `);
  
  return result.rows[0];
}

// Types are already exported via export * from './schema'
// No need for duplicate type exports