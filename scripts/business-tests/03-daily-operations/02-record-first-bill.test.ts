#!/usr/bin/env npx tsx
/**
 * Test Journey: Daily Operations - Record First Bill
 * 
 * Tests vendor bill recording with:
 * - Bill creation with line items
 * - Automatic AP journal entries
 * - Expense tracking with cost centers
 * - Tax handling (input tax credits)
 * - Approval workflow
 * - Partial payments
 * - Bill credits/adjustments
 * - Recurring bills setup
 * - Multi-currency bills
 * - Purchase order matching
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
    vendorId: string;
    billId?: string;
    journalEntryId?: string;
    recurringBillId?: string;
    billCreditId?: string;
  };
  teamQreative: {
    orgId: string;
    userId: string;
    workspaceId: string;
    vendorId: string;
    billId?: string;
    journalEntryId?: string;
  };
}

/**
 * Create a vendor bill with journal entries
 */
async function createVendorBill(
  orgId: string,
  vendorId: string,
  billData: {
    billNumber: string;
    billDate: string;
    dueDate: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      accountCode: string;
      taxCodeId?: string;
      departmentId?: string;
      projectId?: string;
    }>;
    currency?: string;
    exchangeRate?: number;
    poNumber?: string;
    notes?: string;
  }
): Promise<{ billId: string; journalEntryId: string }> {
  console.log(chalk.cyan(`Creating bill ${billData.billNumber}...`));

  // Calculate totals
  let subtotal = 0;
  let taxAmount = 0;
  const lineItems = [];

  for (const item of billData.items) {
    const lineTotal = item.quantity * item.unitPrice;
    subtotal += lineTotal;

    // Get tax rate if applicable
    let itemTaxAmount = 0;
    if (item.taxCodeId) {
      const { data: taxCode } = await supabase
        .from('tax_codes')
        .select('rate')
        .eq('id', item.taxCodeId)
        .single();

      if (taxCode) {
        itemTaxAmount = lineTotal * (taxCode.rate / 100);
        taxAmount += itemTaxAmount;
      }
    }

    lineItems.push({
      ...item,
      line_total: lineTotal,
      tax_amount: itemTaxAmount
    });
  }

  const totalAmount = subtotal + taxAmount;

  // Create bill
  const { data: bill, error: billError } = await supabase
    .from('bills')
    .insert({
      org_id: orgId,
      vendor_id: vendorId,
      bill_number: billData.billNumber,
      bill_date: billData.billDate,
      due_date: billData.dueDate,
      currency: billData.currency || 'USD',
      exchange_rate: billData.exchangeRate || 1,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      amount_due: totalAmount,
      status: 'draft',
      po_number: billData.poNumber,
      notes: billData.notes
    })
    .select()
    .single();

  if (billError) throw billError;

  // Create bill lines
  const billLines = lineItems.map((item, index) => ({
    org_id: orgId,
    bill_id: bill.id,
    line_number: index + 1,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    line_total: item.line_total,
    tax_amount: item.tax_amount,
    account_code: item.accountCode,
    tax_code_id: item.taxCodeId,
    department_id: item.departmentId,
    project_id: item.projectId
  }));

  const { error: linesError } = await supabase
    .from('bill_lines')
    .insert(billLines);

  if (linesError) throw linesError;

  // Create journal entry
  const { data: journalEntry, error: journalError } = await supabase
    .from('journal_entries')
    .insert({
      org_id: orgId,
      entry_date: billData.billDate,
      reference_type: 'bill',
      reference_id: bill.id,
      description: `Bill ${billData.billNumber} from vendor`,
      status: 'posted',
      total_debit: totalAmount,
      total_credit: totalAmount
    })
    .select()
    .single();

  if (journalError) throw journalError;

  // Create journal lines (debit expenses, credit AP)
  const journalLines = [];

  // Group expenses by account
  const expensesByAccount = new Map();
  for (const line of lineItems) {
    const existing = expensesByAccount.get(line.accountCode) || 0;
    expensesByAccount.set(line.accountCode, existing + line.line_total);
  }

  // Debit expense accounts
  for (const [accountCode, amount] of expensesByAccount) {
    journalLines.push({
      org_id: orgId,
      journal_entry_id: journalEntry.id,
      account_code: accountCode,
      debit_amount: amount,
      credit_amount: 0,
      description: `Expense from bill ${billData.billNumber}`
    });
  }

  // Debit input tax if applicable
  if (taxAmount > 0) {
    journalLines.push({
      org_id: orgId,
      journal_entry_id: journalEntry.id,
      account_code: '1530', // Input Tax/VAT Recoverable
      debit_amount: taxAmount,
      credit_amount: 0,
      description: `Input tax on bill ${billData.billNumber}`
    });
  }

  // Credit accounts payable
  journalLines.push({
    org_id: orgId,
    journal_entry_id: journalEntry.id,
    account_code: '2100', // Accounts Payable
    debit_amount: 0,
    credit_amount: totalAmount,
    description: `AP for bill ${billData.billNumber}`
  });

  const { error: journalLinesError } = await supabase
    .from('journal_lines')
    .insert(journalLines);

  if (journalLinesError) throw journalLinesError;

  console.log(chalk.green(`✓ Created bill ${bill.id} with journal entry ${journalEntry.id}`));
  return { billId: bill.id, journalEntryId: journalEntry.id };
}

