// Core schemas
export * from './core/organizations';
export * from './core/users';

// Finance schemas
export * from './finance/accounts';
export * from './finance/transactions';

// AI schemas
export * from './ai/agents';

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