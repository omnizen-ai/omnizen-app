import { tool } from 'ai';
import { z } from 'zod';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { validateSQL, sanitizeSQL } from './safety';
import { getRelevantSchema } from './schema-helper';

// Helper to get current user context (you'll need to pass this from the route)
interface UserContext {
  userId: string;
  orgId: string;
  workspaceId?: string;
  role: string;
}

/**
 * Safe database read tool - executes SELECT queries with RLS
 */
export const createDbReadTool = (context: UserContext) => tool({
  description: 'Execute safe SELECT queries on the database with automatic RLS filtering',
  inputSchema: z.object({
    query: z.string().describe('The SELECT query to execute'),
    explain: z.boolean().optional().describe('Show query execution plan instead of results'),
  }),
  execute: async ({ query, explain }) => {
    try {
      // Validate query is safe
      const validation = await validateSQL(query, 'read');
      if (!validation.safe) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Add RLS context
      const contextualQuery = sanitizeSQL(query, context);

      // Explain mode
      if (explain) {
        const explainResult = await db.execute(sql.raw(`EXPLAIN ${contextualQuery}`));
        return {
          success: true,
          plan: explainResult,
        };
      }

      // Execute query
      const startTime = Date.now();
      const result = await db.execute(sql.raw(contextualQuery));
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: result,
        rowCount: Array.isArray(result) ? result.length : 0,
        executionTime,
      };
    } catch (error) {
      console.error('[dbRead] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Query execution failed',
      };
    }
  },
});

/**
 * Safe database write tool - executes INSERT/UPDATE/DELETE with validation
 */
