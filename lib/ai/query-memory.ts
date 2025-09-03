/**
 * Redis-based Query Memory Layer
 * Stores successful SQL queries for few-shot learning
 */

import { createClient } from 'redis';

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

async function getRedisClient() {
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
  
  // Action detection
  if (query.includes('show') || query.includes('list') || query.includes('get')) {
    parts.push('lookup');
  } else if (query.includes('sum') || query.includes('total') || query.includes('revenue')) {
    parts.push('aggregate');
  } else if (query.includes('report')) {
    parts.push('report');
  } else {
    parts.push('query');
  }
  
  // Entity detection
  if (query.includes('invoice')) parts.push('invoice');
  if (query.includes('customer')) parts.push('customer');
  if (query.includes('product')) parts.push('product');
  if (query.includes('payment')) parts.push('payment');
  if (query.includes('vendor')) parts.push('vendor');
  if (query.includes('inventory') || query.includes('stock')) parts.push('inventory');
  
  // Qualifier detection
  if (query.includes('unpaid') || query.includes('overdue')) parts.push('unpaid');
  if (query.includes('month')) parts.push('monthly');
  if (query.includes('year')) parts.push('yearly');
  
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
    const client = await getRedisClient();
    if (!client) return;
    
    const tables = extractTables(sqlQuery);
    const domain = detectDomain(tables);
    const intent = normalizeIntent(naturalQuery);
    
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
      naturalQuery,
      sqlQuery,
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
 * Retrieve relevant query examples
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
    
    // Try exact intent match first
    const exactKey = `query:${domain}:${intent}`;
    const exact = await client.get(exactKey);
    if (exact) {
      examples.push(JSON.parse(exact));
    }
    
    // If not enough examples, search by domain pattern
    if (examples.length < limit) {
      const keys = await client.keys(`query:${domain}:*`);
      
      // Get all matching queries
      for (const key of keys.slice(0, 10)) { // Limit scan
        if (key !== exactKey) { // Skip if already added
          const value = await client.get(key);
          if (value) {
            examples.push(JSON.parse(value));
          }
        }
        
        if (examples.length >= limit) break;
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
  
  for (const example of examples) {
    prompt += `\n**User Query**: "${example.naturalQuery}"`;
    prompt += `\n**SQL**: \`\`\`sql\n${example.sqlQuery}\n\`\`\``;
    prompt += `\n**Tables Used**: ${example.tables.join(', ')}`;
    prompt += '\n';
  }
  
  prompt += '\nUse these examples as reference for similar queries.\n';
  
  return prompt;
}