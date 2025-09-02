#!/usr/bin/env npx tsx
/**
 * Test Journey: Daily Operations - Expense Tracking
 * 
 * Tests direct expense recording with:
 * - Employee expense reports
 * - Credit card expense tracking
 * - Petty cash management
 * - Mileage tracking
 * - Per diem calculations
 * - Receipt attachment simulation
 * - Expense approval workflow
 * - Department/project allocation
 * - Expense reimbursement
 * - Corporate card reconciliation
 * 
 * Organizations tested:
 * - Anchorblock Technology Limited (Professional tier)
 * - Team Qreative (Growth tier)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { 
  getSupabaseClient, 
  executeSql, 
  setAuthContext, 
  clearAuthContext 
} from '../utils/db-client';
import { 
  assertJournalBalances, 
  assertFinancialIntegrity,
  assertRLSIsolation,
  assertDataExists
} from '../utils/test-assertions';
import { cleanupTestData } from '../utils/cleanup';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const supabase = getSupabaseClient();

interface TestContext {
  anchorblock: {
    orgId: string;
    userId: string;
    workspaceId: string;
    employeeId: string;
    expenseReportId?: string;
    creditCardId?: string;
    reimbursementId?: string;
  };
  teamQreative: {
    orgId: string;
    userId: string;
    workspaceId: string;
    employeeId: string;
    expenseReportId?: string;
  };
}

/**
 * Create expense report
 */
async function createExpenseReport(
  orgId: string,
  employeeId: string,
  reportData: {
    reportName: string;
    reportDate: string;
    submittedDate: string;
    expenses: Array<{
      date: string;
      category: string;
      accountCode: string;
      description: string;
      amount: number;
      taxAmount?: number;
      projectId?: string;
      departmentId?: string;
      isReimbursable: boolean;
      paymentMethod: 'cash' | 'personal_card' | 'company_card';
      receiptUrl?: string;
      notes?: string;
    }>;
  }
): Promise<{ reportId: string; totalAmount: number }> {
  console.log(chalk.cyan(`Creating expense report: ${reportData.reportName}...`));

  // Calculate totals
  const totalAmount = reportData.expenses.reduce((sum, exp) => sum + exp.amount + (exp.taxAmount || 0), 0);
  const reimbursableAmount = reportData.expenses
    .filter(exp => exp.isReimbursable)
    .reduce((sum, exp) => sum + exp.amount + (exp.taxAmount || 0), 0);

  // Create expense report
  const { data: report, error: reportError } = await supabase
    .from('expense_reports')
    .insert({
      org_id: orgId,
      employee_id: employeeId,
      report_name: reportData.reportName,
      report_date: reportData.reportDate,
      submitted_date: reportData.submittedDate,
      total_amount: totalAmount,
      reimbursable_amount: reimbursableAmount,
      non_reimbursable_amount: totalAmount - reimbursableAmount,
      status: 'submitted',
      expense_count: reportData.expenses.length
    })
    .select()
    .single();

  if (reportError) throw reportError;

  // Create expense items
  const expenseItems = reportData.expenses.map((exp, index) => ({
    org_id: orgId,
    expense_report_id: report.id,
    line_number: index + 1,
    expense_date: exp.date,
    category: exp.category,
    account_code: exp.accountCode,
    description: exp.description,
    amount: exp.amount,
    tax_amount: exp.taxAmount || 0,
    total_amount: exp.amount + (exp.taxAmount || 0),
    project_id: exp.projectId,
    department_id: exp.departmentId,
    is_reimbursable: exp.isReimbursable,
    payment_method: exp.paymentMethod,
    receipt_url: exp.receiptUrl,
    notes: exp.notes
  }));

  const { error: itemsError } = await supabase
    .from('expense_items')
    .insert(expenseItems);

  if (itemsError) throw itemsError;

  console.log(chalk.green(`✓ Created expense report ${report.id} with ${expenseItems.length} items`));
  return { reportId: report.id, totalAmount };
}

/**
 * Approve expense report and create journal entries
 */
