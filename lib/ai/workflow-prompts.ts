/**
 * Workflow Prompts System
 * Stores and manages workflow templates in Redis for slash command injection
 */

import { getRedisClient } from './query-memory';

// Default workflow prompts
const DEFAULT_WORKFLOWS = {
  'invoice': `Invoice Creation Workflow:
1. **Validate Customer**: Verify customer exists, check credit limit and payment terms
2. **Product/Service Verification**: Confirm products/services exist with current pricing
3. **Line Item Calculation**: Calculate quantities, unit prices, discounts, and line totals
4. **Tax Computation**: Apply appropriate tax rates based on customer location and product type
5. **Invoice Generation**: Create invoice with proper numbering sequence and formatting
6. **Approval Process**: Route for approval if amount exceeds defined thresholds
7. **Customer Delivery**: Send invoice via preferred method (email, portal, print)
8. **Accounting Integration**: Generate corresponding journal entries (AR debit, Revenue credit)
9. **Follow-up Setup**: Schedule payment reminders and aging reports

**Key Considerations**: Check customer credit status, validate pricing, ensure tax compliance`,

  'payment': `Payment Processing Workflow:
1. **Payment Verification**: Validate payment method, amount, and reference details
2. **Invoice Matching**: Match payment to outstanding invoices using reference numbers
3. **Allocation Logic**: Apply payment across multiple invoices if needed (oldest first)
4. **Customer Balance Update**: Update customer account balance and credit status
5. **Bank Reconciliation**: Record payment in appropriate bank account
6. **Journal Entries**: Create accounting entries (Cash debit, AR credit)
7. **Payment Confirmation**: Generate receipt and send to customer
8. **Cash Flow Update**: Update cash flow projections and working capital reports
9. **Exception Handling**: Process overpayments, underpayments, and discrepancies

**Key Considerations**: Verify bank details, handle currency conversions, check for duplicate payments`,

  'reconcile': `Account Reconciliation Workflow:
1. **Statement Import**: Import bank statement or manually enter transactions
2. **Transaction Matching**: Match bank transactions to accounting records
3. **Outstanding Items**: Identify uncleared checks, deposits in transit
4. **Bank Fees Processing**: Record bank charges, interest, and service fees
5. **Discrepancy Investigation**: Investigate unmatched transactions and timing differences
6. **Adjusting Entries**: Create journal entries for bank fees, interest, corrections
7. **Reconciliation Report**: Generate detailed reconciliation with supporting documentation
8. **Management Review**: Submit reconciliation for supervisory approval
9. **File Documentation**: Maintain audit trail and supporting documents

**Key Considerations**: Ensure cutoff accuracy, investigate all variances, document assumptions`,

  'month-end': `Month-End Close Workflow:
1. **Cutoff Procedures**: Ensure all transactions are recorded in correct period
2. **Accrual Entries**: Record accrued expenses, deferred revenue, prepaid items
3. **Depreciation Calculation**: Calculate and record monthly depreciation expense  
4. **Inventory Valuation**: Adjust inventory to physical counts and lower of cost/market
5. **Bank Reconciliations**: Complete all bank account reconciliations
6. **Inter-company Eliminations**: Process inter-company transactions and eliminations
7. **Financial Statements**: Generate trial balance, P&L, balance sheet, cash flow
8. **Management Reports**: Prepare variance analysis, KPI dashboard, management package
9. **Close Documentation**: Document journal entries, maintain closing checklist

**Key Considerations**: Verify completeness, ensure accuracy, meet reporting deadlines`,

  'inventory': `Inventory Management Workflow:
1. **Physical Count**: Conduct cycle counts or full physical inventory
2. **Variance Analysis**: Compare physical counts to system records
3. **Adjustment Processing**: Create inventory adjustments for variances
4. **Costing Method**: Apply FIFO, LIFO, or weighted average costing
5. **Lower of Cost/Market**: Test inventory values against current market prices
6. **Obsolescence Review**: Identify slow-moving and obsolete inventory
7. **Reserve Calculations**: Calculate allowances for obsolete or damaged goods
8. **Financial Impact**: Record inventory adjustments in accounting system
9. **Reporting Updates**: Update inventory reports, aging analysis, turnover metrics

**Key Considerations**: Ensure accurate counts, investigate significant variances, maintain documentation`,

  'expense': `Expense Processing Workflow:
1. **Receipt Verification**: Validate expense receipts and supporting documentation
2. **Policy Compliance**: Ensure expenses comply with company expense policies
3. **Coding Assignment**: Assign appropriate GL accounts and cost centers
4. **Approval Routing**: Route expenses through proper approval hierarchy
5. **Vendor Processing**: Set up new vendors, validate tax information
6. **Payment Processing**: Process payment via check, ACH, or corporate card
7. **Accounting Entries**: Record expense and corresponding liability/payment
8. **Tax Implications**: Handle sales tax, use tax, and VAT requirements
9. **Reporting Integration**: Update expense reports and budget variance analysis

**Key Considerations**: Verify business purpose, ensure proper approvals, maintain audit trail`,

  'revenue': `Revenue Recognition Workflow:
1. **Contract Review**: Analyze customer contracts and performance obligations
2. **Revenue Recognition**: Apply appropriate revenue recognition standards (ASC 606)
3. **Billing Coordination**: Coordinate billing with revenue recognition timing
4. **Deferred Revenue**: Manage deferred/unearned revenue for future performance
5. **Milestone Tracking**: Track project milestones and percentage completion
6. **Customer Communications**: Coordinate with customers on delivery acceptance
7. **Journal Entries**: Record revenue, cost of sales, and related accounts
8. **Commission Calculation**: Calculate and record sales commissions
9. **Revenue Reports**: Generate revenue reports, forecasts, and analytics

**Key Considerations**: Ensure compliance with accounting standards, validate contract terms, maintain supporting documentation`
};

