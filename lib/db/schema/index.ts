// Core schemas
export * from './core/organizations';
export * from './core/users';

// Finance schemas
export * from './finance/accounts';
export * from './finance/transactions';

// AI schemas
export * from './ai/agents';

// ERP schemas
export * from './erp/banking';
export * from './erp/warehouses';
export * from './erp/orders';

// Personal Finance schemas
export * from './personal/finance';

// Legacy schemas (for backward compatibility)
// Re-export specific items to avoid conflicts
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