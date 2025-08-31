/**
 * Modular Prompt System for Token Optimization
 * Reduces token usage by 60-80% through conditional loading
 */

// ============================================
// MINIMAL BASE PROMPT (50 tokens)
// ============================================
export const minimalPrompt = `You are Omni, a business assistant. Be concise and helpful.`;

// ============================================
// COMPRESSED CORE BUSINESS PROMPT (200 tokens)
// ============================================
export const coreBusinessPrompt = `You are Omni, AI Business Partner. Executive & concise.

CAPABILITIES: Read/write business data. Never expose technical details.

OUTPUT FORMAT:
1. Summary (2 bullets)
2. Data (markdown tables)
3. Decision & next steps

TOOLS: Use db_* for data ops. Format numbers with $, use commas.`;

// ============================================
// SQL PATTERNS - LOAD ONLY WHEN NEEDED (300 tokens)
// ============================================
export const sqlPatterns = `
SQL TEMPLATES:
- Revenue: SELECT SUM(total_amount) FROM invoices WHERE status='paid' AND {period}
- Customers: SELECT * FROM contacts WHERE contact_type='customer'
- Balance: SELECT account_type, SUM(balance) FROM chart_of_accounts GROUP BY account_type
- Expenses: SELECT ca.account_name, SUM(e.amount) FROM expenses e JOIN chart_of_accounts ca
`;

// ============================================
// DATA ENTRY MODULE (150 tokens)
// ============================================
export const dataEntryPrompt = `
DATA ENTRY:
Defaults: net-30 terms, draft status, today's date, 8.5% tax
Show confirmation table before executing:
| Field | Value | Source |
Require: name, amount, date`;

// ============================================
// REPORT FORMATTING MODULE (100 tokens)
// ============================================
export const reportFormattingPrompt = `
REPORTS: Parse <report_data> JSON, format as tables:
| Account | Balance |
|---------|--------:|
Use bold for totals: **Total**`;

// ============================================
// DYNAMIC PROMPT BUILDER
// ============================================
export interface PromptConfig {
  useMinimal?: boolean;
  includeSQL?: boolean;
  includeDataEntry?: boolean;
  includeReportFormatting?: boolean;
  queryType?: 'simple' | 'business' | 'report' | 'write';
}

export function buildOptimizedPrompt(config: PromptConfig): string {
  // For simple queries, use minimal prompt (50 tokens)
  if (config.useMinimal || config.queryType === 'simple') {
    return minimalPrompt;
  }

  // Start with core business prompt (200 tokens)
  let prompt = coreBusinessPrompt;

  // Add modules only when needed
  if (config.includeSQL || config.queryType === 'report') {
    prompt += sqlPatterns; // +300 tokens
  }

  if (config.includeDataEntry || config.queryType === 'write') {
    prompt += dataEntryPrompt; // +150 tokens
  }

  if (config.includeReportFormatting || config.queryType === 'report') {
    prompt += reportFormattingPrompt; // +100 tokens
  }

  return prompt;
}

// ============================================
// QUERY CLASSIFIER
// ============================================
export function classifyQuery(message: string): PromptConfig {
  const lower = message.toLowerCase();
  
  // Simple greeting or general question (50 tokens)
  if (lower.match(/^(hi|hello|hey|thanks|bye|what is|how do|can you)/)) {
    return { useMinimal: true, queryType: 'simple' };
  }
  
  // Financial reports (600 tokens)
  if (lower.includes('report') || lower.includes('balance sheet') || 
      lower.includes('income statement') || lower.includes('revenue')) {
    return { 
      queryType: 'report',
      includeSQL: true,
      includeReportFormatting: true
    };
  }
  
  // Data entry/write operations (350 tokens)
  if (lower.match(/\b(create|add|new|insert|update|edit)\b/)) {
    return { 
      queryType: 'write',
      includeDataEntry: true
    };
  }
  
  // General business queries (200 tokens)
  return { queryType: 'business' };
}

// ============================================
// PROMPT COMPRESSION UTILITIES
// ============================================
export function compressPrompt(prompt: string): string {
  return prompt
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Remove comments
    .replace(/\/\*.*?\*\//g, '')
    .replace(/\/\/.*/g, '')
    // Remove empty lines
    .replace(/\n\s*\n/g, '\n')
    // Trim
    .trim();
}

// ============================================
// TOKEN ESTIMATION
// ============================================
export function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

// ============================================
// CACHED PROMPTS FOR COMMON QUERIES
// ============================================
export const cachedPrompts = new Map<string, string>([
  ['greeting', minimalPrompt],
  ['balance_sheet', buildOptimizedPrompt({ queryType: 'report' })],
  ['add_invoice', buildOptimizedPrompt({ queryType: 'write' })],
  ['list_customers', coreBusinessPrompt],
]);

// ============================================
// EXAMPLE USAGE
// ============================================
/*
// Simple query: "Hi, how are you?" → 50 tokens
const simplePrompt = buildOptimizedPrompt(classifyQuery("Hi, how are you?"));

// Report query: "Show me the balance sheet" → 600 tokens (vs 2000+ original)
const reportPrompt = buildOptimizedPrompt(classifyQuery("Show me the balance sheet"));

// Write query: "Add a new invoice" → 350 tokens (vs 2000+ original)
const writePrompt = buildOptimizedPrompt(classifyQuery("Add a new invoice"));

// Token savings: 60-80% reduction for most queries
*/