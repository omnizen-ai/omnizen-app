/**
 * Database Schema Optimizer for Query Accuracy
 * Provides schema awareness and query hints for first-try success
 */

// ============================================
// SCHEMA DOCUMENTATION
// ============================================
export const schemaDocumentation = {
  tables: {
    contacts: {
      description: 'Stores customers and vendors',
      key_fields: {
        contact_type: "ENUM: 'customer', 'vendor', 'both' - CRITICAL for filtering",
        company_name: 'Company name (not "name")',
        email: 'Email address',
        payment_terms: 'Integer days (default 30)',
        credit_limit: 'Decimal(20,2)'
      },
      common_queries: [
        "SELECT * FROM contacts WHERE contact_type='customer'",
        "SELECT * FROM contacts WHERE contact_type='vendor'",
        "SELECT * FROM contacts WHERE email ILIKE '%@example.com%'"
      ]
    },
    
    invoices: {
      description: 'Customer invoices',
      key_fields: {
        invoice_number: 'Unique identifier (not "number")',
        contact_id: 'FK to contacts table',
        status: "ENUM: 'draft', 'sent', 'paid', 'overdue', 'cancelled'",
        total_amount: 'Decimal(20,2) - includes tax',
        paid_amount: 'Decimal(20,2) - amount already paid',
        invoice_date: 'Timestamp',
        due_date: 'Timestamp'
      },
      common_queries: [
        "SELECT i.*, c.company_name FROM invoices i JOIN contacts c ON i.contact_id = c.id WHERE i.status='paid'",
        "SELECT * FROM invoices WHERE due_date < CURRENT_DATE AND status != 'paid'",
        "SELECT SUM(total_amount) FROM invoices WHERE status='paid' AND DATE_TRUNC('month', invoice_date) = DATE_TRUNC('month', CURRENT_DATE)"
      ]
    },
    
    chart_of_accounts: {
      description: 'General ledger accounts',
      key_fields: {
        account_number: 'Unique account code',
        account_name: 'Descriptive name',
        account_type: "ENUM: 'asset', 'liability', 'equity', 'revenue', 'expense'",
        balance: 'Decimal(20,2) - current balance',
        is_active: 'Boolean'
      },
      common_queries: [
        "SELECT * FROM chart_of_accounts WHERE account_type='asset'",
        "SELECT SUM(balance) as total FROM chart_of_accounts WHERE account_type='liability'",
        "SELECT * FROM chart_of_accounts WHERE account_name ILIKE '%cash%'"
      ]
    },
    
    expenses: {
      description: 'Business expenses',
      key_fields: {
        expense_date: 'Timestamp (not "date")',
        vendor_id: 'FK to contacts (vendor)',
        category_account_id: 'FK to chart_of_accounts',
        amount: 'Decimal(20,2)',
        tax_amount: 'Decimal(20,2)',
        payment_method: 'Text field'
      },
      common_queries: [
        "SELECT e.*, c.company_name FROM expenses e LEFT JOIN contacts c ON e.vendor_id = c.id",
        "SELECT SUM(amount) FROM expenses WHERE DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE)",
        "SELECT ca.account_name, SUM(e.amount) FROM expenses e JOIN chart_of_accounts ca ON e.category_account_id = ca.id GROUP BY ca.account_name"
      ]
    },
    
    inventory: {
      description: 'Products and services',
      key_fields: {
        sku: 'Unique product code',
        product_name: 'Product name (not "name")',
        quantity_on_hand: 'Decimal(20,4) - current stock',
        reorder_point: 'Decimal(20,4) - minimum stock',
        selling_price: 'Decimal(20,2)',
        unit_cost: 'Decimal(20,2)',
        is_active: 'Boolean'
      },
      common_queries: [
        "SELECT * FROM inventory WHERE quantity_on_hand <= reorder_point",
        "SELECT * FROM inventory WHERE is_active=true ORDER BY product_name",
        "SELECT * FROM inventory WHERE category='Electronics'"
      ]
    }
  },
  
  // Common JOIN patterns
  join_patterns: {
    invoice_with_customer: `
      SELECT i.*, c.company_name, c.email 
      FROM invoices i 
      JOIN contacts c ON i.contact_id = c.id 
      WHERE c.contact_type='customer'`,
    
    expense_with_vendor: `
      SELECT e.*, v.company_name, ca.account_name as category
      FROM expenses e
      LEFT JOIN contacts v ON e.vendor_id = v.id
      JOIN chart_of_accounts ca ON e.category_account_id = ca.id`,
    
    invoice_with_line_items: `
      SELECT i.*, ili.description, ili.quantity, ili.unit_price
      FROM invoices i
      JOIN invoice_line_items ili ON ili.invoice_id = i.id`
  },
  
  // Critical field mappings
  field_mappings: {
    // What users say → actual field name
    'customer name': 'company_name',
    'vendor name': 'company_name',
    'invoice number': 'invoice_number',
    'invoice amount': 'total_amount',
    'expense amount': 'amount',
    'product name': 'product_name',
    'stock': 'quantity_on_hand',
    'account balance': 'balance',
    'payment terms': 'payment_terms',
    'due date': 'due_date',
    'invoice date': 'invoice_date',
    'expense date': 'expense_date'
  },
  
  // Date handling patterns
  date_patterns: {
    current_month: "DATE_TRUNC('month', CURRENT_DATE) = DATE_TRUNC('month', {date_field})",
    last_month: "DATE_TRUNC('month', {date_field}) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')",
    current_year: "DATE_TRUNC('year', CURRENT_DATE) = DATE_TRUNC('year', {date_field})",
    date_range: "{date_field} BETWEEN '{start_date}' AND '{end_date}'",
    overdue: "{date_field} < CURRENT_DATE"
  }
};

