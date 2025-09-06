/**
 * OmniZen AI Agent Tools - Flat Architecture
 * 
 * This module provides a simple toolkit for AI agents:
 * - Direct API consumption tools for fast operations
 * - Powerful SQL tools for complex analytics  
 * - Flat, no-routing architecture for simplicity
 * 
 * Architecture Benefits:
 * - Ultra-simple flat structure
 * - Direct tool access without routing overhead
 * - Fast response times for all operations
 * - Easy to understand and maintain
 */

import { createSalesApiTools } from './sales-api-tools';
import { createInventoryApiTools } from './inventory-api-tools';
import { createFinancialApiTools } from './financial-api-tools';
import { createDatabaseTools } from './database-tools';

// User context interface
export interface UserContext {
  userId: string;
  orgId: string;
  workspaceId?: string;
  role: string;
}


/**
 * Create all AI agent tools for a given user context
 * Simple flat structure - no routing or domain agents
 */
export function createAiAgentTools(context: UserContext) {
  // Create individual tool sets
  const salesApiTools = createSalesApiTools(context);
  const inventoryApiTools = createInventoryApiTools(context);
  const financialApiTools = createFinancialApiTools(context);
  const databaseTools = createDatabaseTools(context);

  return {
    // Flat structure - all tools directly accessible
    ...salesApiTools,
    ...inventoryApiTools,
    ...financialApiTools,
    ...databaseTools,
  };
}


// Re-export tool creators for direct use
export {
  createSalesApiTools,
  createInventoryApiTools,
  createFinancialApiTools,
  createDatabaseTools,
};

// Default export for convenience
export default createAiAgentTools;