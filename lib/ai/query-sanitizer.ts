/**
 * Query Sanitizer for Redis Storage
 * Removes all sensitive data before storing queries
 */

/**
 * Sanitize SQL queries by replacing sensitive data with placeholders
 */
export function sanitizeSQLQuery(sql: string): string {
  if (!sql) return '';
  
  return sql
    // Replace all UUIDs with placeholders
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '{{uuid}}')
    
    // Replace organization_id patterns
    .replace(/organization_id\s*=\s*'[^']+'/gi, "organization_id = '{{org_id}}'")
    .replace(/organization_id\s*=\s*"[^"]+"/gi, 'organization_id = "{{org_id}}"')
    .replace(/o\.organization_id\s*=\s*'[^']+'/gi, "o.organization_id = '{{org_id}}'")
    
    // Replace user_id patterns
    .replace(/user_id\s*=\s*'[^']+'/gi, "user_id = '{{user_id}}'")
    .replace(/created_by\s*=\s*'[^']+'/gi, "created_by = '{{user_id}}'")
    .replace(/updated_by\s*=\s*'[^']+'/gi, "updated_by = '{{user_id}}'")
    
    // Replace customer/vendor/contact IDs
    .replace(/customer_id\s*=\s*'[^']+'/gi, "customer_id = '{{customer_id}}'")
    .replace(/vendor_id\s*=\s*'[^']+'/gi, "vendor_id = '{{vendor_id}}'")
    .replace(/contact_id\s*=\s*'[^']+'/gi, "contact_id = '{{contact_id}}'")
    
    // Replace email patterns
    .replace(/[\w\.-]+@[\w\.-]+\.\w+/g, '{{email}}')
    
    // Replace ILIKE/LIKE patterns with sensitive data
    .replace(/ILIKE\s+'%[^%']+%'/gi, "ILIKE '%{{search_term}}%'")
    .replace(/LIKE\s+'%[^%']+%'/gi, "LIKE '%{{search_term}}%'")
    
    // Replace IN clause values
    .replace(/IN\s*\([^)]+\)/gi, "IN ({{values}})")
    
    // Replace specific string values in WHERE clauses (but keep column names)
    .replace(/(WHERE|AND|OR)\s+(\w+\.)?(\w+)\s*=\s*'[^']+'/gi, 
            (match, condition, table, column) => 
            `${condition} ${table || ''}${column} = '{{${column}_value}}'`)
    
    // Replace date values
    .replace(/'\d{4}-\d{2}-\d{2}'/g, "'{{date}}'")
    .replace(/'\d{4}-\d{2}-\d{2}T[\d:.]+Z?'/gi, "'{{datetime}}'")
    
    // Clean up any remaining sensitive numeric IDs (but keep table structure)
    .replace(/=\s*\d{6,}/g, "= {{numeric_id}}");
}

/**
 * Sanitize natural language queries by removing personal/company data
 */
export function sanitizeNaturalQuery(query: string): string {
  if (!query) return '';
  
  // Limit processing for very large inputs to prevent performance issues
  const MAX_PROCESS_LENGTH = 1000;
  const processQuery = query.length > MAX_PROCESS_LENGTH 
    ? query.substring(0, MAX_PROCESS_LENGTH) 
    : query;
  
  // First, extract the core action/intent
  let sanitized = processQuery.toLowerCase();
  
  // Remove UUIDs first (before phone number detection)
  sanitized = sanitized.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '{{id}}');
  
  // Remove email addresses
  sanitized = sanitized.replace(/[\w\.-]+@[\w\.-]+\.\w+/g, '{{email}}');
  
  // Remove phone numbers (but not parts of UUIDs which are already replaced)
  sanitized = sanitized.replace(/[\+]?[(]?\d{1,4}[)]?[-\s\.]?\d{1,4}[-\s\.]?\d{1,4}[-\s\.]?\d{1,6}/g, '{{phone}}');
  
  // Remove addresses (common patterns)
  sanitized = sanitized
    .replace(/\b(house|apt|apartment|suite|unit|building)\s+\w+/gi, '{{address}}')
    .replace(/\b(road|street|avenue|ave|blvd|boulevard|lane|drive|court|place)\s+[\w\s,]+/gi, '{{address}}')
    .replace(/\b\d{5}(-\d{4})?\b/g, '{{postal_code}}'); // US ZIP codes
  
  // Remove company names (common patterns)
  sanitized = sanitized
    .replace(/\b[\w\s]+(limited|ltd|inc|incorporated|corp|corporation|llc|company|co)\b/gi, '{{company}}')
    .replace(/\b[\w\s]+(technology|technologies|tech|software|systems|solutions)\b/gi, '{{company}}');
  
  // Remove specific business names that might appear
  const businessTerms = [
    'anchorblock', 'bkash', 'techcorp', 'acme', 'contoso'
  ];
  businessTerms.forEach(term => {
    sanitized = sanitized.replace(new RegExp(`\\b${term}\\b`, 'gi'), '{{company}}');
  });
  
  // Remove personal names (heuristic - capitalize words that aren't common terms)
  // This is imperfect but helps remove obvious names
  sanitized = sanitized.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '{{name}}');
  
  // Remove long numbers (account numbers, IDs, etc.) but not years
  sanitized = sanitized.replace(/\b\d{6,}\b/g, '{{number}}');
  // Keep years but remove other 4-digit numbers that might be sensitive
  sanitized = sanitized.replace(/\b(?!19\d{2}|20\d{2})\d{4}\b/g, '{{number}}');
  
  // Remove currency amounts but keep the action
  sanitized = sanitized.replace(/\$[\d,]+\.?\d*/g, '{{amount}}');
  sanitized = sanitized.replace(/\b\d+\s*(usd|bdt|eur|gbp|inr)\b/gi, '{{amount}}');
  
  // Clean up multiple spaces and trim
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  // If the query became too generic, at least keep the core intent
  if (sanitized.length < 10 || sanitized === '{{company}}') {
    // Try to extract just the action words
    const actionWords = query.match(/\b(show|list|get|find|create|add|update|delete|calculate|total|sum|report|analyze|audit|setup|configure)\b/gi);
    const entityWords = query.match(/\b(invoice|bill|payment|customer|vendor|product|inventory|revenue|expense|account|report|books|chart|balance|statement)\b/gi);
    
    if (actionWords || entityWords) {
      sanitized = [...(actionWords || []), ...(entityWords || [])].join(' ').toLowerCase();
    }
  }
  
  return sanitized;
}

/**
 * Extract just the query structure/pattern without any values
 * This is even more aggressive sanitization for pattern matching
 */
export function extractQueryPattern(sql: string): string {
  if (!sql) return '';
  
  return sql
    // Replace all string literals
    .replace(/'[^']*'/g, '?')
    // Replace all numbers
    .replace(/\b\d+\.?\d*\b/g, '?')
    // Replace UUIDs
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '?')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if a query contains sensitive data that shouldn't be stored
 */
export function containsSensitiveData(text: string): boolean {
  // Check for obvious PII patterns
  const patterns = [
    /[\w\.-]+@[\w\.-]+\.\w+/, // Email
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{16}\b/, // Credit card
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i, // UUID
  ];
  
  return patterns.some(pattern => pattern.test(text));
}