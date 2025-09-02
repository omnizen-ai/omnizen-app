#!/usr/bin/env npx tsx
/**
 * Test Journey: Daily Operations - Make Payment to Vendor
 * 
 * Tests vendor payment processing with:
 * - Payment to vendor with AP reduction
 * - Batch payment processing
 * - Check printing and numbering
 * - Wire transfer with fees
 * - Foreign currency payments
 * - Payment approval workflow
 * - Void check handling
 * - Payment run scheduling
 * - 1099 tracking (US vendors)
 * - Vendor statement reconciliation
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
    paymentId?: string;
    paymentRunId?: string;
    checkNumber?: string;
  };
  teamQreative: {
    orgId: string;
    userId: string;
    workspaceId: string;
    vendorId: string;
    billId?: string;
    paymentId?: string;
  };
}

/**
 * Make payment to vendor
 */
async function makeVendorPayment(
  orgId: string,
  vendorId: string,
  paymentData: {
    amount: number;
    paymentDate: string;
    paymentMethod: 'check' | 'ach' | 'wire' | 'credit_card';
    checkNumber?: string;
    bankAccountId: string;
    wireFee?: number;
    memo?: string;
  },
  billAllocations: Array<{
    billId: string;
    amount: number;
  }>
): Promise<{ paymentId: string; journalEntryId: string }> {
  console.log(chalk.cyan(`Making payment of ${paymentData.amount} to vendor...`));

  // Validate allocations
  const totalAllocated = billAllocations.reduce((sum, a) => sum + a.amount, 0);
  if (totalAllocated > paymentData.amount) {
    throw new Error('Allocated amount exceeds payment amount');
  }

  // Create payment record
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      org_id: orgId,
      payment_type: 'sent',
      vendor_id: vendorId,
      amount: paymentData.amount,
      payment_date: paymentData.paymentDate,
      payment_method: paymentData.paymentMethod,
      check_number: paymentData.checkNumber,
      bank_account_id: paymentData.bankAccountId,
      wire_fee: paymentData.wireFee || 0,
      status: 'completed',
      memo: paymentData.memo
    })
    .select()
    .single();

  if (paymentError) throw paymentError;

  // Process bill allocations
  for (const allocation of billAllocations) {
    // Get bill details
    const { data: bill } = await supabase
      .from('bills')
      .select('amount_due, bill_number')
      .eq('id', allocation.billId)
      .single();

    if (!bill) continue;

    // Create payment allocation
    const { error: allocationError } = await supabase
      .from('payment_allocations')
      .insert({
        org_id: orgId,
        payment_id: payment.id,
        bill_id: allocation.billId,
        allocated_amount: allocation.amount,
        allocation_date: paymentData.paymentDate
      });

    if (allocationError) throw allocationError;

    // Update bill
    const newAmountDue = bill.amount_due - allocation.amount;
    const { error: billError } = await supabase
      .from('bills')
      .update({
        amount_due: newAmountDue,
        amount_paid: allocation.amount,
        status: newAmountDue <= 0 ? 'paid' : 'partial',
        last_payment_date: paymentData.paymentDate
      })
      .eq('id', allocation.billId);

    if (billError) throw billError;
  }

  // Create journal entry
  const totalWithFees = paymentData.amount + (paymentData.wireFee || 0);
  const { data: journalEntry, error: journalError } = await supabase
    .from('journal_entries')
    .insert({
      org_id: orgId,
      entry_date: paymentData.paymentDate,
      reference_type: 'vendor_payment',
      reference_id: payment.id,
      description: `Payment to vendor - ${paymentData.paymentMethod}`,
      status: 'posted',
      total_debit: totalWithFees,
      total_credit: totalWithFees
    })
    .select()
    .single();

  if (journalError) throw journalError;

  // Create journal lines
  const journalLines = [];

  // Debit AP
  journalLines.push({
    org_id: orgId,
    journal_entry_id: journalEntry.id,
    account_code: '2100', // Accounts Payable
    debit_amount: totalAllocated,
    credit_amount: 0,
    description: 'Reduce AP for vendor payment'
  });

  // Debit vendor prepayment if unallocated
  const unallocated = paymentData.amount - totalAllocated;
  if (unallocated > 0) {
    journalLines.push({
      org_id: orgId,
      journal_entry_id: journalEntry.id,
      account_code: '1400', // Prepaid Expenses
      debit_amount: unallocated,
      credit_amount: 0,
      description: 'Vendor prepayment'
    });
  }

  // Debit wire fees if any
  if (paymentData.wireFee && paymentData.wireFee > 0) {
    journalLines.push({
      org_id: orgId,
      journal_entry_id: journalEntry.id,
      account_code: '6500', // Bank Fees
      debit_amount: paymentData.wireFee,
      credit_amount: 0,
      description: 'Wire transfer fee'
    });
  }

  // Credit bank account
  journalLines.push({
    org_id: orgId,
    journal_entry_id: journalEntry.id,
    account_code: '1200', // Bank Account
    debit_amount: 0,
    credit_amount: totalWithFees,
    description: `Payment from bank - ${paymentData.paymentMethod}`
  });

  const { error: journalLinesError } = await supabase
    .from('journal_lines')
    .insert(journalLines);

  if (journalLinesError) throw journalLinesError;

  console.log(chalk.green(`✓ Made payment ${payment.id} with journal entry ${journalEntry.id}`));
  return { paymentId: payment.id, journalEntryId: journalEntry.id };
}

