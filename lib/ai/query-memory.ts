/**
 * Redis-based Query Memory Layer
 * Stores successful SQL queries for few-shot learning
 */

import { createClient } from 'redis';
import { sanitizeSQLQuery, sanitizeNaturalQuery } from './query-sanitizer';

// Query memory structure
export interface QueryMemory {
  naturalQuery: string;      // User's original query
  sqlQuery: string;          // Successful SQL query
  tables: string[];          // Tables used in query
  domain: string;            // Business domain
  intent: string;            // Normalized intent
  success: boolean;
  timestamp: number;
  usageCount: number;
}

// Domain detection based on tables
const TABLE_DOMAINS: Record<string, string> = {
  invoices: 'finance',
  payments: 'finance',
  bills: 'finance',
  chart_of_accounts: 'finance',
  journal_entries: 'finance',
  
  customers: 'contacts',
  vendors: 'contacts',
  contacts: 'contacts',
  
  products: 'inventory',
  warehouses: 'inventory',
  inventory_levels: 'inventory',
  stock_moves: 'inventory',
  
  sales_orders: 'orders',
  purchase_orders: 'orders',
  
  bank_accounts: 'banking',
  bank_transactions: 'banking',
};

// Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://:myredissecret@localhost:6379';
    
    try {
      redisClient = createClient({ url: redisUrl });
      redisClient.on('error', (err) => console.log('[QueryMemory] Redis error:', err.message));
      await redisClient.connect();
      console.log('[QueryMemory] Connected to Redis');
    } catch (error) {
      console.log('[QueryMemory] Failed to connect to Redis:', error);
      return null;
    }
  }
  
  return redisClient;
}

/**
 * Normalize user intent for consistent keying
 */
export function normalizeIntent(naturalQuery: string): string {
  const query = naturalQuery.toLowerCase();
  const parts: string[] = [];
  
  // Workflow detection (slash commands)
  if (query.includes('/workflow:invoice')) parts.push('workflow_invoice');
  if (query.includes('/workflow:payment')) parts.push('workflow_payment');
  if (query.includes('/workflow:reconcile')) parts.push('workflow_reconcile');
  if (query.includes('/workflow:month-end')) parts.push('workflow_month_end');
  if (query.includes('/workflow:inventory')) parts.push('workflow_inventory');
  if (query.includes('/workflow:expense')) parts.push('workflow_expense');
  if (query.includes('/workflow:revenue')) parts.push('workflow_revenue');
  
  // Action detection
  if (query.includes('show') || query.includes('list') || query.includes('get')) {
    parts.push('lookup');
  } else if (query.includes('sum') || query.includes('total') || query.includes('revenue')) {
    parts.push('aggregate');
  } else if (query.includes('report')) {
    parts.push('report');
  } else if (query.includes('create') || query.includes('add') || query.includes('new')) {
    parts.push('create');
  } else if (query.includes('update') || query.includes('modify') || query.includes('change')) {
    parts.push('update');
  } else {
    parts.push('query');
  }
  
  // Entity detection (both regular keywords and @ mentions)
  if (query.includes('invoice') || query.includes('@invoice:')) parts.push('invoice');
  if (query.includes('customer') || query.includes('@customer:')) parts.push('customer');
  if (query.includes('product') || query.includes('@product:')) parts.push('product');
  if (query.includes('payment') || query.includes('@payment:')) parts.push('payment');
  if (query.includes('vendor') || query.includes('@vendor:')) parts.push('vendor');
  if (query.includes('inventory') || query.includes('stock') || query.includes('@inventory:')) parts.push('inventory');
  if (query.includes('account') || query.includes('@account:')) parts.push('account');
  if (query.includes('contact') || query.includes('@contact:')) parts.push('contact');
  
  // Entity mention context detection (specific entities)
  const entityMentions = query.match(/@(\w+):([^@\s]+)/g) || [];
  for (const mention of entityMentions) {
    const [, entityType, entityValue] = mention.match(/@(\w+):([^@\s]+)/) || [];
    if (entityType && entityValue) {
      // Normalize entity values (remove special chars, limit length)
      const normalizedValue = entityValue.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
      parts.push(`${entityType}_${normalizedValue}`);
    }
  }
  
  // Qualifier detection
  if (query.includes('unpaid') || query.includes('overdue')) parts.push('unpaid');
  if (query.includes('month')) parts.push('monthly');
  if (query.includes('year')) parts.push('yearly');
  if (query.includes('pending')) parts.push('pending');
  if (query.includes('completed') || query.includes('paid')) parts.push('completed');
  
  return parts.join('_');
}

/**
 * Extract table names from SQL query
 */
