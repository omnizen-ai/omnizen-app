/**
 * Detailed Context-Aware Prompts for DeepSeek Models
 * 
 * Philosophy: Start with accuracy, then optimize.
 * Provide complete, correct schema information to ensure queries work.
 */

// ============================================
// COMPLETE SCHEMA WITH CORRECT COLUMN NAMES
// Based on actual Drizzle schema files
// ============================================

export const OMNIZEN_COMPLETE_SCHEMA = `
## OmniZen Database Schema (PostgreSQL)

### Core Tables

**invoices** - Customer invoices
- id: UUID primary key
- organization_id: UUID (required for all queries)
- invoice_number: Text unique identifier
- customer_id: UUID -> contacts.id (NOT contact_id!)
- issue_date: Timestamp (NOT invoice_date!)
- due_date: Timestamp
- status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
- subtotal: Decimal
- tax_amount: Decimal
- total_amount: Decimal
- paid_amount: Decimal (default 0)
- balance_due: Decimal (calculated: total_amount - paid_amount)

**contacts** - Unified customers and vendors
- id: UUID primary key
- organization_id: UUID (required)
- type: 'customer' | 'vendor' | 'customer_vendor' | 'employee' | 'other' (NOT 'both'!)
- company_name: Text (business name - NOT just 'name'!)
- first_name: Text (person's first name)
- last_name: Text (person's last name)
- display_name: Text (preferred display name)
- email: Text
- phone: Text
- credit_limit: Decimal (for customers)
- payment_terms: Integer (days)

**products** - Products and services
- id: UUID primary key
- organization_id: UUID (required)
- sku: Text unique
- name: Text (NOT product_name!)
- description: Text
- is_service: Boolean
- sale_price: Decimal (NOT unit_price!)
- purchase_price: Decimal (NOT cost!)
- quantity_on_hand: Decimal
- reorder_point: Decimal
- is_active: Boolean

**payments** - Payment records
- id: UUID primary key
- organization_id: UUID (required)
- payment_date: Timestamp
- amount: Decimal
- payment_method: Text
- reference_number: Text
- invoice_id: UUID -> invoices.id (optional)
- bill_id: UUID -> bills.id (optional)

**bills** - Vendor bills
- id: UUID primary key
- organization_id: UUID (required)
- bill_number: Text
- vendor_id: UUID -> contacts.id (where contact_type='vendor')
- bill_date: Timestamp
- due_date: Timestamp
- total_amount: Decimal
- paid_amount: Decimal
- status: Text

**chart_of_accounts** - GL accounts
- id: UUID primary key
- organization_id: UUID (required)
- account_code: Text unique
- account_name: Text
- account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
- parent_account_id: UUID (self-reference for sub-accounts)
- current_balance: Decimal

**warehouses** - Inventory locations
- id: UUID primary key
- organization_id: UUID (required)
- warehouse_name: Text
- location: Text
- is_default: Boolean

**inventory_levels** - Stock per warehouse
- id: UUID primary key
- product_id: UUID -> products.id
- warehouse_id: UUID -> warehouses.id
- quantity_on_hand: Decimal
- quantity_reserved: Decimal

**sales_orders** - Customer orders
- id: UUID primary key
- organization_id: UUID (required)
- order_number: Text
- customer_id: UUID -> contacts.id
- order_date: Timestamp
- expected_delivery: Timestamp
- status: Text
- total_amount: Decimal

**purchase_orders** - Vendor orders
- id: UUID primary key
- organization_id: UUID (required)
- order_number: Text
- vendor_id: UUID -> contacts.id
- order_date: Timestamp
- expected_delivery: Timestamp
- status: Text
- total_amount: Decimal

### CRITICAL RULES

1. **ALWAYS include organization_id in WHERE clause**
2. **Column names are snake_case in database**
3. **Use correct foreign key names (customer_id NOT contact_id)**
4. **Join tables have table-prefixed names when ambiguous**
5. **Date columns vary: issue_date, bill_date, payment_date (NOT always 'date')**

### Common Query Patterns

**Find Customer by Name:**
\`\`\`sql
SELECT id, company_name, display_name, email 
FROM contacts 
WHERE organization_id = ? 
  AND type IN ('customer', 'customer_vendor')
  AND (company_name ILIKE '%search_term%' 
       OR display_name ILIKE '%search_term%')
\`\`\`

**Get Invoice with Customer Name:**
\`\`\`sql
SELECT 
  i.id,
  i.invoice_number,
  i.issue_date,
  i.due_date,
  COALESCE(c.company_name, c.display_name) AS customer_name,
  i.total_amount,
  i.paid_amount,
  (i.total_amount - i.paid_amount) AS balance_due,
  i.status
FROM invoices i
JOIN contacts c ON i.customer_id = c.id
WHERE i.organization_id = ?
  AND i.invoice_number = ?
\`\`\`

**Calculate Revenue:**
\`\`\`sql
SELECT 
  SUM(total_amount) AS total_revenue,
  SUM(paid_amount) AS collected_revenue,
  SUM(total_amount - paid_amount) AS outstanding
FROM invoices
WHERE organization_id = ?
  AND status = 'paid'
  AND issue_date >= ?
\`\`\`

**Check Low Stock:**
\`\`\`sql
SELECT 
  p.name AS product_name,
  p.sku,
  il.quantity_on_hand,
  p.reorder_point,
  (p.reorder_point - il.quantity_on_hand) AS units_to_order
FROM products p
JOIN inventory_levels il ON p.id = il.product_id
WHERE p.organization_id = ?
  AND il.quantity_on_hand < p.reorder_point
  AND p.is_active = true
ORDER BY (p.reorder_point - il.quantity_on_hand) DESC
\`\`\`

**Aged Receivables:**
\`\`\`sql
SELECT 
  COALESCE(c.company_name, c.display_name) AS customer_name,
  i.invoice_number,
  i.issue_date,
  i.due_date,
  (i.total_amount - i.paid_amount) AS balance_due,
  CURRENT_DATE - i.due_date AS days_overdue,
  CASE 
    WHEN CURRENT_DATE - i.due_date <= 30 THEN 'Current'
    WHEN CURRENT_DATE - i.due_date <= 60 THEN '30 days'
    WHEN CURRENT_DATE - i.due_date <= 90 THEN '60 days'
    ELSE 'Over 90 days'
  END AS aging_bucket
FROM invoices i
JOIN contacts c ON i.customer_id = c.id
WHERE i.organization_id = ?
  AND i.status != 'paid'
  AND (i.total_amount - i.paid_amount) > 0
ORDER BY days_overdue DESC
\`\`\`
`;