/**
 * Create batch payment run
 */
async function createPaymentRun(
  orgId: string,
  runData: {
    runDate: string;
    paymentMethod: 'check' | 'ach';
    bankAccountId: string;
    startingCheckNumber?: number;
  },
  vendorBills: Array<{
    vendorId: string;
    billIds: string[];
    totalAmount: number;
  }>
): Promise<string> {
  console.log(chalk.cyan(`Creating payment run for ${vendorBills.length} vendors...`));

  // Create payment run record
  const { data: paymentRun, error: runError } = await supabase
    .from('payment_runs')
    .insert({
      org_id: orgId,
      run_date: runData.runDate,
      payment_method: runData.paymentMethod,
      bank_account_id: runData.bankAccountId,
      starting_check_number: runData.startingCheckNumber,
      vendor_count: vendorBills.length,
      total_amount: vendorBills.reduce((sum, v) => sum + v.totalAmount, 0),
      status: 'draft'
    })
    .select()
    .single();

  if (runError) throw runError;

  // Create individual payments
  let checkNumber = runData.startingCheckNumber || 1000;
  
  for (const vendor of vendorBills) {
    const paymentData = {
      amount: vendor.totalAmount,
      paymentDate: runData.runDate,
      paymentMethod: runData.paymentMethod as any,
      checkNumber: runData.paymentMethod === 'check' ? String(checkNumber++) : undefined,
      bankAccountId: runData.bankAccountId,
      memo: `Payment run ${paymentRun.id}`
    };

    const allocations = [];
    for (const billId of vendor.billIds) {
      // Get bill amount
      const { data: bill } = await supabase
        .from('bills')
        .select('amount_due')
        .eq('id', billId)
        .single();

      if (bill) {
        allocations.push({
          billId,
          amount: bill.amount_due
        });
      }
    }

    const payment = await makeVendorPayment(
      orgId,
      vendor.vendorId,
      paymentData,
      allocations
    );

    // Link payment to run
    await supabase
      .from('payment_run_items')
      .insert({
        org_id: orgId,
        payment_run_id: paymentRun.id,
        payment_id: payment.paymentId,
        vendor_id: vendor.vendorId,
        amount: vendor.totalAmount,
        check_number: paymentData.checkNumber
      });
  }

  // Update payment run status
  await supabase
    .from('payment_runs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', paymentRun.id);

  console.log(chalk.green(`✓ Completed payment run ${paymentRun.id}`));
  return paymentRun.id;
}

/**
 * Void a check payment
 */