// ============================================
// QUERY OPTIMIZATION HINTS
// ============================================
export const queryOptimizationHints = `
## CRITICAL SCHEMA RULES FOR QUERY ACCURACY:

1. **CONTACTS TABLE**:
   - ALWAYS filter by contact_type='customer' for customers
   - ALWAYS filter by contact_type='vendor' for vendors
   - Use company_name NOT "name"
   - Join with invoices for customer data

2. **INVOICES TABLE**:
   - Status values: 'draft', 'sent', 'paid', 'overdue', 'cancelled' (lowercase, quoted)
   - Use total_amount for invoice value (includes tax)
   - Outstanding = total_amount - paid_amount
   - Always JOIN contacts for customer names

3. **DATE QUERIES**:
   - Current month: DATE_TRUNC('month', CURRENT_DATE) = DATE_TRUNC('month', field)
   - Use timestamp fields: invoice_date, due_date, expense_date
   - Overdue: due_date < CURRENT_DATE AND status != 'paid'

4. **FINANCIAL CALCULATIONS**:
   - Revenue: SUM(total_amount) FROM invoices WHERE status='paid'
   - Expenses: SUM(amount) FROM expenses
   - AR: SUM(total_amount - paid_amount) FROM invoices WHERE status IN ('sent','overdue')
   - Use COALESCE for NULL handling: COALESCE(SUM(amount), 0)

5. **COMMON MISTAKES TO AVOID**:
   ❌ FROM customers → ✅ FROM contacts WHERE contact_type='customer'
   ❌ WHERE name = → ✅ WHERE company_name =
   ❌ SELECT invoice_amount → ✅ SELECT total_amount
   ❌ WHERE status = paid → ✅ WHERE status = 'paid'
   ❌ FROM products → ✅ FROM inventory

6. **PERFORMANCE TIPS**:
   - Use indexes: invoice_number_idx, contact_type_idx, status_idx
   - Limit results when appropriate: LIMIT 100
   - Use specific date ranges instead of full table scans
`;