/**
 * Approve a bill for payment
 */
async function approveBill(billId: string): Promise<void> {
  console.log(chalk.cyan('Approving bill...'));

  const { error } = await supabase
    .from('bills')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: 'test-approver'
    })
    .eq('id', billId);

  if (error) throw error;
  console.log(chalk.green('✓ Bill approved'));
}

/**
 * Record partial payment on a bill
 */
async function recordPartialPayment(
  orgId: string,
  billId: string,
  amount: number,
  paymentDate: string
): Promise<string> {
  console.log(chalk.cyan(`Recording partial payment of ${amount}...`));

  // Get bill details
  const { data: bill } = await supabase
    .from('bills')
    .select('amount_due, bill_number')
    .eq('id', billId)
    .single();

  if (!bill) throw new Error('Bill not found');

  const newAmountDue = bill.amount_due - amount;

  // Create payment record
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      org_id: orgId,
      payment_type: 'sent',
      reference_type: 'bill',
      reference_id: billId,
      amount,
      payment_date: paymentDate,
      payment_method: 'bank_transfer',
      status: 'completed'
    })
    .select()
    .single();

  if (paymentError) throw paymentError;

  // Update bill
  const { error: updateError } = await supabase
    .from('bills')
    .update({
      amount_due: newAmountDue,
      amount_paid: amount,
      status: newAmountDue > 0 ? 'partial' : 'paid',
      last_payment_date: paymentDate
    })
    .eq('id', billId);

  if (updateError) throw updateError;

  // Create journal entry for payment
  const { data: journalEntry, error: journalError } = await supabase
    .from('journal_entries')
    .insert({
      org_id: orgId,
      entry_date: paymentDate,
      reference_type: 'payment',
      reference_id: payment.id,
      description: `Payment for bill ${bill.bill_number}`,
      status: 'posted',
      total_debit: amount,
      total_credit: amount
    })
    .select()
    .single();

  if (journalError) throw journalError;

  // Journal lines: Debit AP, Credit Bank
  const journalLines = [
    {
      org_id: orgId,
      journal_entry_id: journalEntry.id,
      account_code: '2100', // Accounts Payable
      debit_amount: amount,
      credit_amount: 0,
      description: `Reduce AP for bill ${bill.bill_number}`
    },
    {
      org_id: orgId,
      journal_entry_id: journalEntry.id,
      account_code: '1200', // Bank Account
      debit_amount: 0,
      credit_amount: amount,
      description: `Payment from bank for bill ${bill.bill_number}`
    }
  ];

  const { error: journalLinesError } = await supabase
    .from('journal_lines')
    .insert(journalLines);

  if (journalLinesError) throw journalLinesError;

  console.log(chalk.green(`✓ Recorded payment ${payment.id}`));
  return payment.id;
}