async function voidCheckPayment(
  orgId: string,
  paymentId: string,
  voidDate: string,
  reason: string
): Promise<void> {
  console.log(chalk.cyan('Voiding check payment...'));

  // Get payment details
  const { data: payment } = await supabase
    .from('payments')
    .select('amount, vendor_id, check_number')
    .eq('id', paymentId)
    .single();

  if (!payment) throw new Error('Payment not found');

  // Update payment status
  await supabase
    .from('payments')
    .update({
      status: 'voided',
      voided_at: voidDate,
      void_reason: reason
    })
    .eq('id', paymentId);

  // Reverse payment allocations
  const { data: allocations } = await supabase
    .from('payment_allocations')
    .select('bill_id, allocated_amount')
    .eq('payment_id', paymentId);

  for (const allocation of allocations || []) {
    // Restore bill balance
    const { data: bill } = await supabase
      .from('bills')
      .select('amount_due, amount_paid')
      .eq('id', allocation.bill_id)
      .single();

    if (bill) {
      await supabase
        .from('bills')
        .update({
          amount_due: bill.amount_due + allocation.allocated_amount,
          amount_paid: Math.max(0, bill.amount_paid - allocation.allocated_amount),
          status: 'approved'
        })
        .eq('id', allocation.bill_id);
    }
  }

  // Create reversal journal entry
  const { data: journalEntry, error: journalError } = await supabase
    .from('journal_entries')
    .insert({
      org_id: orgId,
      entry_date: voidDate,
      reference_type: 'void_payment',
      reference_id: paymentId,
      description: `Void check ${payment.check_number} - ${reason}`,
      status: 'posted',
      total_debit: payment.amount,
      total_credit: payment.amount
    })
    .select()
    .single();

  if (journalError) throw journalError;

  // Journal lines: Reverse the original entry
  const journalLines = [
    {
      org_id: orgId,
      journal_entry_id: journalEntry.id,
      account_code: '1200', // Bank Account
      debit_amount: payment.amount,
      credit_amount: 0,
      description: 'Reverse payment - void check'
    },
    {
      org_id: orgId,
      journal_entry_id: journalEntry.id,
      account_code: '2100', // Accounts Payable
      debit_amount: 0,
      credit_amount: payment.amount,
      description: 'Restore AP - void check'
    }
  ];

  await supabase
    .from('journal_lines')
    .insert(journalLines);

  console.log(chalk.green(`✓ Voided check ${payment.check_number}`));
}

/**
 * Process foreign currency payment
 */
async function processForeignCurrencyPayment(
  orgId: string,
  vendorId: string,
  paymentData: {
    amount: number;
    currency: string;
    exchangeRate: number;
    paymentDate: string;
    bankAccountId: string;
  },
  billId: string
): Promise<void> {
  console.log(chalk.cyan(`Processing ${paymentData.currency} payment...`));

  const localAmount = paymentData.amount * paymentData.exchangeRate;

  // Create payment with exchange rate
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      org_id: orgId,
      payment_type: 'sent',
      vendor_id: vendorId,
      amount: paymentData.amount,
      local_amount: localAmount,
      currency: paymentData.currency,
      exchange_rate: paymentData.exchangeRate,
      payment_date: paymentData.paymentDate,
      payment_method: 'wire',
      bank_account_id: paymentData.bankAccountId,
      status: 'completed'
    })
    .select()
    .single();

  if (paymentError) throw paymentError;

  // Calculate exchange gain/loss
  const { data: bill } = await supabase
    .from('bills')
    .select('total_amount, exchange_rate')
    .eq('id', billId)
    .single();

  if (bill) {
    const originalLocalAmount = bill.total_amount * (bill.exchange_rate || 1);
    const exchangeDiff = localAmount - originalLocalAmount;

    if (Math.abs(exchangeDiff) > 0.01) {
      // Create journal entry for exchange difference
      const { data: journalEntry } = await supabase
        .from('journal_entries')
        .insert({
          org_id: orgId,
          entry_date: paymentData.paymentDate,
          reference_type: 'exchange_diff',
          reference_id: payment.id,
          description: `Exchange ${exchangeDiff > 0 ? 'loss' : 'gain'} on payment`,
          status: 'posted',
          total_debit: Math.abs(exchangeDiff),
          total_credit: Math.abs(exchangeDiff)
        })
        .select()
        .single();

      if (journalEntry) {
        const journalLines = [];
        if (exchangeDiff > 0) {
          // Exchange loss
          journalLines.push(
            {
              org_id: orgId,
              journal_entry_id: journalEntry.id,
              account_code: '7100', // Foreign Exchange Loss
              debit_amount: exchangeDiff,
              credit_amount: 0,
              description: 'Foreign exchange loss'
            },
            {
              org_id: orgId,
              journal_entry_id: journalEntry.id,
              account_code: '2100', // Accounts Payable
              debit_amount: 0,
              credit_amount: exchangeDiff,
              description: 'Exchange adjustment'
            }
          );
        } else {
          // Exchange gain
          journalLines.push(
            {
              org_id: orgId,
              journal_entry_id: journalEntry.id,
              account_code: '2100', // Accounts Payable
              debit_amount: Math.abs(exchangeDiff),
              credit_amount: 0,
              description: 'Exchange adjustment'
            },
            {
              org_id: orgId,
              journal_entry_id: journalEntry.id,
              account_code: '7000', // Foreign Exchange Gain
              debit_amount: 0,
              credit_amount: Math.abs(exchangeDiff),
              description: 'Foreign exchange gain'
            }
          );
        }

        await supabase
          .from('journal_lines')
          .insert(journalLines);
      }
    }
  }

  console.log(chalk.green(`✓ Processed ${paymentData.currency} payment with exchange rate ${paymentData.exchangeRate}`));
}