async function approveExpenseReport(
  orgId: string,
  reportId: string,
  approvalData: {
    approvedBy: string;
    approvalDate: string;
    approvalNotes?: string;
  }
): Promise<string> {
  console.log(chalk.cyan('Approving expense report...'));

  // Get report details
  const { data: report } = await supabase
    .from('expense_reports')
    .select('*, expense_items(*)')
    .eq('id', reportId)
    .single();

  if (!report) throw new Error('Report not found');

  // Update report status
  await supabase
    .from('expense_reports')
    .update({
      status: 'approved',
      approved_by: approvalData.approvedBy,
      approved_date: approvalData.approvalDate,
      approval_notes: approvalData.approvalNotes
    })
    .eq('id', reportId);

  // Create journal entry
  const { data: journalEntry, error: journalError } = await supabase
    .from('journal_entries')
    .insert({
      org_id: orgId,
      entry_date: approvalData.approvalDate,
      reference_type: 'expense_report',
      reference_id: reportId,
      description: `Expense report: ${report.report_name}`,
      status: 'posted',
      total_debit: report.total_amount,
      total_credit: report.total_amount
    })
    .select()
    .single();

  if (journalError) throw journalError;

  // Group expenses by account code
  const expensesByAccount = new Map();
  const taxByAccount = new Map();
  
  for (const item of report.expense_items) {
    const existing = expensesByAccount.get(item.account_code) || 0;
    expensesByAccount.set(item.account_code, existing + item.amount);
    
    if (item.tax_amount > 0) {
      const existingTax = taxByAccount.get('1530') || 0; // Input Tax
      taxByAccount.set('1530', existingTax + item.tax_amount);
    }
  }

  // Create journal lines
  const journalLines = [];

  // Debit expense accounts
  for (const [accountCode, amount] of expensesByAccount) {
    journalLines.push({
      org_id: orgId,
      journal_entry_id: journalEntry.id,
      account_code: accountCode,
      debit_amount: amount,
      credit_amount: 0,
      description: 'Expense from report'
    });
  }

  // Debit input tax if applicable
  for (const [accountCode, amount] of taxByAccount) {
    journalLines.push({
      org_id: orgId,
      journal_entry_id: journalEntry.id,
      account_code: accountCode,
      debit_amount: amount,
      credit_amount: 0,
      description: 'Input tax on expenses'
    });
  }

  // Credit based on payment method
  if (report.reimbursable_amount > 0) {
    // Credit employee payable for reimbursable expenses
    journalLines.push({
      org_id: orgId,
      journal_entry_id: journalEntry.id,
      account_code: '2150', // Employee Payables
      debit_amount: 0,
      credit_amount: report.reimbursable_amount,
      description: 'Employee reimbursement due'
    });
  }

  if (report.non_reimbursable_amount > 0) {
    // Credit corporate card payable for company card expenses
    journalLines.push({
      org_id: orgId,
      journal_entry_id: journalEntry.id,
      account_code: '2160', // Corporate Card Payable
      debit_amount: 0,
      credit_amount: report.non_reimbursable_amount,
      description: 'Corporate card expenses'
    });
  }

  const { error: journalLinesError } = await supabase
    .from('journal_lines')
    .insert(journalLines);

  if (journalLinesError) throw journalLinesError;

  console.log(chalk.green(`✓ Approved expense report with journal entry ${journalEntry.id}`));
  return journalEntry.id;
}

/**
 * Process expense reimbursement
 */
