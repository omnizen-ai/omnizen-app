import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as coreSchema from './schema/core/organizations';
import * as usersSchema from './schema/core/users';
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
const connectionString = process.env.POSTGRES_URL!;

// For query purposes
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema: fullSchema });

// For migrations
const migrationClient = postgres(connectionString, { max: 1 });
export const migrationDb = drizzle(migrationClient, { schema: fullSchema });

// Export all schemas for use in other files
// Export legacy schemas first (for backward compatibility)
export * from './schema';

// Export new schemas (some may override legacy exports)
// Note: This creates a unified export surface where new schemas take precedence
export * from './schema/core/organizations';
export * from './schema/core/users';
export * from './schema/finance/accounts';
export * from './schema/finance/transactions';
export * from './schema/ai/agents';
export * from './schema/ai/erp-permissions';
export * from './schema/erp/banking';
export * from './schema/erp/warehouses';
export * from './schema/erp/orders';
export * from './schema/personal/finance';
export * from './schema/semantic/catalog';

// Helper function to set auth context for RLS
export async function setAuthContext(
  userId: string,
  organizationId: string,
  workspaceId?: string,
  role = 'employee'
) {
  await db.execute(`
    SELECT set_auth_context(
      $1::uuid,
      $2::uuid,
      $3::uuid,
      $4::text
    )
  `, [userId, organizationId, workspaceId || null, role]);
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