// ============================================
// QUERY-SPECIFIC CONTEXTS
// ============================================

export const CONTEXT_BY_INTENT = {
  invoice: `
### Invoice Operations
Table: invoices
Key columns: invoice_number, customer_id (FK to contacts), issue_date, due_date, total_amount, paid_amount
Always JOIN with contacts to show customer name.
Balance due = total_amount - paid_amount
`,
  
  customer: `
### Customer Operations
Table: contacts WHERE type IN ('customer', 'customer_vendor')
Key columns: company_name, display_name, first_name, last_name, email, phone, credit_limit, payment_terms
Use COALESCE(company_name, display_name) for customer name display
Related: invoices.customer_id, sales_orders.customer_id
`,
  
  vendor: `
### Vendor Operations
Table: contacts WHERE type IN ('vendor', 'customer_vendor')
Key columns: company_name, display_name, email, phone, payment_terms
Use COALESCE(company_name, display_name) for vendor name display
Related: bills.vendor_id, purchase_orders.vendor_id
`,
  
  inventory: `
### Inventory Operations
Tables: products, inventory_levels, warehouses
products: name (NOT product_name!), sku, sale_price, quantity_on_hand, reorder_point
inventory_levels: product_id, warehouse_id, quantity_on_hand, quantity_reserved
`,
  
  financial: `
### Financial Operations
Tables: chart_of_accounts, journal_entries, payments
chart_of_accounts: account_code, account_name, account_type, current_balance
payments: payment_date, amount, payment_method, invoice_id, bill_id
`
};