export function extractTables(sqlQuery: string): string[] {
  const tables = new Set<string>();
  const query = sqlQuery.toLowerCase();
  
  // Match FROM and JOIN clauses
  const fromMatches = query.match(/(?:from|join)\s+(\w+)/gi) || [];
  
  for (const match of fromMatches) {
    const tableName = match.replace(/^(from|join)\s+/i, '').trim();
    if (TABLE_DOMAINS[tableName]) {
      tables.add(tableName);
    }
  }
  
  return Array.from(tables);
}

/**
 * Detect domain from tables used
 */
export function detectDomain(tables: string[]): string {
  const domains = new Set<string>();
  
  for (const table of tables) {
    if (TABLE_DOMAINS[table]) {
      domains.add(TABLE_DOMAINS[table]);
    }
  }
  
  // Return most specific domain or 'general'
  if (domains.size === 1) {
    return Array.from(domains)[0];
  } else if (domains.has('finance')) {
    return 'finance'; // Finance is usually primary
  } else {
    return 'general';
  }
}

/**
 * Store successful query in Redis
 */
export async function storeSuccessfulQuery(
  naturalQuery: string,
  sqlQuery: string,
  success: boolean = true
): Promise<void> {
  try {
    // Skip storing if input is too large (likely CSV/structured data)
    const MAX_QUERY_LENGTH = 500; // Characters
    if (naturalQuery.length > MAX_QUERY_LENGTH || sqlQuery.length > 5000) {
      console.log('[QueryMemory] Skipping storage - input too large (likely structured data)');
      return;
    }
    
    // Skip if it looks like CSV data (multiple commas per line)
    const lines = naturalQuery.split('\n').slice(0, 3); // Check first 3 lines
    const looksLikeCSV = lines.some(line => (line.match(/,/g) || []).length > 5);
    if (looksLikeCSV) {
      console.log('[QueryMemory] Skipping storage - detected CSV/structured data');
      return;
    }
    
    const client = await getRedisClient();
    if (!client) return;
    
    // Sanitize queries before processing
    const sanitizedSQL = sanitizeSQLQuery(sqlQuery);
    const sanitizedNatural = sanitizeNaturalQuery(naturalQuery);
    
    // Use sanitized SQL for table extraction
    const tables = extractTables(sqlQuery); // Still use original for accurate table names
    const domain = detectDomain(tables);
    const intent = normalizeIntent(sanitizedNatural); // Use sanitized for intent
    
    // Create key: query:domain:intent
    const key = `query:${domain}:${intent}`;
    
    // Get existing entry to update usage count
    const existing = await client.get(key);
    let usageCount = 1;
    
    if (existing) {
      const parsed = JSON.parse(existing) as QueryMemory;
      usageCount = parsed.usageCount + 1;
    }
    
    const memory: QueryMemory = {
      naturalQuery: sanitizedNatural,  // Store sanitized version
      sqlQuery: sanitizedSQL,          // Store sanitized version
      tables,
      domain,
      intent,
      success,
      timestamp: Date.now(),
      usageCount,
    };
    
    // Store with 7-day TTL (refreshed on each use)
    await client.setEx(key, 604800, JSON.stringify(memory));
    
    console.log(`[QueryMemory] Stored: ${key} (usage: ${usageCount})`);
  } catch (error) {
    console.log('[QueryMemory] Storage error:', error);
  }
}

/**
 * Retrieve relevant query examples with workflow and entity context
 */
