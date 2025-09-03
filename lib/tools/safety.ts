/**
 * SQL Safety and Validation Layer
 * Prevents SQL injection, enforces RLS, and blocks dangerous operations
 */

interface UserContext {
  userId: string;
  orgId: string;
  workspaceId?: string;
  role: string;
}

interface ValidationResult {
  safe: boolean;
  error?: string;
  needsConfirmation?: boolean;
  sanitizedQuery?: string;
}

// Dangerous patterns that should be blocked
const FORBIDDEN_PATTERNS = [
  /\bDROP\s+(TABLE|DATABASE|SCHEMA|VIEW|INDEX)\b/i,
  /\bTRUNCATE\b/i,
  /\bALTER\s+(TABLE|DATABASE|SCHEMA)\b/i,
  /\bCREATE\s+(DATABASE|SCHEMA|USER|ROLE)\b/i,
  /\bGRANT\b/i,
  /\bREVOKE\b/i,
  /\bEXEC(UTE)?\b/i,
  /\bxp_cmdshell\b/i,
  /\bINTO\s+OUTFILE\b/i,
  /\bLOAD_FILE\b/i,
];

// Patterns that need confirmation
const CONFIRMATION_PATTERNS = [
  /\bDELETE\s+FROM\b/i,
  /\bUPDATE\b.*\bSET\b/i,
  /\bINSERT\s+INTO\b.*\bSELECT\b/i, // Bulk insert
];

// Patterns that indicate missing WHERE clause (dangerous)
const UNSAFE_MUTATIONS = [
  /^\s*DELETE\s+FROM\s+\w+\s*;?\s*$/i, // DELETE without WHERE
  /^\s*UPDATE\s+\w+\s+SET\s+[^;]*$/i, // UPDATE without WHERE (no WHERE before end)
];

/**
 * Validate SQL query for safety
 */
export async function validateSQL(
  query: string,
  operationType: 'read' | 'write'
): Promise<ValidationResult> {
  // Remove comments to prevent comment-based injection
  const cleanQuery = removeComments(query);

  // Check for forbidden operations
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(cleanQuery)) {
      return {
        safe: false,
        error: `Forbidden operation detected: ${pattern.source}`,
      };
    }
  }

  // Check for unsafe mutations (missing WHERE clause)
  if (operationType === 'write') {
    // Check DELETE and UPDATE specifically
    if (/^\s*DELETE\s+FROM/i.test(cleanQuery) && !/\bWHERE\b/i.test(cleanQuery)) {
      return {
        safe: false,
        error: 'Unsafe mutation: DELETE without WHERE clause. This would affect all rows.',
      };
    }
    
    if (/^\s*UPDATE\s+/i.test(cleanQuery) && !/\bWHERE\b/i.test(cleanQuery)) {
      return {
        safe: false,
        error: 'Unsafe mutation: UPDATE without WHERE clause. This would affect all rows.',
      };
    }

    // Check if confirmation is needed
    for (const pattern of CONFIRMATION_PATTERNS) {
      if (pattern.test(cleanQuery)) {
        return {
          safe: true,
          needsConfirmation: true,
        };
      }
    }
  }

  // Check for SQL injection patterns
  if (hasSQLInjectionRisk(cleanQuery)) {
    return {
      safe: false,
      error: 'Potential SQL injection detected',
    };
  }

  // Validate query structure
  if (!isValidSQLStructure(cleanQuery, operationType)) {
    return {
      safe: false,
      error: 'Invalid SQL structure',
    };
  }

  return {
    safe: true,
    sanitizedQuery: cleanQuery,
  };
}

/**
 * Add RLS context to query
 */
export function sanitizeSQL(query: string, context: UserContext): string {
  let sanitized = removeComments(query);

  // For SELECT queries, ensure org_id filtering
  if (/^\s*SELECT/i.test(sanitized)) {
    sanitized = addRLSToSelect(sanitized, context);
  }

  // For INSERT queries, add org_id
  if (/^\s*INSERT/i.test(sanitized)) {
    sanitized = addRLSToInsert(sanitized, context);
  }

  // For UPDATE/DELETE, ensure WHERE clause includes org_id
  if (/^\s*(UPDATE|DELETE)/i.test(sanitized)) {
    sanitized = addRLSToMutation(sanitized, context);
  }

  return sanitized;
}

/**
 * Remove SQL comments to prevent injection
 */
function removeComments(query: string): string {
  // Remove -- comments
  let cleaned = query.replace(/--.*$/gm, '');
  
  // Remove /* */ comments
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  
  return cleaned.trim();
}

/**
 * Check for SQL injection patterns
 */
