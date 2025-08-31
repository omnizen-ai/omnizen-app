/**
 * Query Intelligence System
 * Handles multi-step queries and entity resolution
 */

// ============================================
// QUERY PATTERNS & INTELLIGENCE
// ============================================

export const queryIntelligence = {
  // When user mentions customer/company name, resolve it first
  invoiceQueryPatterns: {
    byCustomerName: {
      description: "User asks for invoices by customer/company name",
      triggers: [
        "invoices for {company}",
        "show {company} invoices",
        "{company} outstanding invoices",
        "what does {company} owe",
        "bills for {company}"
      ],
      steps: [
        // Step 1: Find the customer
        `SELECT id, company_name, email 
         FROM contacts 
         WHERE contact_type='customer' 
         AND (company_name ILIKE '%{search_term}%' 
              OR email ILIKE '%{search_term}%')
         LIMIT 5`,
        
        // Step 2: Get invoices using customer ID
        `SELECT i.*, c.company_name, c.email,
                (i.total_amount - i.paid_amount) as balance_due
         FROM invoices i
         JOIN contacts c ON i.contact_id = c.id
         WHERE i.contact_id = '{customer_id}'
         ORDER BY i.invoice_date DESC`
      ]
    },
    
    byInvoiceNumber: {
      description: "User asks for specific invoice by number",
      triggers: [
        "invoice #{number}",
        "invoice {number}",
        "show invoice {number}"
      ],
      steps: [
        // Direct query - no customer lookup needed
        `SELECT i.*, c.company_name, c.email
         FROM invoices i
         JOIN contacts c ON i.contact_id = c.id
         WHERE i.invoice_number ILIKE '%{invoice_number}%'`
      ]
    },
    
    byStatus: {
      description: "User asks for invoices by status",
      triggers: [
        "unpaid invoices",
        "overdue invoices",
        "draft invoices",
        "paid invoices"
      ],
      steps: [
        `SELECT i.*, c.company_name, c.email,
                (i.total_amount - i.paid_amount) as balance_due
         FROM invoices i
         JOIN contacts c ON i.contact_id = c.id
         WHERE i.status = '{status}'
         ORDER BY i.due_date`
      ]
    }
  },
  
  // Customer query patterns
  customerQueryPatterns: {
    findCustomer: {
      description: "Find customer by partial name or email",
      triggers: [
        "customer {name}",
        "find {company}",
        "search for {name}"
      ],
      query: `
        SELECT id, company_name, email, phone, 
               credit_limit, payment_terms
        FROM contacts
        WHERE contact_type='customer'
        AND (company_name ILIKE '%{search_term}%'
             OR email ILIKE '%{search_term}%'
             OR CONCAT(first_name, ' ', last_name) ILIKE '%{search_term}%')
        ORDER BY company_name
        LIMIT 10`
    },
    
    customerWithBalance: {
      description: "Get customer with their current balance",
      query: `
        SELECT c.*, 
               COALESCE(SUM(i.total_amount - i.paid_amount), 0) as outstanding_balance,
               COUNT(CASE WHEN i.status != 'paid' THEN 1 END) as open_invoices
        FROM contacts c
        LEFT JOIN invoices i ON i.contact_id = c.id
        WHERE c.contact_type='customer'
        AND c.id = '{customer_id}'
        GROUP BY c.id`
    }
  },
  
  // Expense patterns
  expenseQueryPatterns: {
    byVendorName: {
      description: "Get expenses by vendor name",
      triggers: [
        "expenses from {vendor}",
        "payments to {vendor}",
        "{vendor} bills"
      ],
      steps: [
        // Step 1: Find vendor
        `SELECT id, company_name 
         FROM contacts 
         WHERE contact_type='vendor'
         AND company_name ILIKE '%{search_term}%'`,
        
        // Step 2: Get expenses
        `SELECT e.*, v.company_name, ca.account_name as category
         FROM expenses e
         LEFT JOIN contacts v ON e.vendor_id = v.id
         JOIN chart_of_accounts ca ON e.category_account_id = ca.id
         WHERE e.vendor_id = '{vendor_id}'
         ORDER BY e.expense_date DESC`
      ]
    }
  }
};

// ============================================
// ENHANCED SQL PATTERNS WITH INTELLIGENCE
// ============================================

export const enhancedSqlPatterns = `
INTELLIGENT QUERY RULES:

1. **CUSTOMER NAME RESOLUTION**:
   When user mentions company/customer name for invoices:
   - FIRST: SELECT id FROM contacts WHERE contact_type='customer' AND company_name ILIKE '%name%'
   - THEN: Use the contact_id to query invoices
   - ALWAYS join with contacts to show company_name in results

2. **FUZZY MATCHING**:
   - Use ILIKE for case-insensitive partial matches
   - Search multiple fields: company_name, email, first_name+last_name
   - Return multiple matches if ambiguous, ask user to clarify

3. **MULTI-STEP QUERIES**:
   For "Show me Acme Corp invoices":
   Step 1: SELECT id, company_name FROM contacts WHERE contact_type='customer' AND company_name ILIKE '%Acme%'
   Step 2: SELECT i.*, c.company_name FROM invoices i JOIN contacts c ON i.contact_id=c.id WHERE i.contact_id='{found_id}'

4. **CONTEXT-AWARE JOINS**:
   - Invoice queries: ALWAYS JOIN contacts for customer name
   - Expense queries: LEFT JOIN contacts for vendor name (vendor might be null)
   - Add calculated fields: (total_amount - paid_amount) as balance_due

5. **SMART DEFAULTS**:
   - "invoices" → unpaid invoices (status != 'paid')
   - "customers" → active customers (is_active=true)
   - "expenses" → current month unless specified

QUERY TEMPLATES WITH INTELLIGENCE:

// Find customer first, then get invoices
CustomerInvoices:
  1. Find: SELECT id FROM contacts WHERE contact_type='customer' AND company_name ILIKE ?
  2. Query: SELECT i.*, c.company_name FROM invoices i JOIN contacts c WHERE i.contact_id=?

// Get overdue with customer info
OverdueInvoices:
  SELECT i.*, c.company_name, c.email, c.phone,
         (i.total_amount - i.paid_amount) as balance_due,
         DATE_PART('day', CURRENT_DATE - i.due_date) as days_overdue
  FROM invoices i
  JOIN contacts c ON i.contact_id = c.id
  WHERE i.due_date < CURRENT_DATE AND i.status != 'paid'
  ORDER BY days_overdue DESC

// Customer balance summary
CustomerBalance:
  SELECT c.company_name,
         COUNT(i.id) as total_invoices,
         SUM(CASE WHEN i.status='paid' THEN i.total_amount ELSE 0 END) as paid_total,
         SUM(CASE WHEN i.status!='paid' THEN i.total_amount - i.paid_amount ELSE 0 END) as outstanding
  FROM contacts c
  LEFT JOIN invoices i ON i.contact_id = c.id
  WHERE c.contact_type='customer' AND c.company_name ILIKE ?
  GROUP BY c.id, c.company_name
`;

