import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as coreSchema from './schema/core/organizations';
import * as usersSchema from './schema/core/users';
import * as accountsSchema from './schema/finance/accounts';
import * as transactionsSchema from './schema/finance/transactions';
import * as aiSchema from './schema/ai/agents';

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
export * from './schema';
export * from './schema/core/organizations';
export * from './schema/core/users';
export * from './schema/finance/accounts';
export * from './schema/finance/transactions';
export * from './schema/ai/agents';

// Helper function to set auth context for RLS
export async function setAuthContext(
  userId: string,
  organizationId: string,
  workspaceId?: string,
  role: string = 'employee'
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

// Type exports
export type {
  // Core types
  Organization,
  Workspace,
  User,
  OrganizationMember,
  AuditLog,
  
  // Finance types
  Account,
  Journal,
  JournalEntry,
  JournalLine,
  Currency,
  ExchangeRate,
  TaxCode,
  Contact,
  Product,
  Invoice,
  InvoiceLine,
  Bill,
  BillLine,
  Payment,
  PaymentAllocation,
  
  // AI types
  AIAgent,
  AgentExecution,
  AgentConversation,
  ConversationMessage,
  AgentSchedule,
  KnowledgeBase,
  
  // Legacy types
  Chat,
  DBMessage,
  Document,
  Suggestion,
  Vote,
} from './schema/index';