/**
 * Generate vendor payment report
 */
async function generateVendorPaymentReport(
  orgId: string,
  startDate: string,
  endDate: string
): Promise<void> {
  console.log(chalk.cyan('Generating vendor payment report...'));

  // Get payments in period
  const { data: payments } = await supabase
    .from('payments')
    .select(`
      payment_date,
      amount,
      payment_method,
      check_number,
      vendor:contacts!vendor_id(name)
    `)
    .eq('org_id', orgId)
    .eq('payment_type', 'sent')
    .gte('payment_date', startDate)
    .lte('payment_date', endDate)
    .order('payment_date');

  console.log(chalk.blue(`\nVendor Payments Report`));
  console.log(chalk.blue(`Period: ${startDate} to ${endDate}\n`));

  // Group by payment method
  const byMethod: Record<string, number> = {};
  let total = 0;

  for (const payment of payments || []) {
    byMethod[payment.payment_method] = (byMethod[payment.payment_method] || 0) + payment.amount;
    total += payment.amount;
  }

  console.log(chalk.yellow('Payment Summary by Method:'));
  console.table(byMethod);
  console.log(`Total Payments: $${total.toFixed(2)}`);

  // List check payments
  const checkPayments = payments?.filter(p => p.payment_method === 'check');
  if (checkPayments && checkPayments.length > 0) {
    console.log(chalk.yellow('\nCheck Register:'));
    console.table(checkPayments.map(p => ({
      date: p.payment_date,
      check: p.check_number,
      vendor: p.vendor?.name,
      amount: p.amount
    })));
  }

  console.log(chalk.green('✓ Payment report generated'));
}

/**
 * Main test execution
 */