export const createDbWriteTool = (context: UserContext) => tool({
  description: 'Execute INSERT, UPDATE, or DELETE operations with validation and audit logging',
  inputSchema: z.object({
    query: z.string().describe('The INSERT/UPDATE/DELETE query to execute'),
    preview: z.boolean().optional().describe('Preview affected rows without executing'),
    confirm: z.boolean().optional().describe('Confirmation for destructive operations'),
  }),
  execute: async ({ query, preview, confirm }) => {
    try {
      // Validate query is safe
      const validation = await validateSQL(query, 'write');
      if (!validation.safe) {
        return {
          success: false,
          error: validation.error,
          needsConfirmation: validation.needsConfirmation,
        };
      }

      // Check if confirmation is needed
      if (validation.needsConfirmation && !confirm) {
        // Preview mode - show what would be affected
        const previewQuery = query.replace(/^(DELETE|UPDATE)/i, 'SELECT * FROM');
        const previewResult = await db.execute(sql.raw(sanitizeSQL(previewQuery, context)));
        
        return {
          success: false,
          needsConfirmation: true,
          preview: `This operation will affect ${Array.isArray(previewResult) ? previewResult.length : 0} rows`,
          affectedRows: previewResult,
        };
      }

      // Add RLS context
      const contextualQuery = sanitizeSQL(query, context);

      // Preview mode
      if (preview) {
        const countQuery = query.toLowerCase().startsWith('delete') 
          ? query.replace(/^DELETE/i, 'SELECT COUNT(*) as count')
          : query.replace(/^UPDATE.*?SET.*?(?=WHERE)/i, 'SELECT COUNT(*) as count FROM');
        
        const countResult = await db.execute(sql.raw(sanitizeSQL(countQuery, context)));
        return {
          success: true,
          preview: true,
          affectedRows: countResult[0]?.count || 0,
        };
      }

      // Execute mutation
      const startTime = Date.now();
      const result = await db.execute(sql.raw(contextualQuery));
      const executionTime = Date.now() - startTime;

      // Log to audit trail (you'll implement this based on your audit table)
      await logAuditTrail({
        userId: context.userId,
        orgId: context.orgId,
        operation: query.split(' ')[0].toUpperCase(),
        query: contextualQuery,
        success: true,
        executionTime,
      });

      return {
        success: true,
        data: result,
        rowsAffected: Array.isArray(result) ? result.length : 0,
        executionTime,
      };
    } catch (error) {
      console.error('[dbWrite] Error:', error);
      
      // Log failed attempt
      await logAuditTrail({
        userId: context.userId,
        orgId: context.orgId,
        operation: query.split(' ')[0].toUpperCase(),
        query,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Query execution failed',
      };
    }
  },
});

/**
 * Schema information tool - provides table structures and relationships
 */
export const createSchemaInfoTool = (context: UserContext) => tool({
  description: 'Get database schema information for specified tables or based on intent',
  inputSchema: z.object({
    tables: z.array(z.string()).optional().describe('Specific tables to get schema for'),
    intent: z.string().optional().describe('Query intent to infer relevant tables'),
    includeRelationships: z.boolean().optional().describe('Include foreign key relationships'),
  }),
  execute: async ({ tables, intent, includeRelationships }) => {
    try {
      const schemaInfo = await getRelevantSchema({
        tables,
        intent,
        includeRelationships: includeRelationships ?? true,
        context,
      });

      return {
        success: true,
        schema: schemaInfo,
      };
    } catch (error) {
      console.error('[schemaInfo] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve schema',
      };
    }
  },
});

/**
 * Semantic views tool - lists available pre-optimized views
 */
export const createViewsListTool = (context: UserContext) => tool({
  description: 'List available semantic views optimized for common queries',
  inputSchema: z.object({
    domain: z.string().optional().describe('Filter views by domain (finance, inventory, etc.)'),
  }),
  execute: async ({ domain }) => {
    try {
      // Query information_schema for views in semantic schema
      const viewsQuery = `
        SELECT 
          table_name as view_name,
          obj_description(pgc.oid, 'pg_class') as description
        FROM information_schema.views v
        JOIN pg_class pgc ON pgc.relname = v.table_name
        WHERE v.table_schema = 'semantic'
        ${domain ? `AND v.table_name LIKE '%${domain}%'` : ''}
        ORDER BY v.table_name
      `;

      const views = await db.execute(sql.raw(viewsQuery));

      // Predefined semantic views metadata
      const semanticViews = {
        v_balance_sheet: 'Real-time balance sheet with assets, liabilities, and equity',
        v_profit_loss_statement: 'Income statement with revenue and expenses',
        v_cash_flow_statement: 'Cash flow analysis by operating, investing, and financing',
        v_ar_aging_report: 'Accounts receivable aging analysis',
        v_ap_aging_report: 'Accounts payable aging analysis',
        v_customer_revenue: 'Customer revenue analysis and lifetime value',
        v_inventory_status: 'Current inventory levels and valuation',
        v_order_pipeline: 'Sales and purchase order tracking',
        v_financial_ratios: 'Key financial ratios and metrics',
        v_kpi_dashboard: 'Business KPIs and performance metrics',
      };

      return {
        success: true,
        views: views.map((v: any) => ({
          name: v.view_name,
          description: semanticViews[v.view_name as keyof typeof semanticViews] || v.description,
          domain: inferDomain(v.view_name),
        })),
      };
    } catch (error) {
      console.error('[viewsList] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list views',
      };
    }
  },
});

/**
 * Query explanation tool - shows execution plan without running
 */
export const createExplainQueryTool = (context: UserContext) => tool({
  description: 'Explain a query execution plan without actually running it',
  inputSchema: z.object({
    query: z.string().describe('The query to explain'),
    analyze: z.boolean().optional().describe('Run EXPLAIN ANALYZE for actual execution stats'),
  }),
  execute: async ({ query, analyze }) => {
    try {
      // Validate query
      const validation = await validateSQL(query, 'read');
      if (!validation.safe) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Add RLS context
      const contextualQuery = sanitizeSQL(query, context);
      
      // Build explain query
      const explainQuery = analyze 
        ? `EXPLAIN ANALYZE ${contextualQuery}`
        : `EXPLAIN ${contextualQuery}`;

      const result = await db.execute(sql.raw(explainQuery));

      return {
        success: true,
        plan: result,
        query: contextualQuery,
      };
    } catch (error) {
      console.error('[explainQuery] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to explain query',
      };
    }
  },
});

// Helper functions
async function logAuditTrail(entry: {
  userId: string;
  orgId: string;
  operation: string;
  query: string;
  success: boolean;
  error?: string;
  executionTime?: number;
}) {
  try {
    // Implementation depends on your audit trail table
    // For now, just log to console
    console.log('[Audit]', entry);
    
    // When you have the audit table:
    // await db.insert(agentAuditTrail).values({
    //   agentId: 'omni',
    //   userId: entry.userId,
    //   orgId: entry.orgId,
    //   action: entry.operation,
    //   details: { query: entry.query },
    //   success: entry.success,
    //   error: entry.error,
    // });
  } catch (error) {
    console.error('[Audit] Failed to log:', error);
  }
}

function inferDomain(viewName: string): string {
  if (viewName.includes('balance') || viewName.includes('profit') || viewName.includes('cash')) {
    return 'finance';
  }
  if (viewName.includes('inventory')) {
    return 'inventory';
  }
  if (viewName.includes('order')) {
    return 'sales';
  }
  if (viewName.includes('customer')) {
    return 'crm';
  }
  if (viewName.includes('kpi') || viewName.includes('ratio')) {
    return 'analytics';
  }
  return 'general';
}

// Export all tools as a collection
export function createDatabaseTools(context: UserContext) {
  return {
    dbRead: createDbReadTool(context),
    dbWrite: createDbWriteTool(context),
    schemaInfo: createSchemaInfoTool(context),
    viewsList: createViewsListTool(context),
    explainQuery: createExplainQueryTool(context),
  };
}