function hasSQLInjectionRisk(query: string): boolean {
  const injectionPatterns = [
    /;\s*DROP/i,
    /;\s*DELETE/i,
    /;\s*UPDATE/i,
    /;\s*INSERT/i,
    /UNION\s+SELECT/i,
    /OR\s+1\s*=\s*1/i,
    /OR\s+'1'\s*=\s*'1'/i,
    /\bSLEEP\s*\(/i,
    /\bBENCHMARK\s*\(/i,
    /\bWAITFOR\s+DELAY/i,
  ];

  return injectionPatterns.some(pattern => pattern.test(query));
}

/**
 * Validate basic SQL structure
 */
function isValidSQLStructure(query: string, operationType: 'read' | 'write'): boolean {
  if (operationType === 'read') {
    // Must start with SELECT
    return /^\s*SELECT/i.test(query);
  } else {
    // Must start with INSERT, UPDATE, or DELETE
    return /^\s*(INSERT|UPDATE|DELETE)/i.test(query);
  }
}

/**
 * Add RLS filtering to SELECT queries
 */
function addRLSToSelect(query: string, context: UserContext): string {
  // Check if query already has WHERE clause
  const hasWhere = /\bWHERE\b/i.test(query);
  
  // Tables that need RLS filtering
  const rlsTables = [
    'invoices', 'customers', 'products', 'orders', 'payments',
    'warehouses', 'inventory_levels', 'chart_of_accounts',
  ];
  
  // Check if query references any RLS tables and get the main table
  let mainTable = '';
  for (const table of rlsTables) {
    if (new RegExp(`\\b${table}\\b`, 'i').test(query)) {
      mainTable = table;
      break;
    }
  }
  
  if (!mainTable) {
    return query;
  }

  // Get table alias if it exists (e.g., "FROM invoices i" -> alias is "i")
  const aliasMatch = query.match(new RegExp(`\\b${mainTable}\\s+(\\w+)\\b`, 'i'));
  const tableRef = aliasMatch ? aliasMatch[1] : mainTable;

  // Add organization_id filter with proper table reference
  if (hasWhere) {
    // Add to existing WHERE clause
    return query.replace(
      /\bWHERE\b/i,
      `WHERE ${tableRef}.organization_id = '${context.orgId}' AND `
    );
  } else {
    // Add new WHERE clause before GROUP BY, ORDER BY, or LIMIT
    const insertPoint = query.search(/\b(GROUP BY|ORDER BY|LIMIT)\b/i);
    
    if (insertPoint > -1) {
      return (
        query.slice(0, insertPoint) +
        `WHERE ${tableRef}.organization_id = '${context.orgId}' ` +
        query.slice(insertPoint)
      );
    } else {
      // Add at the end
      return `${query} WHERE ${tableRef}.organization_id = '${context.orgId}'`;
    }
  }
}

/**
 * Add RLS context to INSERT queries
 */
function addRLSToInsert(query: string, context: UserContext): string {
  // Check if organization_id is already in the query
  if (/\borganization_id\b/i.test(query)) {
    return query;
  }

  // Add organization_id to INSERT column list and values
  const insertMatch = query.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
  
  if (insertMatch) {
    const [fullMatch, table, columns, values] = insertMatch;
    const newColumns = `${columns}, organization_id`;
    const newValues = `${values}, '${context.orgId}'`;
    
    return query.replace(
      fullMatch,
      `INSERT INTO ${table} (${newColumns}) VALUES (${newValues})`
    );
  }
  
  return query;
}

/**
 * Add RLS filtering to UPDATE/DELETE queries
 */
function addRLSToMutation(query: string, context: UserContext): string {
  // Check if WHERE clause exists
  const hasWhere = /\bWHERE\b/i.test(query);
  
  if (!hasWhere) {
    // This should have been caught by validation, but add as safety
    return `${query} WHERE organization_id = '${context.orgId}'`;
  }
  
  // Check if organization_id is already in WHERE clause
  if (/\borganization_id\b/i.test(query)) {
    return query;
  }
  
  // Add organization_id to WHERE clause
  return query.replace(
    /\bWHERE\b/i,
    `WHERE organization_id = '${context.orgId}' AND `
  );
}

/**
 * Escape string values to prevent injection
 */
export function escapeString(value: string): string {
  // PostgreSQL string escaping
  return value.replace(/'/g, "''");
}

/**
 * Validate and sanitize table/column names
 */
export function sanitizeIdentifier(identifier: string): string {
  // Only allow alphanumeric, underscore, and dot (for schema.table)
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?$/.test(identifier)) {
    throw new Error(`Invalid identifier: ${identifier}`);
  }
  return identifier;
}

/**
 * Build safe WHERE clause from conditions
 */
export function buildWhereClause(
  conditions: Record<string, any>,
  context: UserContext
): string {
  const clauses: string[] = [`organization_id = '${context.orgId}'`];
  
  for (const [key, value] of Object.entries(conditions)) {
    const sanitizedKey = sanitizeIdentifier(key);
    
    if (value === null) {
      clauses.push(`${sanitizedKey} IS NULL`);
    } else if (typeof value === 'string') {
      clauses.push(`${sanitizedKey} = '${escapeString(value)}'`);
    } else if (typeof value === 'number') {
      clauses.push(`${sanitizedKey} = ${value}`);
    } else if (typeof value === 'boolean') {
      clauses.push(`${sanitizedKey} = ${value}`);
    } else if (Array.isArray(value)) {
      const escaped = value.map(v => 
        typeof v === 'string' ? `'${escapeString(v)}'` : v
      ).join(', ');
      clauses.push(`${sanitizedKey} IN (${escaped})`);
    }
  }
  
  return clauses.join(' AND ');
}