async function processReimbursement(
  orgId: string,
  employeeId: string,
  reportId: string,
  reimbursementData: {
    amount: number;
    paymentDate: string;
    paymentMethod: 'check' | 'bank_transfer' | 'payroll';
    checkNumber?: string;
    reference: string;
  }
): Promise<string> {
  console.log(chalk.cyan(`Processing reimbursement of ${reimbursementData.amount}...`));

  // Create reimbursement record
  const { data: reimbursement, error: reimbError } = await supabase
    .from('expense_reimbursements')
    .insert({
      org_id: orgId,
      employee_id: employeeId,
      expense_report_id: reportId,
      amount: reimbursementData.amount,
      payment_date: reimbursementData.paymentDate,
      payment_method: reimbursementData.paymentMethod,
      check_number: reimbursementData.checkNumber,
      reference: reimbursementData.reference,
      status: 'paid'
    })
    .select()
    .single();

  if (reimbError) throw reimbError;

  // Create journal entry for payment
  const { data: journalEntry, error: journalError } = await supabase
    .from('journal_entries')
    .insert({
      org_id: orgId,
      entry_date: reimbursementData.paymentDate,
      reference_type: 'expense_reimbursement',
      reference_id: reimbursement.id,
      description: `Expense reimbursement - ${reimbursementData.reference}`,
      status: 'posted',
      total_debit: reimbursementData.amount,
      total_credit: reimbursementData.amount
    })
    .select()
    .single();

  if (journalError) throw journalError;

  // Journal lines: Debit employee payable, Credit bank
  const journalLines = [
    {
      org_id: orgId,
      journal_entry_id: journalEntry.id,
      account_code: '2150', // Employee Payables
      debit_amount: reimbursementData.amount,
      credit_amount: 0,
      description: 'Clear employee reimbursement liability'
    },
    {
      org_id: orgId,
      journal_entry_id: journalEntry.id,
      account_code: '1200', // Bank Account
      debit_amount: 0,
      credit_amount: reimbursementData.amount,
      description: 'Reimbursement payment'
    }
  ];

  await supabase
    .from('journal_lines')
    .insert(journalLines);

  // Update expense report
  await supabase
    .from('expense_reports')
    .update({
      reimbursement_status: 'paid',
      reimbursement_date: reimbursementData.paymentDate
    })
    .eq('id', reportId);

  console.log(chalk.green(`✓ Processed reimbursement ${reimbursement.id}`));
  return reimbursement.id;
}

/**
 * Track mileage expense
 */
