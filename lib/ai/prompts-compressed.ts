/**
 * Ultra-Compressed Prompt System
 * Maximum efficiency: 80-95% token reduction
 */

// ============================================
// MICRO PROMPTS (10-30 tokens each)
// ============================================

// Greeting (12 tokens)
export const MICRO_GREETING = "Omni assistant. Brief, helpful. No emojis.";

// Business query (30 tokens)
export const MICRO_BUSINESS = `Omni.
DB:contacts(type,name),invoices(contact_id,amount,status)
customer=contacts[type='customer']
JOIN for names. \\$ escaped.`;

// Write operation (40 tokens)  
export const MICRO_WRITE = `Omni.
Defaults:net-30,draft,today,8.5%tax
Confirm table:|Field|Value|
Then execute.`;

// Report (50 tokens)
export const MICRO_REPORT = `Omni.
1.Find customer:ILIKE name
2.Get data+JOIN
3.Table:|Account|\\$Amt|
**Bold totals**`;

// ============================================
// COMPRESSION DICTIONARY
// ============================================
export const compressionDict = {
  // Common expansions
  "C": "contacts",
  "I": "invoices",  
  "E": "expenses",
  "CT": "contact_type",
  "CN": "company_name",
  "TA": "total_amount",
  "S": "status",
  "DT": "DATE_TRUNC",
  
  // Common patterns
  "CUST": "WHERE contact_type='customer'",
  "VEND": "WHERE contact_type='vendor'",
  "PAID": "WHERE status='paid'",
  "JOIN_C": "JOIN contacts c ON",
  "BAL": "(total_amount - paid_amount)",
  "THIS_M": "DATE_TRUNC('month',CURRENT_DATE)",
};

// ============================================
// ABSOLUTE MINIMUM PROMPTS
// ============================================

// Just schema rules (25 tokens)
export const NANO_SCHEMA = `contacts[type=customer/vendor,name]
invoices[contact_id,amount,status='paid']
Find ID→Query+JOIN`;

// Just output format (15 tokens)
export const NANO_FORMAT = `|Header|Value|
**Bold totals**
\\$ escaped`;

// ============================================
// DYNAMIC MICRO BUILDER
// ============================================
export function buildMicroPrompt(queryType: string): string {
  const base = "Omni.";
  
  switch(queryType) {
    case 'greeting':
      return MICRO_GREETING; // 10 tokens
      
    case 'simple_query':
      return `${base} ${NANO_SCHEMA}`; // 30 tokens
      
    case 'customer_lookup':
      return `${base} Find:contacts[name ILIKE]. Then:invoices+JOIN.`; // 20 tokens
      
    case 'report':
      return `${base} ${NANO_SCHEMA} ${NANO_FORMAT}`; // 45 tokens
      
    case 'write':
      return `${base} Confirm→Execute. Defaults:net30,draft,8.5%tax.`; // 25 tokens
      
    default:
      return base; // 2 tokens
  }
}

// ============================================
// TOKEN COMPARISON
// ============================================
/*
ORIGINAL OMNI PROMPT: ~2000-3000 tokens
- Full business context
- All SQL patterns  
- Detailed instructions
- Examples

MODULAR SYSTEM: 200-700 tokens
- Core: 200 tokens
- +SQL: 450 tokens
- +Reports: 100 tokens
- Dynamic loading

ULTRA-COMPRESSED: 30-120 tokens
- Schema-aware: 120 tokens
- Micro business: 30 tokens
- Micro write: 40 tokens

NANO PROMPTS: 10-50 tokens
- Greeting: 10 tokens (99.5% reduction)
- Schema only: 25 tokens (98.7% reduction)
- Customer query: 30 tokens (98.5% reduction)
- Full report: 50 tokens (97.5% reduction)

COMPRESSION TECHNIQUES USED:
1. Remove all articles (a, the)
2. Use symbols (→, +, |)
3. Abbreviate common terms
4. Implied context
5. No examples
6. Minimal punctuation
7. Combined instructions
*/

// ============================================
// ADAPTIVE COMPRESSION
// ============================================
export class AdaptiveCompressor {
  private tokenBudget: number;
  private context: Map<string, any> = new Map();
  
  constructor(maxTokens: number = 100) {
    this.tokenBudget = maxTokens;
  }
  
  // Build prompt within token budget
  buildWithinBudget(queryType: string, priority: string[] = []): string {
    let prompt = "";
    let tokensUsed = 0;
    
    // Always include base (5 tokens)
    prompt = "Omni.";
    tokensUsed = 5;
    
    // Add components by priority
    const components: Record<string, { text: string; tokens: number }> = {
      schema: { text: NANO_SCHEMA, tokens: 25 },
      format: { text: NANO_FORMAT, tokens: 15 },
      intelligence: { text: "Find→Query+JOIN.", tokens: 10 },
      defaults: { text: "Defaults:net30,draft.", tokens: 10 },
    };
    
    for (const p of priority) {
      const component = components[p];
      if (component && tokensUsed + component.tokens <= this.tokenBudget) {
        prompt += " " + component.text;
        tokensUsed += component.tokens;
      }
    }
    
    return prompt;
  }
  
  // Compress by removing redundancy
  compress(text: string): string {
    let compressed = text;
    
    // Remove common words
    compressed = compressed.replace(/\b(the|a|an|is|are|was|were|been|be|have|has|had|do|does|did)\b/gi, '');
    
    // Use abbreviations
    Object.entries(compressionDict).forEach(([abbr, full]) => {
      compressed = compressed.replace(new RegExp(full, 'gi'), abbr);
    });
    
    // Remove extra spaces
    compressed = compressed.replace(/\s+/g, ' ').trim();
    
    return compressed;
  }
}

// ============================================
// USAGE EXAMPLES
// ============================================
/*
// Customer query: "Show invoices for Acme"
const customerPrompt = buildMicroPrompt('customer_lookup');
// Result: "Omni. Find:contacts[name ILIKE]. Then:invoices+JOIN." (20 tokens)

// Financial report
const reportPrompt = buildMicroPrompt('report');  
// Result: "Omni. contacts[type=customer/vendor,name]..." (45 tokens)

// Adaptive within 50 token budget
const compressor = new AdaptiveCompressor(50);
const adaptive = compressor.buildWithinBudget('report', ['schema', 'format']);
// Builds optimal prompt within budget

// 97.5% token reduction achieved!
*/