// ============================================
// MAIN PROMPT BUILDER
// ============================================

export function getDeepSeekDetailedPrompt(
  queryType: string,
  userQuery?: string
): string {
  // Base instruction
  let prompt = `You are Omni, an AI Business Assistant with direct database access.

<process>
[Put ALL internal thinking, planning, and SQL construction here]
</process>

[Put ONLY the final answer/results here]

CRITICAL RULES:
1. ALWAYS escape dollar signs: \\$100 not $100
2. ALWAYS include organization_id in WHERE clauses
3. Use exact column names from schema (snake_case)
4. Check column names carefully - they vary by table

`;

  // Add complete schema for now (we'll optimize later)
  prompt += OMNIZEN_COMPLETE_SCHEMA;
  
  // Add intent-specific context if detected
  if (userQuery) {
    const query = userQuery.toLowerCase();
    if (query.includes('invoice')) {
      prompt += CONTEXT_BY_INTENT.invoice;
    } else if (query.includes('customer')) {
      prompt += CONTEXT_BY_INTENT.customer;
    } else if (query.includes('vendor') || query.includes('supplier')) {
      prompt += CONTEXT_BY_INTENT.vendor;
    } else if (query.includes('inventory') || query.includes('stock') || query.includes('product')) {
      prompt += CONTEXT_BY_INTENT.inventory;
    } else if (query.includes('revenue') || query.includes('expense') || query.includes('profit')) {
      prompt += CONTEXT_BY_INTENT.financial;
    }
  }
  
  // Add tools reminder
  prompt += `

## Available Database Tools:
- dbRead: Execute SELECT queries
- dbWrite: Execute INSERT/UPDATE/DELETE (with safety checks)
- schemaInfo: Get table structure details
- viewsList: List pre-built semantic views
- explainQuery: Analyze query performance

Remember: Column names in queries must match EXACTLY. Check the schema above.

Note: You may see "Recent Successful Queries" examples below this section.
These are real queries that worked previously - use them as reference patterns.`;
  
  return prompt;
}

// ============================================
// ERROR RECOVERY PROMPTS
// ============================================

export const ERROR_RECOVERY = {
  column_not_found: `
The column name was incorrect. Check the schema:
- invoices has: customer_id (NOT contact_id), issue_date (NOT invoice_date)
- products has: name (NOT product_name), sale_price (NOT unit_price)
- contacts has: company_name, display_name (NOT just 'name'), type (NOT contact_type)
- Use COALESCE(company_name, display_name) to get customer/vendor name
- Use issue_date/bill_date/payment_date (NOT just 'date')
`,
  
  ambiguous_column: `
Column is ambiguous in JOIN. Use table prefix:
- i.organization_id (for invoices)
- c.organization_id (for contacts)
- p.organization_id (for products)
`,
  
  missing_org_filter: `
ALWAYS include organization_id in WHERE clause:
WHERE organization_id = ? AND ...
`
};

// ============================================
// TESTING HELPERS
// ============================================

export function testPromptSize(userQuery?: string): void {
  const prompt = getDeepSeekDetailedPrompt('business', userQuery);
  const tokens = prompt.length / 4; // Rough estimate: 1 token ≈ 4 chars
  
  console.log(`[Prompt Analysis]`);
  console.log(`- Characters: ${prompt.length}`);
  console.log(`- Estimated tokens: ${Math.round(tokens)}`);
  console.log(`- Cost (DeepSeek): $${(tokens * 0.14 / 1000000).toFixed(6)}`);
  
  // Show what sections were included
  const sections = [];
  if (prompt.includes('## OmniZen Database Schema')) sections.push('Full Schema');
  if (prompt.includes('### Invoice Operations')) sections.push('Invoice Context');
  if (prompt.includes('### Customer Operations')) sections.push('Customer Context');
  if (prompt.includes('### Inventory Operations')) sections.push('Inventory Context');
  
  console.log(`- Sections: ${sections.join(', ')}`);
}