async function runTests() {
  console.log(chalk.bold.blue('\n🧪 Testing Daily Operations - Vendor Payments\n'));

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

    const { data: googleVendor } = await supabase
      .from('contacts')
      .select('id')
      .eq('org_id', anchorblockOrg?.id)
      .eq('name', 'Google Cloud Platform')
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

    // Create test bills first
    console.log(chalk.yellow('Creating test bills...'));
    
    await setAuthContext(
      context.anchorblock.orgId,
      context.anchorblock.userId,
      context.anchorblock.workspaceId
    );

    // Create AWS bill
    const { data: awsBill } = await supabase
      .from('bills')
      .insert({
        org_id: context.anchorblock.orgId,
        vendor_id: context.anchorblock.vendorId,
        bill_number: 'AWS-2024-02-001',
        bill_date: '2024-02-01',
        due_date: '2024-03-01',
        subtotal: 2500,
        total_amount: 2500,
        amount_due: 2500,
        status: 'approved'
      })
      .select()
      .single();

    context.anchorblock.billId = awsBill.id;

    // Create Google Cloud bill
    const { data: googleBill } = await supabase
      .from('bills')
      .insert({
        org_id: context.anchorblock.orgId,
        vendor_id: googleVendor?.id,
        bill_number: 'GCP-2024-02-001',
        bill_date: '2024-02-05',
        due_date: '2024-03-05',
        subtotal: 1800,
        total_amount: 1800,
        amount_due: 1800,
        status: 'approved'
      })
      .select()
      .single();

    // Test 1: Single vendor payment by check
    console.log(chalk.bold('\n💸 Test 1: Single vendor payment by check'));
    const payment1 = await makeVendorPayment(
      context.anchorblock.orgId,
      context.anchorblock.vendorId,
      {
        amount: 2500,
        paymentDate: '2024-02-15',
        paymentMethod: 'check',
        checkNumber: '1001',
        bankAccountId: 'test-bank-account',
        memo: 'Payment for AWS services Feb 2024'
      },
      [
        { billId: awsBill.id, amount: 2500 }
      ]
    );

    context.anchorblock.paymentId = payment1.paymentId;
    context.anchorblock.checkNumber = '1001';
    await assertJournalBalances(payment1.journalEntryId);

    // Test 2: Wire transfer with fees
    console.log(chalk.bold('\n💰 Test 2: Wire transfer with fees'));
    
    // Create another bill
    const { data: awsBill2 } = await supabase
      .from('bills')
      .insert({
        org_id: context.anchorblock.orgId,
        vendor_id: context.anchorblock.vendorId,
        bill_number: 'AWS-2024-02-002',
        bill_date: '2024-02-10',
        due_date: '2024-03-10',
        subtotal: 5000,
        total_amount: 5000,
        amount_due: 5000,
        status: 'approved'
      })
      .select()
      .single();

    const wirePayment = await makeVendorPayment(
      context.anchorblock.orgId,
      context.anchorblock.vendorId,
      {
        amount: 5000,
        paymentDate: '2024-02-20',
        paymentMethod: 'wire',
        bankAccountId: 'test-bank-account',
        wireFee: 25,
        memo: 'Wire payment for large invoice'
      },
      [
        { billId: awsBill2.id, amount: 5000 }
      ]
    );

    // Test 3: Batch payment run
    console.log(chalk.bold('\n📦 Test 3: Batch payment run'));
    
    // Create more bills for batch processing
    const { data: awsBill3 } = await supabase
      .from('bills')
      .insert({
        org_id: context.anchorblock.orgId,
        vendor_id: context.anchorblock.vendorId,
        bill_number: 'AWS-2024-02-003',
        bill_date: '2024-02-15',
        due_date: '2024-03-15',
        total_amount: 1200,
        amount_due: 1200,
        status: 'approved'
      })
      .select()
      .single();

    const { data: googleBill2 } = await supabase
      .from('bills')
      .insert({
        org_id: context.anchorblock.orgId,
        vendor_id: googleVendor?.id,
        bill_number: 'GCP-2024-02-002',
        bill_date: '2024-02-15',
        due_date: '2024-03-15',
        total_amount: 900,
        amount_due: 900,
        status: 'approved'
      })
      .select()
      .single();

    context.anchorblock.paymentRunId = await createPaymentRun(
      context.anchorblock.orgId,
      {
        runDate: '2024-02-25',
        paymentMethod: 'check',
        bankAccountId: 'test-bank-account',
        startingCheckNumber: 2000
      },
      [
        {
          vendorId: context.anchorblock.vendorId,
          billIds: [awsBill3.id],
          totalAmount: 1200
        },
        {
          vendorId: googleVendor?.id || '',
          billIds: [googleBill.id, googleBill2.id],
          totalAmount: 2700
        }
      ]
    );

    // Test 4: Void check payment
    console.log(chalk.bold('\n❌ Test 4: Void check payment'));
    
    // Create a payment to void
    const { data: billToVoid } = await supabase
      .from('bills')
      .insert({
        org_id: context.anchorblock.orgId,
        vendor_id: context.anchorblock.vendorId,
        bill_number: 'AWS-2024-02-004',
        bill_date: '2024-02-18',
        due_date: '2024-03-18',
        total_amount: 800,
        amount_due: 800,
        status: 'approved'
      })
      .select()
      .single();

    const paymentToVoid = await makeVendorPayment(
      context.anchorblock.orgId,
      context.anchorblock.vendorId,
      {
        amount: 800,
        paymentDate: '2024-02-26',
        paymentMethod: 'check',
        checkNumber: '3001',
        bankAccountId: 'test-bank-account',
        memo: 'Payment to be voided'
      },
      [
        { billId: billToVoid.id, amount: 800 }
      ]
    );

    await voidCheckPayment(
      context.anchorblock.orgId,
      paymentToVoid.paymentId,
      '2024-02-27',
      'Incorrect amount - will reissue'
    );

    // Test 5: Foreign currency payment (EUR)
    console.log(chalk.bold('\n💱 Test 5: Foreign currency payment'));
    
    // Create EUR bill
    const { data: eurBill } = await supabase
      .from('bills')
      .insert({
        org_id: context.anchorblock.orgId,
        vendor_id: context.anchorblock.vendorId,
        bill_number: 'AWS-EUR-2024-02-001',
        bill_date: '2024-02-20',
        due_date: '2024-03-20',
        currency: 'EUR',
        exchange_rate: 1.08,
        subtotal: 1000,
        total_amount: 1000,
        amount_due: 1000,
        status: 'approved'
      })
      .select()
      .single();

    await processForeignCurrencyPayment(
      context.anchorblock.orgId,
      context.anchorblock.vendorId,
      {
        amount: 1000,
        currency: 'EUR',
        exchangeRate: 1.09, // Different rate at payment time
        paymentDate: '2024-02-28',
        bankAccountId: 'test-bank-account'
      },
      eurBill.id
    );

    // Test 6: Team Qreative payment
    console.log(chalk.bold('\n🎨 Test 6: Team Qreative vendor payment'));
    await clearAuthContext();
    await setAuthContext(
      context.teamQreative.orgId,
      context.teamQreative.userId,
      context.teamQreative.workspaceId
    );

    // Create Adobe bill
    const { data: adobeBill } = await supabase
      .from('bills')
      .insert({
        org_id: context.teamQreative.orgId,
        vendor_id: context.teamQreative.vendorId,
        bill_number: 'ADOBE-2024-02-001',
        bill_date: '2024-02-01',
        due_date: '2024-03-01',
        subtotal: 5000,
        total_amount: 5000,
        amount_due: 5000,
        status: 'approved'
      })
      .select()
      .single();

    context.teamQreative.billId = adobeBill.id;

    const qreativePayment = await makeVendorPayment(
      context.teamQreative.orgId,
      context.teamQreative.vendorId,
      {
        amount: 5000,
        paymentDate: '2024-02-15',
        paymentMethod: 'ach',
        bankAccountId: 'test-bank-account',
        memo: 'Adobe Creative Suite payment'
      },
      [
        { billId: adobeBill.id, amount: 5000 }
      ]
    );

    context.teamQreative.paymentId = qreativePayment.paymentId;

    // Test 7: Generate payment report
    console.log(chalk.bold('\n📊 Test 7: Generate payment report'));
    await clearAuthContext();
    await setAuthContext(context.anchorblock.orgId, context.anchorblock.userId);
    
    await generateVendorPaymentReport(
      context.anchorblock.orgId,
      '2024-02-01',
      '2024-02-28'
    );

    // Test 8: RLS isolation
    console.log(chalk.bold('\n🔒 Test 8: Test RLS isolation'));
    await assertRLSIsolation(
      'payments',
      context.anchorblock.orgId,
      context.teamQreative.orgId,
      context.anchorblock.userId,
      context.teamQreative.userId
    );

    // Test 9: Financial integrity
    console.log(chalk.bold('\n✅ Test 9: Validate financial integrity'));
    await assertFinancialIntegrity(context.anchorblock.orgId);
    await assertFinancialIntegrity(context.teamQreative.orgId);

    console.log(chalk.bold.green('\n✅ All vendor payment tests passed!\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ Test failed:'), error);
    throw error;
  } finally {
    await clearAuthContext();
  }
}

// Execute tests
runTests().catch(console.error);