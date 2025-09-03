/**
 * Schema Helper - Provides relevant database schema information
 * Optimizes token usage by only returning necessary schemas
 */

import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

interface UserContext {
  userId: string;
  orgId: string;
  workspaceId?: string;
  role: string;
}

interface SchemaOptions {
  tables?: string[];
  intent?: string;
  includeRelationships?: boolean;
  context: UserContext;
}

interface TableSchema {
  tableName: string;
  columns: ColumnInfo[];
  relationships?: Relationship[];
  description?: string;
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
  description?: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
}

interface Relationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  relationshipType: 'one-to-one' | 'one-to-many' | 'many-to-one';
}

/**
 * Get relevant schema based on tables or intent
 */
export async function getRelevantSchema(options: SchemaOptions): Promise<TableSchema[]> {
  const { tables, intent, includeRelationships = true } = options;
  
  // Determine which tables to fetch
  let tablesToFetch: string[] = [];
  
  if (tables && tables.length > 0) {
    tablesToFetch = tables;
  } else if (intent) {
    tablesToFetch = inferTablesFromIntent(intent);
  } else {
    // Return common tables if no specific request
    tablesToFetch = getCommonTables();
  }
  
  // Fetch schema information
  const schemas: TableSchema[] = [];
  
  for (const tableName of tablesToFetch) {
    const schema = await getTableSchema(tableName, includeRelationships);
    if (schema) {
      schemas.push(schema);
    }
  }
  
  return schemas;
}

/**
 * Get schema for a specific table
 */
async function getTableSchema(
  tableName: string,
  includeRelationships: boolean
): Promise<TableSchema | null> {
  try {
    // Get column information
    const columnsQuery = `
      SELECT 
        c.column_name as name,
        c.data_type as type,
        c.is_nullable = 'YES' as nullable,
        c.column_default as default,
        col_description(pgc.oid, c.ordinal_position) as description,
        CASE 
          WHEN pk.constraint_type = 'PRIMARY KEY' THEN true 
          ELSE false 
        END as is_primary_key,
        CASE 
          WHEN fk.constraint_type = 'FOREIGN KEY' THEN true 
          ELSE false 
        END as is_foreign_key
      FROM information_schema.columns c
      LEFT JOIN pg_class pgc ON pgc.relname = c.table_name
      LEFT JOIN (
        SELECT kcu.column_name, tc.constraint_type
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = $1 
          AND tc.constraint_type = 'PRIMARY KEY'
      ) pk ON pk.column_name = c.column_name
      LEFT JOIN (
        SELECT kcu.column_name, tc.constraint_type
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = $1 
          AND tc.constraint_type = 'FOREIGN KEY'
      ) fk ON fk.column_name = c.column_name
      WHERE c.table_name = $1
        AND c.table_schema = 'public'
      ORDER BY c.ordinal_position
    `;
    
    const columns = await db.execute(sql.raw(columnsQuery.replace(/\$1/g, `'${tableName}'`)));
    
    if (!columns || columns.length === 0) {
      return null;
    }
    
    const tableSchema: TableSchema = {
      tableName,
      columns: columns as ColumnInfo[],
      description: getTableDescription(tableName),
    };
    
    // Get relationships if requested
    if (includeRelationships) {
      tableSchema.relationships = await getTableRelationships(tableName);
    }
    
    return tableSchema;
  } catch (error) {
    console.error(`Failed to get schema for table ${tableName}:`, error);
    return null;
  }
}

/**
 * Get foreign key relationships for a table
 */
async function getTableRelationships(tableName: string): Promise<Relationship[]> {
  try {
    const relationshipsQuery = `
      SELECT 
        kcu.table_name as from_table,
        kcu.column_name as from_column,
        ccu.table_name as to_table,
        ccu.column_name as to_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND (kcu.table_name = $1 OR ccu.table_name = $1)
    `;
    
    const relationships = await db.execute(
      sql.raw(relationshipsQuery.replace(/\$1/g, `'${tableName}'`))
    );
    
    return (relationships as any[]).map(rel => ({
      fromTable: rel.from_table,
      fromColumn: rel.from_column,
      toTable: rel.to_table,
      toColumn: rel.to_column,
      relationshipType: inferRelationshipType(rel.from_table, rel.to_table),
    }));
  } catch (error) {
    console.error(`Failed to get relationships for table ${tableName}:`, error);
    return [];
  }
}

/**
 * Infer tables based on query intent
 */