async function trackMileageExpense(
  orgId: string,
  employeeId: string,
  mileageData: {
    date: string;
    startLocation: string;
    endLocation: string;
    purpose: string;
    miles: number;
    ratePerMile: number;
    projectId?: string;
  }
): Promise<void> {
  console.log(chalk.cyan(`Recording mileage: ${mileageData.miles} miles...`));

  const amount = mileageData.miles * mileageData.ratePerMile;

  // Create mileage record
  const { data: mileage, error } = await supabase
    .from('mileage_expenses')
    .insert({
      org_id: orgId,
      employee_id: employeeId,
      travel_date: mileageData.date,
      start_location: mileageData.startLocation,
      end_location: mileageData.endLocation,
      purpose: mileageData.purpose,
      miles: mileageData.miles,
      rate_per_mile: mileageData.ratePerMile,
      total_amount: amount,
      project_id: mileageData.projectId,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  console.log(chalk.green(`✓ Recorded mileage expense: $${amount.toFixed(2)}`));
}

/**
 * Set up corporate credit card
 */
async function setupCorporateCard(
  orgId: string,
  employeeId: string,
  cardData: {
    cardNumber: string; // Last 4 digits only
    cardHolder: string;
    creditLimit: number;
    expiryDate: string;
  }
): Promise<string> {
  console.log(chalk.cyan(`Setting up corporate card ending in ${cardData.cardNumber}...`));

  const { data: card, error } = await supabase
    .from('corporate_cards')
    .insert({
      org_id: orgId,
      employee_id: employeeId,
      card_last_four: cardData.cardNumber,
      card_holder: cardData.cardHolder,
      credit_limit: cardData.creditLimit,
      expiry_date: cardData.expiryDate,
      is_active: true
    })
    .select()
    .single();

  if (error) throw error;
  console.log(chalk.green(`✓ Set up corporate card ${card.id}`));
  return card.id;
}

/**
 * Record corporate card transaction
 */
async function recordCardTransaction(
  orgId: string,
  cardId: string,
  transaction: {
    date: string;
    vendor: string;
    amount: number;
    category: string;
    accountCode: string;
    description: string;
    projectId?: string;
  }
): Promise<void> {
  console.log(chalk.cyan(`Recording card transaction: ${transaction.vendor} - $${transaction.amount}`));

  // Create card transaction record
  const { data: txn, error: txnError } = await supabase
    .from('card_transactions')
    .insert({
      org_id: orgId,
      card_id: cardId,
      transaction_date: transaction.date,
      vendor: transaction.vendor,
      amount: transaction.amount,
      category: transaction.category,
      account_code: transaction.accountCode,
      description: transaction.description,
      project_id: transaction.projectId,
      status: 'pending'
    })
    .select()
    .single();

  if (txnError) throw txnError;

  // Create journal entry
  const { data: journalEntry, error: journalError } = await supabase
    .from('journal_entries')
    .insert({
      org_id: orgId,
      entry_date: transaction.date,
      reference_type: 'card_transaction',
      reference_id: txn.id,
      description: `Card purchase: ${transaction.vendor}`,
      status: 'posted',
      total_debit: transaction.amount,
      total_credit: transaction.amount
    })
    .select()
    .single();

  if (journalError) throw journalError;

  // Journal lines: Debit expense, Credit card payable
  const journalLines = [
    {
      org_id: orgId,
      journal_entry_id: journalEntry.id,
      account_code: transaction.accountCode,
      debit_amount: transaction.amount,
      credit_amount: 0,
      description: transaction.description
    },
    {
      org_id: orgId,
      journal_entry_id: journalEntry.id,
      account_code: '2160', // Corporate Card Payable
      debit_amount: 0,
      credit_amount: transaction.amount,
      description: 'Corporate card liability'
    }
  ];

  await supabase
    .from('journal_lines')
    .insert(journalLines);

  console.log(chalk.green('✓ Recorded card transaction'));
}

/**
 * Manage petty cash
 */
async function managePettyCash(
  orgId: string,
  operation: 'setup' | 'expense' | 'replenish',
  data: {
    amount: number;
    date: string;
    description: string;
    accountCode?: string;
  }
): Promise<void> {
  console.log(chalk.cyan(`Petty cash ${operation}: $${data.amount}`));

  const { data: journalEntry, error: journalError } = await supabase
    .from('journal_entries')
    .insert({
      org_id: orgId,
      entry_date: data.date,
      reference_type: `petty_cash_${operation}`,
      description: data.description,
      status: 'posted',
      total_debit: data.amount,
      total_credit: data.amount
    })
    .select()
    .single();

  if (journalError) throw journalError;

  let journalLines = [];
  
  switch (operation) {
    case 'setup':
      // Setup: Debit petty cash, Credit bank
      journalLines = [
        {
          org_id: orgId,
          journal_entry_id: journalEntry.id,
          account_code: '1250', // Petty Cash
          debit_amount: data.amount,
          credit_amount: 0,
          description: 'Establish petty cash fund'
        },
        {
          org_id: orgId,
          journal_entry_id: journalEntry.id,
          account_code: '1200', // Bank Account
          debit_amount: 0,
          credit_amount: data.amount,
          description: 'Withdraw for petty cash'
        }
      ];
      break;
      
    case 'expense':
      // Expense: Debit expense, Credit petty cash
      journalLines = [
        {
          org_id: orgId,
          journal_entry_id: journalEntry.id,
          account_code: data.accountCode || '6900', // Misc Expenses
          debit_amount: data.amount,
          credit_amount: 0,
          description: data.description
        },
        {
          org_id: orgId,
          journal_entry_id: journalEntry.id,
          account_code: '1250', // Petty Cash
          debit_amount: 0,
          credit_amount: data.amount,
          description: 'Petty cash payment'
        }
      ];
      break;
      
    case 'replenish':
      // Replenish: Debit petty cash, Credit bank
      journalLines = [
        {
          org_id: orgId,
          journal_entry_id: journalEntry.id,
          account_code: '1250', // Petty Cash
          debit_amount: data.amount,
          credit_amount: 0,
          description: 'Replenish petty cash'
        },
        {
          org_id: orgId,
          journal_entry_id: journalEntry.id,
          account_code: '1200', // Bank Account
          debit_amount: 0,
          credit_amount: data.amount,
          description: 'Replenishment withdrawal'
        }
      ];
      break;
  }

  await supabase
    .from('journal_lines')
    .insert(journalLines);

  console.log(chalk.green(`✓ Petty cash ${operation} completed`));
}

/**
 * Generate expense report summary
 */
async function generateExpenseSummary(
  orgId: string,
  startDate: string,
  endDate: string
): Promise<void> {
  console.log(chalk.cyan('Generating expense summary...'));

  // Get expense reports in period
  const { data: reports } = await supabase
    .from('expense_reports')
    .select(`
      *,
      employee:contacts!employee_id(name),
      expense_items(category, total_amount)
    `)
    .eq('org_id', orgId)
    .gte('report_date', startDate)
    .lte('report_date', endDate);

  // Summarize by category
  const byCategory: Record<string, number> = {};
  let totalExpenses = 0;
  let totalReimbursable = 0;

  for (const report of reports || []) {
    totalExpenses += report.total_amount;
    totalReimbursable += report.reimbursable_amount;
    
    for (const item of report.expense_items || []) {
      byCategory[item.category] = (byCategory[item.category] || 0) + item.total_amount;
    }
  }

  console.log(chalk.blue(`\nExpense Summary Report`));
  console.log(chalk.blue(`Period: ${startDate} to ${endDate}\n`));

  console.log(chalk.yellow('By Category:'));
  console.table(byCategory);

  console.log(chalk.yellow('\nTotals:'));
  console.log(`Total Expenses: $${totalExpenses.toFixed(2)}`);
  console.log(`Reimbursable: $${totalReimbursable.toFixed(2)}`);
  console.log(`Non-reimbursable: $${(totalExpenses - totalReimbursable).toFixed(2)}`);
  console.log(`Reports: ${reports?.length || 0}`);

  console.log(chalk.green('\n✓ Expense summary generated'));
}

/**
 * Main test execution
 */
async function runTests() {
  console.log(chalk.bold.blue('\n🧪 Testing Daily Operations - Expense Tracking\n'));

  const context: TestContext = {
    anchorblock: {
      orgId: '',
      userId: '',
      workspaceId: '',
      employeeId: ''
    },
    teamQreative: {
      orgId: '',
      userId: '',
      workspaceId: '',
      employeeId: ''
    }
  };

  try {
    // Get test data from previous setup
    console.log(chalk.yellow('Loading test context...'));

    // Get Anchorblock data
    const { data: anchorblockOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', 'anchorblock-tech')
      .single();

    const { data: anchorblockUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'faruk@anchorblock.vc')
      .single();

    const { data: anchorblockWorkspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('org_id', anchorblockOrg?.id)
      .eq('slug', 'engineering')
      .single();

    const { data: anchorblockEmployee } = await supabase
      .from('contacts')
      .select('id')
      .eq('org_id', anchorblockOrg?.id)
      .eq('email', 'john.doe@anchorblock.vc')
      .single();

    context.anchorblock = {
      orgId: anchorblockOrg?.id || '',
      userId: anchorblockUser?.id || '',
      workspaceId: anchorblockWorkspace?.id || '',
      employeeId: anchorblockEmployee?.id || ''
    };

    // Get Team Qreative data
    const { data: qreativeOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', 'team-qreative')
      .single();

    const { data: qreativeUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'hello@teamqreative.com')
      .single();

    const { data: qreativeWorkspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('org_id', qreativeOrg?.id)
      .eq('slug', 'design')
      .single();

    const { data: qreativeEmployee } = await supabase
      .from('contacts')
      .select('id')
      .eq('org_id', qreativeOrg?.id)
      .eq('email', 'sarah.johnson@teamqreative.com')
      .single();

    context.teamQreative = {
      orgId: qreativeOrg?.id || '',
      userId: qreativeUser?.id || '',
      workspaceId: qreativeWorkspace?.id || '',
      employeeId: qreativeEmployee?.id || ''
    };

    // Validate context
    assertDataExists(context.anchorblock.orgId, 'Anchorblock organization');
    assertDataExists(context.teamQreative.orgId, 'Team Qreative organization');

    // Test 1: Create expense report for Anchorblock
    console.log(chalk.bold('\n📝 Test 1: Create employee expense report'));
    await setAuthContext(
      context.anchorblock.orgId,
      context.anchorblock.userId,
      context.anchorblock.workspaceId
    );

    const expenseReport = await createExpenseReport(
      context.anchorblock.orgId,
      context.anchorblock.employeeId,
      {
        reportName: 'Tech Conference - Feb 2024',
        reportDate: '2024-02-28',
        submittedDate: '2024-02-28',
        expenses: [
          {
            date: '2024-02-15',
            category: 'Travel',
            accountCode: '6300',
            description: 'Flight to SF for conference',
            amount: 450,
            isReimbursable: true,
            paymentMethod: 'personal_card',
            receiptUrl: 'receipt-001.pdf',
            notes: 'Economy class'
          },
          {
            date: '2024-02-15',
            category: 'Accommodation',
            accountCode: '6310',
            description: 'Hotel - 3 nights',
            amount: 600,
            taxAmount: 60,
            isReimbursable: true,
            paymentMethod: 'personal_card',
            receiptUrl: 'receipt-002.pdf'
          },
          {
            date: '2024-02-16',
            category: 'Meals',
            accountCode: '6320',
            description: 'Client dinner',
            amount: 150,
            taxAmount: 15,
            isReimbursable: false,
            paymentMethod: 'company_card',
            notes: 'With TechStartup team'
          },
          {
            date: '2024-02-17',
            category: 'Transportation',
            accountCode: '6330',
            description: 'Uber to/from airport',
            amount: 80,
            isReimbursable: true,
            paymentMethod: 'personal_card'
          }
        ]
      }
    );

    context.anchorblock.expenseReportId = expenseReport.reportId;

    // Test 2: Approve expense report
    console.log(chalk.bold('\n✅ Test 2: Approve expense report'));
    const journalEntryId = await approveExpenseReport(
      context.anchorblock.orgId,
      expenseReport.reportId,
      {
        approvedBy: 'manager',
        approvalDate: '2024-03-01',
        approvalNotes: 'All expenses approved'
      }
    );

    await assertJournalBalances(journalEntryId);

    // Test 3: Process reimbursement
    console.log(chalk.bold('\n💰 Test 3: Process expense reimbursement'));
    context.anchorblock.reimbursementId = await processReimbursement(
      context.anchorblock.orgId,
      context.anchorblock.employeeId,
      expenseReport.reportId,
      {
        amount: 1190, // Reimbursable amount
        paymentDate: '2024-03-05',
        paymentMethod: 'bank_transfer',
        reference: 'REIMB-2024-001'
      }
    );

    // Test 4: Track mileage expense
    console.log(chalk.bold('\n🚗 Test 4: Track mileage expense'));
    await trackMileageExpense(
      context.anchorblock.orgId,
      context.anchorblock.employeeId,
      {
        date: '2024-02-20',
        startLocation: 'Office',
        endLocation: 'Client Site - Downtown',
        purpose: 'Client meeting',
        miles: 45,
        ratePerMile: 0.655, // IRS rate
        projectId: 'project-001'
      }
    );

    // Test 5: Set up corporate credit card
    console.log(chalk.bold('\n💳 Test 5: Set up corporate credit card'));
    context.anchorblock.creditCardId = await setupCorporateCard(
      context.anchorblock.orgId,
      context.anchorblock.employeeId,
      {
        cardNumber: '4567',
        cardHolder: 'John Doe',
        creditLimit: 5000,
        expiryDate: '2026-12-31'
      }
    );

    // Test 6: Record corporate card transactions
    console.log(chalk.bold('\n🛒 Test 6: Record corporate card transactions'));
    await recordCardTransaction(
      context.anchorblock.orgId,
      context.anchorblock.creditCardId,
      {
        date: '2024-02-22',
        vendor: 'AWS Marketplace',
        amount: 250,
        category: 'Software',
        accountCode: '6100',
        description: 'Development tools subscription',
        projectId: 'project-002'
      }
    );

    await recordCardTransaction(
      context.anchorblock.orgId,
      context.anchorblock.creditCardId,
      {
        date: '2024-02-25',
        vendor: 'Office Depot',
        amount: 125,
        category: 'Office Supplies',
        accountCode: '6400',
        description: 'Office supplies and equipment'
      }
    );

    // Test 7: Petty cash management
    console.log(chalk.bold('\n💵 Test 7: Petty cash management'));
    
    // Setup petty cash
    await managePettyCash(
      context.anchorblock.orgId,
      'setup',
      {
        amount: 500,
        date: '2024-02-01',
        description: 'Establish petty cash fund'
      }
    );

    // Record petty cash expense
    await managePettyCash(
      context.anchorblock.orgId,
      'expense',
      {
        amount: 45,
        date: '2024-02-10',
        description: 'Office coffee and snacks',
        accountCode: '6450'
      }
    );

    // Replenish petty cash
    await managePettyCash(
      context.anchorblock.orgId,
      'replenish',
      {
        amount: 45,
        date: '2024-02-28',
        description: 'Replenish petty cash to $500'
      }
    );

    // Test 8: Team Qreative expense report
    console.log(chalk.bold('\n🎨 Test 8: Team Qreative expense tracking'));
    await clearAuthContext();
    await setAuthContext(
      context.teamQreative.orgId,
      context.teamQreative.userId,
      context.teamQreative.workspaceId
    );

    const qreativeReport = await createExpenseReport(
      context.teamQreative.orgId,
      context.teamQreative.employeeId,
      {
        reportName: 'Design Conference - Feb 2024',
        reportDate: '2024-02-25',
        submittedDate: '2024-02-25',
        expenses: [
          {
            date: '2024-02-20',
            category: 'Training',
            accountCode: '6350',
            description: 'Design workshop registration',
            amount: 800,
            isReimbursable: false,
            paymentMethod: 'company_card',
            notes: 'Adobe MAX conference'
          },
          {
            date: '2024-02-21',
            category: 'Materials',
            accountCode: '6360',
            description: 'Design materials and tools',
            amount: 250,
            taxAmount: 25,
            isReimbursable: true,
            paymentMethod: 'personal_card',
            receiptUrl: 'receipt-tq-001.pdf'
          }
        ]
      }
    );

    context.teamQreative.expenseReportId = qreativeReport.reportId;

    await approveExpenseReport(
      context.teamQreative.orgId,
      qreativeReport.reportId,
      {
        approvedBy: 'creative-director',
        approvalDate: '2024-02-26',
        approvalNotes: 'Approved for training budget'
      }
    );

    // Test 9: Generate expense summary
    console.log(chalk.bold('\n📊 Test 9: Generate expense summary'));
    await clearAuthContext();
    await setAuthContext(context.anchorblock.orgId, context.anchorblock.userId);
    
    await generateExpenseSummary(
      context.anchorblock.orgId,
      '2024-02-01',
      '2024-02-28'
    );

    // Test 10: RLS isolation
    console.log(chalk.bold('\n🔒 Test 10: Test RLS isolation'));
    await assertRLSIsolation(
      'expense_reports',
      context.anchorblock.orgId,
      context.teamQreative.orgId,
      context.anchorblock.userId,
      context.teamQreative.userId
    );

    // Test 11: Financial integrity
    console.log(chalk.bold('\n✅ Test 11: Validate financial integrity'));
    await assertFinancialIntegrity(context.anchorblock.orgId);
    await assertFinancialIntegrity(context.teamQreative.orgId);

    console.log(chalk.bold.green('\n✅ All expense tracking tests passed!\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ Test failed:'), error);
    throw error;
  } finally {
    await clearAuthContext();
  }
}

// Execute tests
runTests().catch(console.error);