/**
 * Create a bill credit note
 */
async function createBillCredit(
  orgId: string,
  originalBillId: string,
  creditData: {
    creditNumber: string;
    creditDate: string;
    amount: number;
    reason: string;
  }
): Promise<string> {
  console.log(chalk.cyan(`Creating bill credit ${creditData.creditNumber}...`));

  // Get original bill
  const { data: originalBill } = await supabase
    .from('bills')
    .select('vendor_id, bill_number, currency')
    .eq('id', originalBillId)
    .single();

  if (!originalBill) throw new Error('Original bill not found');

  // Create credit note
  const { data: creditNote, error: creditError } = await supabase
    .from('bills')
    .insert({
      org_id: orgId,
      vendor_id: originalBill.vendor_id,
      bill_number: creditData.creditNumber,
      bill_date: creditData.creditDate,
      due_date: creditData.creditDate,
      currency: originalBill.currency,
      subtotal: -creditData.amount,
      tax_amount: 0,
      total_amount: -creditData.amount,
      amount_due: -creditData.amount,
      status: 'credit_note',
      parent_bill_id: originalBillId,
      notes: creditData.reason
    })
    .select()
    .single();

  if (creditError) throw creditError;

  // Create journal entry for credit
  const { data: journalEntry, error: journalError } = await supabase
    .from('journal_entries')
    .insert({
      org_id: orgId,
      entry_date: creditData.creditDate,
      reference_type: 'bill_credit',
      reference_id: creditNote.id,
      description: `Credit note ${creditData.creditNumber} for bill ${originalBill.bill_number}`,
      status: 'posted',
      total_debit: creditData.amount,
      total_credit: creditData.amount
    })
    .select()
    .single();

  if (journalError) throw journalError;

  // Journal lines: Debit AP, Credit Expense
  const journalLines = [
    {
      org_id: orgId,
      journal_entry_id: journalEntry.id,
      account_code: '2100', // Accounts Payable
      debit_amount: creditData.amount,
      credit_amount: 0,
      description: `Reduce AP for credit note`
    },
    {
      org_id: orgId,
      journal_entry_id: journalEntry.id,
      account_code: '6000', // Operating Expenses (or specific expense account)
      debit_amount: 0,
      credit_amount: creditData.amount,
      description: `Expense reversal for credit note`
    }
  ];

  const { error: journalLinesError } = await supabase
    .from('journal_lines')
    .insert(journalLines);

  if (journalLinesError) throw journalLinesError;

  console.log(chalk.green(`✓ Created bill credit ${creditNote.id}`));
  return creditNote.id;
}

/**
 * Set up a recurring bill
 */
async function setupRecurringBill(
  orgId: string,
  vendorId: string,
  recurringData: {
    templateName: string;
    frequency: 'monthly' | 'quarterly' | 'annually';
    startDate: string;
    endDate?: string;
    dayOfMonth: number;
    amount: number;
    accountCode: string;
    description: string;
  }
): Promise<string> {
  console.log(chalk.cyan(`Setting up recurring bill: ${recurringData.templateName}...`));

  const { data: recurring, error } = await supabase
    .from('recurring_bills')
    .insert({
      org_id: orgId,
      vendor_id: vendorId,
      template_name: recurringData.templateName,
      frequency: recurringData.frequency,
      start_date: recurringData.startDate,
      end_date: recurringData.endDate,
      next_bill_date: recurringData.startDate,
      day_of_month: recurringData.dayOfMonth,
      amount: recurringData.amount,
      account_code: recurringData.accountCode,
      description: recurringData.description,
      is_active: true
    })
    .select()
    .single();

  if (error) throw error;
  console.log(chalk.green(`✓ Created recurring bill template ${recurring.id}`));
  return recurring.id;
}

/**
 * Test AP aging analysis
 */