function inferTablesFromIntent(intent: string): string[] {
  const lowerIntent = intent.toLowerCase();
  const tables: Set<string> = new Set();
  
  // Financial intents
  if (lowerIntent.includes('invoice') || lowerIntent.includes('bill')) {
    tables.add('invoices');
    tables.add('invoice_lines');
    tables.add('customers');
  }
  
  if (lowerIntent.includes('payment') || lowerIntent.includes('paid')) {
    tables.add('payments');
    tables.add('invoices');
  }
  
  if (lowerIntent.includes('revenue') || lowerIntent.includes('income')) {
    tables.add('invoices');
    tables.add('invoice_lines');
  }
  
  if (lowerIntent.includes('expense') || lowerIntent.includes('cost')) {
    tables.add('bills');
    tables.add('bill_lines');
    tables.add('vendors');
  }
  
  // Inventory intents
  if (lowerIntent.includes('inventory') || lowerIntent.includes('stock')) {
    tables.add('inventory_levels');
    tables.add('products');
    tables.add('warehouses');
  }
  
  if (lowerIntent.includes('product') || lowerIntent.includes('item')) {
    tables.add('products');
    tables.add('product_categories');
  }
  
  // Order intents
  if (lowerIntent.includes('order')) {
    if (lowerIntent.includes('purchase')) {
      tables.add('purchase_orders');
      tables.add('purchase_order_lines');
    } else {
      tables.add('sales_orders');
      tables.add('sales_order_lines');
    }
  }
  
  // Customer/Vendor intents
  if (lowerIntent.includes('customer') || lowerIntent.includes('client')) {
    tables.add('customers');
    tables.add('contacts');
  }
  
  if (lowerIntent.includes('vendor') || lowerIntent.includes('supplier')) {
    tables.add('vendors');
    tables.add('contacts');
  }
  
  // Accounting intents
  if (lowerIntent.includes('account') || lowerIntent.includes('ledger')) {
    tables.add('chart_of_accounts');
    tables.add('journal_entries');
    tables.add('journal_lines');
  }
  
  if (lowerIntent.includes('balance') || lowerIntent.includes('trial')) {
    tables.add('chart_of_accounts');
    tables.add('journal_entries');
  }
  
  // Default to common tables if no specific match
  if (tables.size === 0) {
    return getCommonTables();
  }
  
  return Array.from(tables);
}

/**
 * Get commonly used tables
 */
function getCommonTables(): string[] {
  return [
    'customers',
    'invoices',
    'products',
    'orders',
    'payments',
  ];
}

/**
 * Get table description based on table name
 */
function getTableDescription(tableName: string): string {
  const descriptions: Record<string, string> = {
    // Core tables
    organizations: 'Organizations (companies) in the system',
    workspaces: 'Workspaces within organizations',
    users: 'System users',
    
    // Financial tables
    invoices: 'Customer invoices for sales',
    invoice_lines: 'Line items on invoices',
    bills: 'Vendor bills for purchases',
    bill_lines: 'Line items on bills',
    payments: 'Payment transactions',
    chart_of_accounts: 'Chart of accounts for accounting',
    journal_entries: 'General ledger journal entries',
    journal_lines: 'Line items in journal entries',
    
    // CRM tables
    customers: 'Customer records',
    vendors: 'Vendor/supplier records',
    contacts: 'Contact information for customers and vendors',
    
    // Inventory tables
    products: 'Products and services',
    product_categories: 'Product categorization',
    warehouses: 'Warehouse locations',
    inventory_levels: 'Current inventory quantities',
    stock_moves: 'Inventory movement records',
    
    // Order tables
    sales_orders: 'Customer sales orders',
    sales_order_lines: 'Line items on sales orders',
    purchase_orders: 'Vendor purchase orders',
    purchase_order_lines: 'Line items on purchase orders',
    
    // AI tables
    ai_agents: 'AI agents configuration',
    agent_executions: 'AI agent execution history',
    agent_conversations: 'AI agent conversation threads',
  };
  
  return descriptions[tableName] || `Table containing ${tableName} data`;
}

/**
 * Infer relationship type based on table names
 */
function inferRelationshipType(
  fromTable: string,
  toTable: string
): 'one-to-one' | 'one-to-many' | 'many-to-one' {
  // Line items to parent (many-to-one)
  if (fromTable.includes('_lines') || fromTable.includes('_items')) {
    return 'many-to-one';
  }
  
  // Parent to line items (one-to-many)
  if (toTable.includes('_lines') || toTable.includes('_items')) {
    return 'one-to-many';
  }
  
  // Default to many-to-one for most foreign keys
  return 'many-to-one';
}

/**
 * Get minimal schema for token efficiency
 */
export async function getMinimalSchema(tableNames: string[]): Promise<string> {
  const schemas = await Promise.all(
    tableNames.map(async (tableName) => {
      const schema = await getTableSchema(tableName, false);
      if (!schema) return '';
      
      // Format as compact string
      const columns = schema.columns
        .filter(col => !col.description?.includes('internal'))
        .map(col => `${col.name}:${col.type}${col.nullable ? '?' : ''}`)
        .join(', ');
      
      return `${tableName}(${columns})`;
    })
  );
  
  return schemas.filter(s => s).join('\n');
}

/**
 * Cache frequently used schemas for performance
 */
const schemaCache = new Map<string, { schema: TableSchema; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCachedSchema(tableName: string): Promise<TableSchema | null> {
  const cached = schemaCache.get(tableName);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.schema;
  }
  
  const schema = await getTableSchema(tableName, true);
  
  if (schema) {
    schemaCache.set(tableName, { schema, timestamp: Date.now() });
  }
  
  return schema;
}