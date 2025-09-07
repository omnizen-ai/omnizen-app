// Core schemas
export * from './core/organizations';
export * from './core/users';
export * from './core/document-sequences';

// Finance schemas
export * from './finance/accounts';
export * from './finance/transactions';

// AI schemas
export * from './ai/agents';
export * from './ai/erp-permissions';

// ERP schemas
export * from './erp/banking';
export * from './erp/warehouses';
export * from './erp/orders';

// Document schemas
export * from './documents/documents';
export * from './vectors/schema';

// Personal Finance schemas
export * from './personal/finance';

// Semantic schemas
export * from './semantic/catalog';

// Legacy schemas (for backward compatibility during ERP migration)
// 
// LEGACY SCHEMA STRATEGY:
// These exports maintain compatibility with existing chat/AI functionality
// while new ERP features use the modern schema structure above.
//
// Re-export specific items to avoid conflicts where possible
// Note: `User` type is intentionally NOT re-exported here to allow
// the new ERP `User` type to take precedence (see lib/db/index.ts)
export { 
  chat, 
  type Chat,
  message,
  type DBMessage,
  document,
  type Document,
  vote,
  type Vote,
  suggestion,
  type Suggestion
} from '../schema';