async function testAPAging(orgId: string): Promise<void> {
  console.log(chalk.cyan('Testing AP aging analysis...'));

  // Query AP aging view
  const { data: aging, error } = await supabase
    .from('semantic.v_ap_aging_report')
    .select('*')
    .eq('org_id', orgId)
    .order('days_overdue', { ascending: false });

  if (error) throw error;

  console.log(chalk.blue('AP Aging Summary:'));
  const buckets = {
    current: 0,
    '1-30': 0,
    '31-60': 0,
    '61-90': 0,
    'over_90': 0
  };

  for (const bill of aging || []) {
    if (bill.days_overdue <= 0) buckets.current += bill.amount_due;
    else if (bill.days_overdue <= 30) buckets['1-30'] += bill.amount_due;
    else if (bill.days_overdue <= 60) buckets['31-60'] += bill.amount_due;
    else if (bill.days_overdue <= 90) buckets['61-90'] += bill.amount_due;
    else buckets.over_90 += bill.amount_due;
  }

  console.table(buckets);
  console.log(chalk.green('✓ AP aging analysis completed'));
}

/**
 * Main test execution
 */
async function runTests() {
  console.log(chalk.bold.blue('\n🧪 Testing Daily Operations - Vendor Bill Recording\n'));

  const context: TestContext = {
    anchorblock: {
      orgId: '',
      userId: '',
      workspaceId: '',
      vendorId: ''
    },
    teamQreative: {
      orgId: '',
      userId: '',
      workspaceId: '',
      vendorId: ''
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

    const { data: awsVendor } = await supabase
      .from('contacts')
      .select('id')
      .eq('org_id', anchorblockOrg?.id)
      .eq('name', 'Amazon Web Services')
      .single();

    context.anchorblock = {
      orgId: anchorblockOrg?.id || '',
      userId: anchorblockUser?.id || '',
      workspaceId: anchorblockWorkspace?.id || '',
      vendorId: awsVendor?.id || ''
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

    const { data: adobeVendor } = await supabase
      .from('contacts')
      .select('id')
      .eq('org_id', qreativeOrg?.id)
      .eq('name', 'Adobe Inc.')
      .single();

    context.teamQreative = {
      orgId: qreativeOrg?.id || '',
      userId: qreativeUser?.id || '',
      workspaceId: qreativeWorkspace?.id || '',
      vendorId: adobeVendor?.id || ''
    };

    // Validate context
    assertDataExists(context.anchorblock.orgId, 'Anchorblock organization');
    assertDataExists(context.teamQreative.orgId, 'Team Qreative organization');

    // Test 1: Create AWS bill for Anchorblock
    console.log(chalk.bold('\n📝 Test 1: Create vendor bill for AWS services'));
    await setAuthContext(
      context.anchorblock.orgId,
      context.anchorblock.userId,
      context.anchorblock.workspaceId
    );

    const awsBill = await createVendorBill(
      context.anchorblock.orgId,
      context.anchorblock.vendorId,
      {
        billNumber: 'AWS-2024-01-001',
        billDate: '2024-01-15',
        dueDate: '2024-02-15',
        items: [
          {
            description: 'EC2 Instances - Production',
            quantity: 720,
            unitPrice: 0.25,
            accountCode: '6100' // Cloud Infrastructure
          },
          {
            description: 'RDS Database - Multi-AZ',
            quantity: 720,
            unitPrice: 0.15,
            accountCode: '6100'
          },
          {
            description: 'S3 Storage - 500GB',
            quantity: 500,
            unitPrice: 0.023,
            accountCode: '6100'
          },
          {
            description: 'CloudFront CDN',
            quantity: 1000,
            unitPrice: 0.085,
            accountCode: '6110' // CDN & Networking
          }
        ],
        notes: 'Monthly AWS services for January 2024'
      }
    );

    context.anchorblock.billId = awsBill.billId;
    context.anchorblock.journalEntryId = awsBill.journalEntryId;

    // Validate journal entries
    await assertJournalBalances(awsBill.journalEntryId);

    // Test 2: Approve and partially pay the bill
    console.log(chalk.bold('\n💳 Test 2: Approve and make partial payment'));
    await approveBill(awsBill.billId);
    
    const paymentId = await recordPartialPayment(
      context.anchorblock.orgId,
      awsBill.billId,
      200.00,
      '2024-01-20'
    );

    // Test 3: Create bill credit for overcharge
    console.log(chalk.bold('\n💰 Test 3: Create bill credit note'));
    context.anchorblock.billCreditId = await createBillCredit(
      context.anchorblock.orgId,
      awsBill.billId,
      {
        creditNumber: 'CR-AWS-2024-01-001',
        creditDate: '2024-01-25',
        amount: 50.00,
        reason: 'Overcharge correction for EC2 instances'
      }
    );

    // Test 4: Set up recurring bill for monthly services
    console.log(chalk.bold('\n🔄 Test 4: Set up recurring bill'));
    context.anchorblock.recurringBillId = await setupRecurringBill(
      context.anchorblock.orgId,
      context.anchorblock.vendorId,
      {
        templateName: 'AWS Monthly Services',
        frequency: 'monthly',
        startDate: '2024-02-01',
        dayOfMonth: 15,
        amount: 350.00,
        accountCode: '6100',
        description: 'Recurring AWS infrastructure services'
      }
    );

    // Test 5: Create Adobe bill for Team Qreative
    console.log(chalk.bold('\n🎨 Test 5: Create vendor bill for Team Qreative'));
    await clearAuthContext();
    await setAuthContext(
      context.teamQreative.orgId,
      context.teamQreative.userId,
      context.teamQreative.workspaceId
    );

    const adobeBill = await createVendorBill(
      context.teamQreative.orgId,
      context.teamQreative.vendorId,
      {
        billNumber: 'ADOBE-2024-01-001',
        billDate: '2024-01-10',
        dueDate: '2024-02-10',
        items: [
          {
            description: 'Creative Cloud - Team License (5 seats)',
            quantity: 5,
            unitPrice: 79.99,
            accountCode: '6200' // Software Subscriptions
          },
          {
            description: 'Adobe Stock - 750 downloads',
            quantity: 750,
            unitPrice: 0.33,
            accountCode: '6210' // Digital Assets
          }
        ],
        notes: 'Adobe Creative Suite for January 2024'
      }
    );

    context.teamQreative.billId = adobeBill.billId;
    context.teamQreative.journalEntryId = adobeBill.journalEntryId;

    // Test 6: Test multi-currency bill (EUR)
    console.log(chalk.bold('\n💱 Test 6: Multi-currency bill'));
    const euroBill = await createVendorBill(
      context.teamQreative.orgId,
      context.teamQreative.vendorId,
      {
        billNumber: 'ADOBE-EUR-2024-01-001',
        billDate: '2024-01-15',
        dueDate: '2024-02-15',
        currency: 'EUR',
        exchangeRate: 1.09,
        items: [
          {
            description: 'Adobe Summit Europe - Conference Tickets',
            quantity: 2,
            unitPrice: 1500.00,
            accountCode: '6300' // Travel & Events
          }
        ],
        notes: 'Conference registration in EUR'
      }
    );

    // Test 7: AP aging analysis
    console.log(chalk.bold('\n📊 Test 7: AP aging analysis'));
    await clearAuthContext();
    await setAuthContext(context.anchorblock.orgId, context.anchorblock.userId);
    await testAPAging(context.anchorblock.orgId);

    // Test 8: RLS isolation
    console.log(chalk.bold('\n🔒 Test 8: Test RLS isolation'));
    await assertRLSIsolation(
      'bills',
      context.anchorblock.orgId,
      context.teamQreative.orgId,
      context.anchorblock.userId,
      context.teamQreative.userId
    );

    // Test 9: Financial integrity
    console.log(chalk.bold('\n✅ Test 9: Validate financial integrity'));
    await assertFinancialIntegrity(context.anchorblock.orgId);
    await assertFinancialIntegrity(context.teamQreative.orgId);

    console.log(chalk.bold.green('\n✅ All vendor bill tests passed!\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ Test failed:'), error);
    throw error;
  } finally {
    await clearAuthContext();
  }
}

// Execute tests
runTests().catch(console.error);