// ============================================
// QUERY VALIDATOR
// ============================================
export function validateAndFixQuery(query: string): {
  isValid: boolean;
  issues: string[];
  suggestedFix?: string;
} {
  const issues: string[] = [];
  let fixedQuery = query;
  
  // Check for common table name mistakes
  if (query.match(/\bcustomers\b/i)) {
    issues.push("Table 'customers' doesn't exist. Use: contacts WHERE contact_type='customer'");
    fixedQuery = fixedQuery.replace(/\bcustomers\b/gi, "contacts");
  }
  
  if (query.match(/\bvendors\b/i)) {
    issues.push("Table 'vendors' doesn't exist. Use: contacts WHERE contact_type='vendor'");
    fixedQuery = fixedQuery.replace(/\bvendors\b/gi, "contacts");
  }
  
  if (query.match(/\bproducts\b/i)) {
    issues.push("Table 'products' doesn't exist. Use: inventory");
    fixedQuery = fixedQuery.replace(/\bproducts\b/gi, "inventory");
  }
  
  // Check for unquoted enum values
  if (query.match(/status\s*=\s*([^']paid|draft|sent|overdue|cancelled)/i)) {
    issues.push("Status values must be quoted: status='paid'");
    fixedQuery = fixedQuery.replace(/status\s*=\s*([^'])(paid|draft|sent|overdue|cancelled)/gi, "status='$2'");
  }
  
  // Check for field name mistakes
  if (query.match(/\b(customer|vendor)[\s_]?name\b/i) && !query.match(/company_name/i)) {
    issues.push("Use 'company_name' instead of 'customer name' or 'vendor name'");
    fixedQuery = fixedQuery.replace(/\b(customer|vendor)[\s_]?name\b/gi, "company_name");
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestedFix: issues.length > 0 ? fixedQuery : undefined
  };
}

// ============================================
// QUERY BUILDER HELPERS
// ============================================
export const queryBuilders = {
  // Get all customers
  getAllCustomers: () => 
    "SELECT * FROM contacts WHERE contact_type='customer' ORDER BY company_name",
  
  // Get revenue for period
  getRevenue: (period: 'month' | 'year' | 'all' = 'month') => {
    const dateFilter = period === 'month' 
      ? "DATE_TRUNC('month', invoice_date) = DATE_TRUNC('month', CURRENT_DATE)"
      : period === 'year'
      ? "DATE_TRUNC('year', invoice_date) = DATE_TRUNC('year', CURRENT_DATE)"
      : "1=1";
    
    return `SELECT COALESCE(SUM(total_amount), 0) as revenue 
            FROM invoices 
            WHERE status='paid' AND ${dateFilter}`;
  },
  
  // Get overdue invoices
  getOverdueInvoices: () =>
    `SELECT i.*, c.company_name, (i.total_amount - i.paid_amount) as balance_due
     FROM invoices i
     JOIN contacts c ON i.contact_id = c.id
     WHERE i.due_date < CURRENT_DATE 
     AND i.status != 'paid'
     ORDER BY i.due_date`,
  
  // Get expenses by category
  getExpensesByCategory: (period: 'month' | 'year' = 'month') => {
    const dateFilter = period === 'month'
      ? "DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE)"
      : "DATE_TRUNC('year', expense_date) = DATE_TRUNC('year', CURRENT_DATE)";
    
    return `SELECT ca.account_name as category, 
                   COALESCE(SUM(e.amount), 0) as total
            FROM expenses e
            JOIN chart_of_accounts ca ON e.category_account_id = ca.id
            WHERE ${dateFilter}
            GROUP BY ca.account_name
            ORDER BY total DESC`;
  },
  
  // Get balance sheet accounts
  getBalanceSheet: () =>
    `SELECT account_type, 
            account_name,
            COALESCE(balance, 0) as balance
     FROM chart_of_accounts
     WHERE is_active = true
     ORDER BY account_type, account_number`
};

// ============================================
// SCHEMA CONTEXT FOR PROMPTS
// ============================================
export const schemaContext = `
DATABASE SCHEMA REFERENCE:

TABLES:
- contacts (customers & vendors, use contact_type to filter)
- invoices (customer invoices)
- invoice_line_items (invoice details)
- chart_of_accounts (GL accounts)
- expenses (business expenses)
- inventory (products/services)
- transactions (payments/receipts)
- journal_entries (accounting entries)

KEY RELATIONSHIPS:
- invoices.contact_id → contacts.id (for customer info)
- expenses.vendor_id → contacts.id (for vendor info)
- invoice_line_items.invoice_id → invoices.id
- expenses.category_account_id → chart_of_accounts.id

CRITICAL FIELDS:
- contacts.contact_type: 'customer'|'vendor'|'both'
- invoices.status: 'draft'|'sent'|'paid'|'overdue'|'cancelled'
- invoices.total_amount (not invoice_amount)
- contacts.company_name (not name)
- expenses.expense_date (not date)
- inventory.product_name (not name)

${queryOptimizationHints}
`;