// ============================================
// QUERY EXECUTION STRATEGY
// ============================================

export const queryExecutionStrategy = `
EXECUTION STRATEGY FOR INTELLIGENT QUERIES:

1. **PARSE USER INTENT**:
   - Extract entity names (company names, invoice numbers)
   - Identify query type (list, search, aggregate)
   - Determine if multi-step resolution needed

2. **ENTITY RESOLUTION**:
   If user mentions customer/vendor by name:
   - First query contacts table for ID
   - If multiple matches, show options to user
   - If single match, proceed with main query
   - If no match, suggest similar names

3. **QUERY OPTIMIZATION**:
   - Use indexes: company_name, email, invoice_number
   - Limit results when appropriate
   - Include only necessary fields
   - Add helpful calculated fields

4. **RESULT ENHANCEMENT**:
   Always include in results:
   - Customer/vendor names (not just IDs)
   - Calculated balances
   - Status descriptions
   - Formatted dates

5. **ERROR HANDLING**:
   - No customer found: "No customer matching 'X'. Similar: Y, Z"
   - Multiple matches: "Found 3 customers matching 'X'. Please specify:"
   - No invoices: "No invoices found for customer 'X'"

EXAMPLE FLOW:
User: "Show me invoices for Acme"
1. Parse: Extract "Acme" as company name
2. Resolve: Query contacts WHERE company_name ILIKE '%Acme%'
3. Found: Acme Corp (id: uuid-123)
4. Execute: SELECT invoices WHERE contact_id='uuid-123'
5. Return: Formatted table with invoice details and company name
`;

// ============================================
// QUERY BUILDER WITH INTELLIGENCE
// ============================================

export function buildIntelligentQuery(userRequest: string): {
  requiresResolution: boolean;
  resolutionQuery?: string;
  mainQuery: string;
  explanation: string;
} {
  const lower = userRequest.toLowerCase();
  
  // Check if user mentions a company/customer name
  const companyNameMatch = userRequest.match(/(?:for|from|to|of)\s+([A-Z][a-zA-Z\s&.-]+)/);
  const hasCompanyName = companyNameMatch || lower.includes('customer') || lower.includes('company');
  
  // Invoice queries
  if (lower.includes('invoice')) {
    if (hasCompanyName && companyNameMatch) {
      const companyName = companyNameMatch[1].trim();
      return {
        requiresResolution: true,
        resolutionQuery: `SELECT id, company_name FROM contacts WHERE contact_type='customer' AND company_name ILIKE '%${companyName}%'`,
        mainQuery: `SELECT i.*, c.company_name, (i.total_amount - i.paid_amount) as balance_due 
                   FROM invoices i JOIN contacts c ON i.contact_id = c.id 
                   WHERE i.contact_id = ? ORDER BY i.invoice_date DESC`,
        explanation: `First finding customer "${companyName}", then retrieving their invoices`
      };
    }
    
    // Check for status-based queries
    if (lower.includes('unpaid') || lower.includes('outstanding')) {
      return {
        requiresResolution: false,
        mainQuery: `SELECT i.*, c.company_name, (i.total_amount - i.paid_amount) as balance_due 
                   FROM invoices i JOIN contacts c ON i.contact_id = c.id 
                   WHERE i.status != 'paid' ORDER BY i.due_date`,
        explanation: "Getting all unpaid invoices with customer details"
      };
    }
  }
  
  // Expense queries
  if (lower.includes('expense')) {
    if (hasCompanyName && companyNameMatch) {
      const vendorName = companyNameMatch[1].trim();
      return {
        requiresResolution: true,
        resolutionQuery: `SELECT id, company_name FROM contacts WHERE contact_type='vendor' AND company_name ILIKE '%${vendorName}%'`,
        mainQuery: `SELECT e.*, v.company_name, ca.account_name as category 
                   FROM expenses e 
                   LEFT JOIN contacts v ON e.vendor_id = v.id 
                   JOIN chart_of_accounts ca ON e.category_account_id = ca.id 
                   WHERE e.vendor_id = ? ORDER BY e.expense_date DESC`,
        explanation: `First finding vendor "${vendorName}", then retrieving their expenses`
      };
    }
  }
  
  // Default: simple query
  return {
    requiresResolution: false,
    mainQuery: "SELECT * FROM invoices ORDER BY invoice_date DESC LIMIT 10",
    explanation: "Getting recent invoices"
  };
}