/**
 * Initialize default workflow prompts in Redis
 */
export async function initializeWorkflowPrompts(): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client) {
      console.log('[WorkflowPrompts] Redis client not available');
      return;
    }

    let initialized = 0;
    for (const [workflowType, prompt] of Object.entries(DEFAULT_WORKFLOWS)) {
      const key = `workflow:${workflowType}`;
      
      // Check if workflow already exists
      const existing = await client.get(key);
      if (!existing) {
        await client.setEx(key, 604800, prompt); // 7 days TTL
        initialized++;
      }
    }

    console.log(`[WorkflowPrompts] Initialized ${initialized} workflow prompts`);
  } catch (error) {
    console.log('[WorkflowPrompts] Initialization error:', error);
  }
}

/**
 * Get workflow prompt by type
 */
export async function getWorkflowPrompt(workflowType: string): Promise<string | null> {
  try {
    const client = await getRedisClient();
    if (!client) return null;

    const key = `workflow:${workflowType}`;
    const prompt = await client.get(key);
    
    if (prompt) {
      console.log(`[WorkflowPrompts] Retrieved workflow: ${workflowType}`);
      return prompt;
    }
    
    return null;
  } catch (error) {
    console.log('[WorkflowPrompts] Retrieval error:', error);
    return null;
  }
}

/**
 * Store or update workflow prompt
 */
export async function storeWorkflowPrompt(
  workflowType: string, 
  prompt: string
): Promise<boolean> {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    const key = `workflow:${workflowType}`;
    await client.setEx(key, 604800, prompt); // 7 days TTL
    
    console.log(`[WorkflowPrompts] Stored workflow: ${workflowType}`);
    return true;
  } catch (error) {
    console.log('[WorkflowPrompts] Storage error:', error);
    return false;
  }
}

/**
 * Get all available workflow types
 */
export async function getAvailableWorkflows(): Promise<string[]> {
  try {
    const client = await getRedisClient();
    if (!client) return Object.keys(DEFAULT_WORKFLOWS);

    const keys = await client.keys('workflow:*');
    const workflowTypes = keys.map(key => key.replace('workflow:', ''));
    
    // Ensure we return at least the default workflows
    const allWorkflows = new Set([...workflowTypes, ...Object.keys(DEFAULT_WORKFLOWS)]);
    
    return Array.from(allWorkflows).sort();
  } catch (error) {
    console.log('[WorkflowPrompts] Error getting workflows:', error);
    return Object.keys(DEFAULT_WORKFLOWS);
  }
}

/**
 * Parse workflow commands from natural query
 */
export function parseWorkflowCommands(naturalQuery: string): string[] {
  const workflowMatches = naturalQuery.match(/\/workflow:(\w+)/g) || [];
  return workflowMatches.map(match => match.replace('/workflow:', ''));
}

/**
 * Parse entity mentions from natural query  
 */
export function parseEntityMentions(naturalQuery: string): Array<{type: string, value: string}> {
  const mentionMatches = naturalQuery.match(/@(\w+):([^@\s]+)/g) || [];
  return mentionMatches.map(mention => {
    const [, type, value] = mention.match(/@(\w+):([^@\s]+)/) || [];
    return { type, value };
  });
}

/**
 * Enhanced storage with workflow and entity context
 */
export async function storeSuccessfulQueryWithContext(
  naturalQuery: string,
  sqlQuery: string,
  success: boolean = true
): Promise<void> {
  try {
    // Import here to avoid circular dependency
    const { storeSuccessfulQuery, normalizeIntent, extractTables, detectDomain } = await import('./query-memory');
    
    // First store with standard method
    await storeSuccessfulQuery(naturalQuery, sqlQuery, success);
    
    // Then store with enhanced context if workflows/entities are present
    const workflows = parseWorkflowCommands(naturalQuery);
    const entities = parseEntityMentions(naturalQuery);
    
    if (workflows.length > 0 || entities.length > 0) {
      const client = await getRedisClient();
      if (!client) return;
      
      // Build enhanced key with context
      const intent = normalizeIntent(naturalQuery);
      const tables = extractTables(sqlQuery);
      const domain = detectDomain(tables);
      
      const contextParts = [domain, intent];
      
      if (workflows.length > 0) {
        contextParts.push(`workflow_${workflows[0]}`);
      }
      
      if (entities.length > 0) {
        const entityContext = entities
          .map(e => `${e.type}_${e.value.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10)}`)
          .join('_');
        contextParts.push(entityContext);
      }
      
      const enhancedKey = `query:${contextParts.join(':')}`;
      
      const memory = {
        naturalQuery,
        sqlQuery,
        tables,
        domain,
        intent,
        workflows,
        entities,
        success,
        timestamp: Date.now(),
        usageCount: 1
      };
      
      await client.setEx(enhancedKey, 604800, JSON.stringify(memory));
      console.log(`[WorkflowPrompts] Enhanced storage: ${enhancedKey}`);
    }
  } catch (error) {
    console.log('[WorkflowPrompts] Enhanced storage error:', error);
  }
}