export async function getRelevantExamples(
  naturalQuery: string,
  limit: number = 3
): Promise<QueryMemory[]> {
  try {
    const client = await getRedisClient();
    if (!client) return [];
    
    const intent = normalizeIntent(naturalQuery);
    const tables = naturalQuery.toLowerCase().includes('invoice') ? ['invoices'] :
                  naturalQuery.toLowerCase().includes('customer') ? ['contacts'] :
                  naturalQuery.toLowerCase().includes('product') ? ['products'] : [];
    const domain = detectDomain(tables);
    
    const examples: QueryMemory[] = [];
    
    // Extract workflow and entity context from query
    const workflowMatches = naturalQuery.match(/\/workflow:(\w+)/g) || [];
    const entityMentions = naturalQuery.match(/@(\w+):([^@\s]+)/g) || [];
    
    // Priority 1: Try exact intent match with workflow and entity context
    if (workflowMatches.length > 0 || entityMentions.length > 0) {
      const contextParts = [domain, intent];
      
      if (workflowMatches.length > 0) {
        const workflow = workflowMatches[0].replace('/workflow:', '');
        contextParts.push(`workflow_${workflow}`);
      }
      
      if (entityMentions.length > 0) {
        const entityContext = entityMentions
          .map(mention => {
            const [, type, value] = mention.match(/@(\w+):([^@\s]+)/) || [];
            return `${type}_${value.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10)}`;
          })
          .join('_');
        contextParts.push(entityContext);
      }
      
      const enhancedKey = `query:${contextParts.join(':')}`;
      const enhanced = await client.get(enhancedKey);
      if (enhanced) {
        examples.push(JSON.parse(enhanced));
        console.log(`[QueryMemory] Found enhanced example: ${enhancedKey}`);
      }
    }
    
    // Priority 2: Try exact intent match (standard)
    const exactKey = `query:${domain}:${intent}`;
    const exact = await client.get(exactKey);
    if (exact && !examples.find(ex => ex.naturalQuery === JSON.parse(exact).naturalQuery)) {
      examples.push(JSON.parse(exact));
    }
    
    // Priority 3: Search for workflow-specific examples if workflow is present
    if (examples.length < limit && workflowMatches.length > 0) {
      const workflow = workflowMatches[0].replace('/workflow:', '');
      const workflowKeys = await client.keys(`query:${domain}:*workflow_${workflow}*`);
      
      for (const key of workflowKeys.slice(0, 5)) {
        if (examples.length >= limit) break;
        
        const value = await client.get(key);
        if (value) {
          const example = JSON.parse(value);
          if (!examples.find(ex => ex.naturalQuery === example.naturalQuery)) {
            examples.push(example);
          }
        }
      }
    }
    
    // Priority 4: Search for entity-specific examples if entities are present
    if (examples.length < limit && entityMentions.length > 0) {
      for (const mention of entityMentions) {
        if (examples.length >= limit) break;
        
        const [, type, value] = mention.match(/@(\w+):([^@\s]+)/) || [];
        const normalizedValue = value.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
        const entityKeys = await client.keys(`query:${domain}:*${type}_${normalizedValue}*`);
        
        for (const key of entityKeys.slice(0, 3)) {
          if (examples.length >= limit) break;
          
          const value = await client.get(key);
          if (value) {
            const example = JSON.parse(value);
            if (!examples.find(ex => ex.naturalQuery === example.naturalQuery)) {
              examples.push(example);
            }
          }
        }
      }
    }
    
    // Priority 5: If not enough examples, search by domain pattern (fallback)
    if (examples.length < limit) {
      const keys = await client.keys(`query:${domain}:*`);
      
      for (const key of keys.slice(0, 10)) {
        if (examples.length >= limit) break;
        
        if (key !== exactKey) {
          const value = await client.get(key);
          if (value) {
            const example = JSON.parse(value);
            if (!examples.find(ex => ex.naturalQuery === example.naturalQuery)) {
              examples.push(example);
            }
          }
        }
      }
    }
    
    // Sort by usage count and recency
    examples.sort((a, b) => {
      // Prioritize usage count, then recency
      if (b.usageCount !== a.usageCount) {
        return b.usageCount - a.usageCount;
      }
      return b.timestamp - a.timestamp;
    });
    
    console.log(`[QueryMemory] Retrieved ${examples.length} examples for: ${intent}`);
    return examples.slice(0, limit);
  } catch (error) {
    console.log('[QueryMemory] Retrieval error:', error);
    return [];
  }
}

/**
 * Format examples for prompt injection
 */
export function formatExamplesForPrompt(examples: QueryMemory[]): string {
  if (examples.length === 0) return '';
  
  let prompt = '\n## Recent Successful Queries (Examples):\n';
  prompt += '\n🔒 **CRITICAL: ROW-LEVEL SECURITY (RLS) INSTRUCTIONS**\n';
  prompt += '• Write PURE BUSINESS LOGIC SQL only\n';
  prompt += '• DO NOT add WHERE clauses for organization_id, user_id, or workspace_id\n';
  prompt += '• DO NOT use placeholders like {{org_id}}, {{user_id}}, {{organization_id}}\n';
  prompt += '• The PostgreSQL RLS system automatically filters data by organization/user context\n';
  prompt += '• Examples below may show placeholder syntax - IGNORE this and write clean SQL\n';
  prompt += '• Focus only on business logic: customer names, invoice status, date ranges, etc.\n\n';
  
  for (const example of examples) {
    prompt += `**User Query**: "${example.naturalQuery}"\n`;
    prompt += `**SQL Pattern**: \`\`\`sql\n${example.sqlQuery}\n\`\`\`\n`;
    prompt += `**Tables Used**: ${example.tables.join(', ')}\n\n`;
  }
  
  prompt += '✅ **Example of CORRECT SQL Generation**:\n';
  prompt += '```sql\n';
  prompt += 'SELECT invoice_number, total_amount, status\n';
  prompt += 'FROM invoices\n';
  prompt += 'WHERE status = \'unpaid\'\n';
  prompt += 'ORDER BY total_amount DESC;\n';
  prompt += '```\n\n';
  
  prompt += '❌ **DO NOT Generate** (RLS handles this automatically):\n';
  prompt += '```sql\n';
  prompt += '-- WRONG: Do not add organization_id filters\n';
  prompt += 'SELECT * FROM invoices WHERE organization_id = \'{{org_id}}\' AND status = \'unpaid\';\n';
  prompt += '```\n\n';
  
  return prompt;
}