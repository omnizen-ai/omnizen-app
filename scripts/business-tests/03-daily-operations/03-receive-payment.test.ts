#!/usr/bin/env npx tsx
/**
 * Test Journey: Daily Operations - Receive Payment
 * 
 * Tests customer payment processing with:
 * - Payment receipt and allocation
 * - AR reduction journal entries
 * - Partial payment handling
 * - Overpayment and credit balance
 * - Payment methods (bank, card, cash)
 * - Early payment discounts
 * - Multi-invoice payment allocation
 * - Bank deposit reconciliation
 * - Payment reversal/NSF handling
 * - Customer statement updates
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
    customerId: string;
    invoiceId?: string;
    paymentId?: string;
    depositId?: string;
  };
  teamQreative: {
    orgId: string;
    userId: string;
    workspaceId: string;
    customerId: string;
    invoiceId?: string;
    paymentId?: string;
  };
}

/**
 * Record customer payment
 */
async function recordPaymentReceipt(
  orgId: string,
  customerId: string,
  paymentData: {
    amount: number;
    paymentDate: string;
    paymentMethod: 'bank_transfer' | 'credit_card' | 'cash' | 'check' | 'wire';
    reference: string;
    bankAccountId?: string;
    processingFee?: number;
    notes?: string;
  },
  allocations: Array<{
    invoiceId: string;
    amount: number;
  }>
): Promise<{ paymentId: string; journalEntryId: string }> {
  console.log(chalk.cyan(`Recording payment of ${paymentData.amount}...`));

  // Validate allocations don't exceed payment
  const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
  if (totalAllocated > paymentData.amount) {
    throw new Error('Allocated amount exceeds payment amount');
  }

  // Create payment record
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      org_id: orgId,
      payment_type: 'received',
      customer_id: customerId,
      amount: paymentData.amount,
      payment_date: paymentData.paymentDate,
      payment_method: paymentData.paymentMethod,
      reference_number: paymentData.reference,
      bank_account_id: paymentData.bankAccountId,
      processing_fee: paymentData.processingFee || 0,
      status: 'completed',
      notes: paymentData.notes
    })
    .select()
    .single();

  if (paymentError) throw paymentError;

  // Process allocations
  for (const allocation of allocations) {
    // Get invoice details
    const { data: invoice } = await supabase
      .from('invoices')
      .select('amount_due, invoice_number')
      .eq('id', allocation.invoiceId)
      .single();

    if (!invoice) continue;

    // Create payment allocation
    const { error: allocationError } = await supabase
      .from('payment_allocations')
      .insert({
        org_id: orgId,
        payment_id: payment.id,
        invoice_id: allocation.invoiceId,
        allocated_amount: allocation.amount,
        allocation_date: paymentData.paymentDate
      });

    if (allocationError) throw allocationError;

    // Update invoice
    const newAmountDue = invoice.amount_due - allocation.amount;
    const { error: invoiceError } = await supabase
      .from('invoices')
      .update({
        amount_due: newAmountDue,
        amount_paid: allocation.amount,
        status: newAmountDue <= 0 ? 'paid' : 'partial',
        last_payment_date: paymentData.paymentDate
      })
      .eq('id', allocation.invoiceId);

    if (invoiceError) throw invoiceError;
  }

  // Handle unallocated amount (customer credit)
  const unallocated = paymentData.amount - totalAllocated;
  if (unallocated > 0) {
    const { error: creditError } = await supabase
      .from('customer_credits')
      .insert({
        org_id: orgId,
        customer_id: customerId,
        payment_id: payment.id,
        credit_amount: unallocated,
        available_amount: unallocated,
        credit_date: paymentData.paymentDate,
        notes: 'Unallocated payment - available as credit'
      });

    if (creditError) throw creditError;
  }

  // Create journal entry
  const netAmount = paymentData.amount - (paymentData.processingFee || 0);
  const { data: journalEntry, error: journalError } = await supabase
    .from('journal_entries')
    .insert({
      org_id: orgId,
      entry_date: paymentData.paymentDate,
      reference_type: 'payment',
      reference_id: payment.id,
      description: `Payment received - Ref: ${paymentData.reference}`,
      status: 'posted',
      total_debit: paymentData.amount,
      total_credit: paymentData.amount
    })
    .select()
    .single();

  if (journalError) throw journalError;

  // Create journal lines
  const journalLines = [];

  // Debit bank account
  journalLines.push({
    org_id: orgId,
    journal_entry_id: journalEntry.id,
    account_code: '1200', // Bank Account
    debit_amount: netAmount,
    credit_amount: 0,
    description: `Deposit - ${paymentData.paymentMethod}`
  });

  // Debit processing fees if any
  if (paymentData.processingFee && paymentData.processingFee > 0) {
    journalLines.push({
      org_id: orgId,
      journal_entry_id: journalEntry.id,
      account_code: '6500', // Bank Fees
      debit_amount: paymentData.processingFee,
      credit_amount: 0,
      description: 'Payment processing fee'
    });
  }

  // Credit AR for allocated amounts
  if (totalAllocated > 0) {
    journalLines.push({
      org_id: orgId,
      journal_entry_id: journalEntry.id,
      account_code: '1300', // Accounts Receivable
      debit_amount: 0,
      credit_amount: totalAllocated,
      description: 'Reduce AR - payment received'
    });
  }

  // Credit customer deposits for unallocated
  if (unallocated > 0) {
    journalLines.push({
      org_id: orgId,
      journal_entry_id: journalEntry.id,
      account_code: '2200', // Customer Deposits (liability)
      debit_amount: 0,
      credit_amount: unallocated,
      description: 'Customer credit - unallocated payment'
    });
  }

  const { error: journalLinesError } = await supabase
    .from('journal_lines')
    .insert(journalLines);

  if (journalLinesError) throw journalLinesError;

  console.log(chalk.green(`✓ Recorded payment ${payment.id} with journal entry ${journalEntry.id}`));
  return { paymentId: payment.id, journalEntryId: journalEntry.id };
}

/**
 * Apply early payment discount
 */
async function applyEarlyPaymentDiscount(
  orgId: string,
  invoiceId: string,
  discountAmount: number,
  paymentDate: string
): Promise<void> {
  console.log(chalk.cyan(`Applying early payment discount of ${discountAmount}...`));

  // Create discount journal entry
  const { data: journalEntry, error: journalError } = await supabase
    .from('journal_entries')
    .insert({
      org_id: orgId,
      entry_date: paymentDate,
      reference_type: 'discount',
      reference_id: invoiceId,
      description: `Early payment discount`,
      status: 'posted',
      total_debit: discountAmount,
      total_credit: discountAmount
    })
    .select()
    .single();

  if (journalError) throw journalError;

  // Journal lines: Debit discount expense, Credit AR
  const journalLines = [
    {
      org_id: orgId,
      journal_entry_id: journalEntry.id,
      account_code: '4100', // Sales Discounts
      debit_amount: discountAmount,
      credit_amount: 0,
      description: 'Early payment discount given'
    },
    {
      org_id: orgId,
      journal_entry_id: journalEntry.id,
      account_code: '1300', // Accounts Receivable
      debit_amount: 0,
      credit_amount: discountAmount,
      description: 'Reduce AR for discount'
    }
  ];

  const { error: journalLinesError } = await supabase
    .from('journal_lines')
    .insert(journalLines);

  if (journalLinesError) throw journalLinesError;

  // Update invoice
  const { data: invoice } = await supabase
    .from('invoices')
    .select('amount_due')
    .eq('id', invoiceId)
    .single();

  if (invoice) {
    await supabase
      .from('invoices')
      .update({
        amount_due: invoice.amount_due - discountAmount,
        discount_amount: discountAmount,
        notes: 'Early payment discount applied'
      })
      .eq('id', invoiceId);
  }

  console.log(chalk.green('✓ Applied early payment discount'));
}

/**
 * Create bank deposit for multiple payments
 */
async function createBankDeposit(
  orgId: string,
  paymentIds: string[],
  depositData: {
    depositDate: string;
    bankAccountId: string;
    depositNumber: string;
  }
): Promise<string> {
  console.log(chalk.cyan(`Creating bank deposit ${depositData.depositNumber}...`));

  // Get payment details
  const { data: payments } = await supabase
    .from('payments')
    .select('id, amount')
    .in('id', paymentIds);

  if (!payments || payments.length === 0) {
    throw new Error('No payments found');
  }

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  // Create deposit record
  const { data: deposit, error: depositError } = await supabase
    .from('bank_deposits')
    .insert({
      org_id: orgId,
      deposit_date: depositData.depositDate,
      bank_account_id: depositData.bankAccountId,
      deposit_number: depositData.depositNumber,
      total_amount: totalAmount,
      payment_count: payments.length,
      status: 'deposited'
    })
    .select()
    .single();

  if (depositError) throw depositError;

  // Link payments to deposit
  const depositItems = payments.map(p => ({
    org_id: orgId,
    deposit_id: deposit.id,
    payment_id: p.id,
    amount: p.amount
  }));

  const { error: itemsError } = await supabase
    .from('bank_deposit_items')
    .insert(depositItems);

  if (itemsError) throw itemsError;

  // Update payments
  await supabase
    .from('payments')
    .update({
      deposit_id: deposit.id,
      deposited_at: depositData.depositDate
    })
    .in('id', paymentIds);

  console.log(chalk.green(`✓ Created bank deposit ${deposit.id} for ${payments.length} payments`));
  return deposit.id;
}

/**
 * Handle NSF (bounced) payment
 */
async function handleNSFPayment(
  orgId: string,
  paymentId: string,
  nsfFee: number
): Promise<void> {
  console.log(chalk.cyan('Handling NSF payment...'));

  // Get payment details
  const { data: payment } = await supabase
    .from('payments')
    .select('amount, customer_id')
    .eq('id', paymentId)
    .single();

  if (!payment) throw new Error('Payment not found');

  // Update payment status
  await supabase
    .from('payments')
    .update({
      status: 'nsf',
      nsf_date: new Date().toISOString()
    })
    .eq('id', paymentId);

  // Reverse payment allocations
  const { data: allocations } = await supabase
    .from('payment_allocations')
    .select('invoice_id, allocated_amount')
    .eq('payment_id', paymentId);

  for (const allocation of allocations || []) {
    // Restore invoice balance
    const { data: invoice } = await supabase
      .from('invoices')
      .select('amount_due, amount_paid')
      .eq('id', allocation.invoice_id)
      .single();

    if (invoice) {
      await supabase
        .from('invoices')
        .update({
          amount_due: invoice.amount_due + allocation.allocated_amount,
          amount_paid: Math.max(0, invoice.amount_paid - allocation.allocated_amount),
          status: 'overdue'
        })
        .eq('id', allocation.invoice_id);
    }
  }

  // Create reversal journal entry
  const { data: journalEntry, error: journalError } = await supabase
    .from('journal_entries')
    .insert({
      org_id: orgId,
      entry_date: new Date().toISOString().split('T')[0],
      reference_type: 'nsf',
      reference_id: paymentId,
      description: 'NSF payment reversal',
      status: 'posted',
      total_debit: payment.amount + nsfFee,
      total_credit: payment.amount + nsfFee
    })
    .select()
    .single();

  if (journalError) throw journalError;

  // Journal lines
  const journalLines = [
    {
      org_id: orgId,
      journal_entry_id: journalEntry.id,
      account_code: '1300', // Accounts Receivable
      debit_amount: payment.amount,
      credit_amount: 0,
      description: 'Restore AR for NSF payment'
    },
    {
      org_id: orgId,
      journal_entry_id: journalEntry.id,
      account_code: '1300', // AR for NSF fee
      debit_amount: nsfFee,
      credit_amount: 0,
      description: 'NSF fee charged to customer'
    },
    {
      org_id: orgId,
      journal_entry_id: journalEntry.id,
      account_code: '1200', // Bank Account
      debit_amount: 0,
      credit_amount: payment.amount + nsfFee,
      description: 'Reverse deposit and bank fee'
    }
  ];

  await supabase
    .from('journal_lines')
    .insert(journalLines);

  console.log(chalk.green('✓ Processed NSF payment reversal'));
}

/**
 * Generate customer statement
 */
async function generateCustomerStatement(
  orgId: string,
  customerId: string,
  startDate: string,
  endDate: string
): Promise<void> {
  console.log(chalk.cyan('Generating customer statement...'));

  // Get customer details
  const { data: customer } = await supabase
    .from('contacts')
    .select('name')
    .eq('id', customerId)
    .single();

  // Get invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('invoice_number, invoice_date, total_amount, amount_due, status')
    .eq('org_id', orgId)
    .eq('customer_id', customerId)
    .gte('invoice_date', startDate)
    .lte('invoice_date', endDate)
    .order('invoice_date');

  // Get payments
  const { data: payments } = await supabase
    .from('payments')
    .select('payment_date, amount, reference_number')
    .eq('org_id', orgId)
    .eq('customer_id', customerId)
    .gte('payment_date', startDate)
    .lte('payment_date', endDate)
    .order('payment_date');

  console.log(chalk.blue(`\nStatement for ${customer?.name}`));
  console.log(chalk.blue(`Period: ${startDate} to ${endDate}\n`));

  console.log(chalk.yellow('Invoices:'));
  console.table(invoices);

  console.log(chalk.yellow('\nPayments:'));
  console.table(payments);

  const totalInvoiced = invoices?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0;
  const totalPaid = payments?.reduce((sum, pmt) => sum + pmt.amount, 0) || 0;
  const balance = totalInvoiced - totalPaid;

  console.log(chalk.blue(`\nSummary:`));
  console.log(`Total Invoiced: $${totalInvoiced.toFixed(2)}`);
  console.log(`Total Paid: $${totalPaid.toFixed(2)}`);
  console.log(`Balance: $${balance.toFixed(2)}`);

  console.log(chalk.green('✓ Statement generated'));
}

/**
 * Main test execution
 */
async function runTests() {
  console.log(chalk.bold.blue('\n🧪 Testing Daily Operations - Payment Receipt\n'));

  const context: TestContext = {
    anchorblock: {
      orgId: '',
      userId: '',
      workspaceId: '',
      customerId: ''
    },
    teamQreative: {
      orgId: '',
      userId: '',
      workspaceId: '',
      customerId: ''
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

    const { data: techStartup } = await supabase
      .from('contacts')
      .select('id')
      .eq('org_id', anchorblockOrg?.id)
      .eq('name', 'TechStartup Inc')
      .single();

    context.anchorblock = {
      orgId: anchorblockOrg?.id || '',
      userId: anchorblockUser?.id || '',
      workspaceId: anchorblockWorkspace?.id || '',
      customerId: techStartup?.id || ''
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

    const { data: brandCorp } = await supabase
      .from('contacts')
      .select('id')
      .eq('org_id', qreativeOrg?.id)
      .eq('name', 'BrandCorp')
      .single();

    context.teamQreative = {
      orgId: qreativeOrg?.id || '',
      userId: qreativeUser?.id || '',
      workspaceId: qreativeWorkspace?.id || '',
      customerId: brandCorp?.id || ''
    };

    // Validate context
    assertDataExists(context.anchorblock.orgId, 'Anchorblock organization');
    assertDataExists(context.teamQreative.orgId, 'Team Qreative organization');

    // Create test invoices first
    console.log(chalk.yellow('Creating test invoices...'));
    
    await setAuthContext(
      context.anchorblock.orgId,
      context.anchorblock.userId,
      context.anchorblock.workspaceId
    );

    // Create two invoices for testing multi-allocation
    const { data: invoice1 } = await supabase
      .from('invoices')
      .insert({
        org_id: context.anchorblock.orgId,
        customer_id: context.anchorblock.customerId,
        invoice_number: 'INV-2024-1001',
        invoice_date: '2024-01-01',
        due_date: '2024-01-31',
        subtotal: 1000,
        tax_amount: 100,
        total_amount: 1100,
        amount_due: 1100,
        status: 'sent'
      })
      .select()
      .single();

    const { data: invoice2 } = await supabase
      .from('invoices')
      .insert({
        org_id: context.anchorblock.orgId,
        customer_id: context.anchorblock.customerId,
        invoice_number: 'INV-2024-1002',
        invoice_date: '2024-01-15',
        due_date: '2024-02-15',
        subtotal: 2000,
        tax_amount: 200,
        total_amount: 2200,
        amount_due: 2200,
        status: 'sent'
      })
      .select()
      .single();

    // Test 1: Full payment for single invoice
    console.log(chalk.bold('\n💰 Test 1: Full payment for single invoice'));
    const payment1 = await recordPaymentReceipt(
      context.anchorblock.orgId,
      context.anchorblock.customerId,
      {
        amount: 1100,
        paymentDate: '2024-01-20',
        paymentMethod: 'bank_transfer',
        reference: 'WIRE-001',
        notes: 'Full payment for INV-2024-1001'
      },
      [
        { invoiceId: invoice1.id, amount: 1100 }
      ]
    );

    await assertJournalBalances(payment1.journalEntryId);

    // Test 2: Partial payment across multiple invoices
    console.log(chalk.bold('\n💳 Test 2: Partial payment across multiple invoices'));
    const payment2 = await recordPaymentReceipt(
      context.anchorblock.orgId,
      context.anchorblock.customerId,
      {
        amount: 1500,
        paymentDate: '2024-01-25',
        paymentMethod: 'credit_card',
        reference: 'CC-PAYMENT-002',
        processingFee: 45, // 3% fee
        notes: 'Partial payment for INV-2024-1002'
      },
      [
        { invoiceId: invoice2.id, amount: 1500 }
      ]
    );

    // Test 3: Overpayment creating customer credit
    console.log(chalk.bold('\n💵 Test 3: Overpayment with customer credit'));
    const payment3 = await recordPaymentReceipt(
      context.anchorblock.orgId,
      context.anchorblock.customerId,
      {
        amount: 1000,
        paymentDate: '2024-01-28',
        paymentMethod: 'check',
        reference: 'CHECK-12345',
        notes: 'Payment with credit balance'
      },
      [
        { invoiceId: invoice2.id, amount: 700 } // Remaining balance on invoice2
      ]
    );

    // Test 4: Early payment discount
    console.log(chalk.bold('\n🎁 Test 4: Apply early payment discount'));
    
    // Create new invoice eligible for discount
    const { data: discountInvoice } = await supabase
      .from('invoices')
      .insert({
        org_id: context.anchorblock.orgId,
        customer_id: context.anchorblock.customerId,
        invoice_number: 'INV-2024-1003',
        invoice_date: '2024-02-01',
        due_date: '2024-03-01',
        subtotal: 5000,
        total_amount: 5000,
        amount_due: 5000,
        status: 'sent',
        payment_terms: '2/10 net 30' // 2% discount if paid within 10 days
      })
      .select()
      .single();

    // Apply discount (2% of 5000 = 100)
    await applyEarlyPaymentDiscount(
      context.anchorblock.orgId,
      discountInvoice.id,
      100,
      '2024-02-05'
    );

    // Record discounted payment
    const discountedPayment = await recordPaymentReceipt(
      context.anchorblock.orgId,
      context.anchorblock.customerId,
      {
        amount: 4900,
        paymentDate: '2024-02-05',
        paymentMethod: 'bank_transfer',
        reference: 'EARLY-PAYMENT-001',
        notes: 'Early payment with 2% discount'
      },
      [
        { invoiceId: discountInvoice.id, amount: 4900 }
      ]
    );

    // Test 5: Create bank deposit
    console.log(chalk.bold('\n🏦 Test 5: Create bank deposit'));
    context.anchorblock.depositId = await createBankDeposit(
      context.anchorblock.orgId,
      [payment1.paymentId, payment2.paymentId],
      {
        depositDate: '2024-01-30',
        bankAccountId: 'test-bank-account',
        depositNumber: 'DEP-2024-001'
      }
    );

    // Test 6: NSF payment handling
    console.log(chalk.bold('\n❌ Test 6: Handle NSF payment'));
    
    // Create a payment that will bounce
    const { data: nsfInvoice } = await supabase
      .from('invoices')
      .insert({
        org_id: context.anchorblock.orgId,
        customer_id: context.anchorblock.customerId,
        invoice_number: 'INV-2024-1004',
        invoice_date: '2024-02-10',
        due_date: '2024-03-10',
        total_amount: 1000,
        amount_due: 1000,
        status: 'sent'
      })
      .select()
      .single();

    const nsfPayment = await recordPaymentReceipt(
      context.anchorblock.orgId,
      context.anchorblock.customerId,
      {
        amount: 1000,
        paymentDate: '2024-02-15',
        paymentMethod: 'check',
        reference: 'BAD-CHECK-001',
        notes: 'Check that will bounce'
      },
      [
        { invoiceId: nsfInvoice.id, amount: 1000 }
      ]
    );

    // Handle the NSF
    await handleNSFPayment(
      context.anchorblock.orgId,
      nsfPayment.paymentId,
      35 // NSF fee
    );

    // Test 7: Team Qreative payment
    console.log(chalk.bold('\n🎨 Test 7: Team Qreative payment processing'));
    await clearAuthContext();
    await setAuthContext(
      context.teamQreative.orgId,
      context.teamQreative.userId,
      context.teamQreative.workspaceId
    );

    // Create invoice for Team Qreative
    const { data: qreativeInvoice } = await supabase
      .from('invoices')
      .insert({
        org_id: context.teamQreative.orgId,
        customer_id: context.teamQreative.customerId,
        invoice_number: 'TQ-INV-2024-001',
        invoice_date: '2024-01-05',
        due_date: '2024-02-05',
        subtotal: 15000,
        total_amount: 15000,
        amount_due: 15000,
        status: 'sent'
      })
      .select()
      .single();

    const qreativePayment = await recordPaymentReceipt(
      context.teamQreative.orgId,
      context.teamQreative.customerId,
      {
        amount: 15000,
        paymentDate: '2024-01-30',
        paymentMethod: 'wire',
        reference: 'WIRE-TQ-001',
        notes: 'Full payment for design project'
      },
      [
        { invoiceId: qreativeInvoice.id, amount: 15000 }
      ]
    );

    context.teamQreative.paymentId = qreativePayment.paymentId;

    // Test 8: Generate customer statement
    console.log(chalk.bold('\n📄 Test 8: Generate customer statement'));
    await clearAuthContext();
    await setAuthContext(context.anchorblock.orgId, context.anchorblock.userId);
    
    await generateCustomerStatement(
      context.anchorblock.orgId,
      context.anchorblock.customerId,
      '2024-01-01',
      '2024-02-28'
    );

    // Test 9: RLS isolation
    console.log(chalk.bold('\n🔒 Test 9: Test RLS isolation'));
    await assertRLSIsolation(
      'payments',
      context.anchorblock.orgId,
      context.teamQreative.orgId,
      context.anchorblock.userId,
      context.teamQreative.userId
    );

    // Test 10: Financial integrity
    console.log(chalk.bold('\n✅ Test 10: Validate financial integrity'));
    await assertFinancialIntegrity(context.anchorblock.orgId);
    await assertFinancialIntegrity(context.teamQreative.orgId);

    console.log(chalk.bold.green('\n✅ All payment receipt tests passed!\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ Test failed:'), error);
    throw error;
  } finally {
    await clearAuthContext();
  }
}

// Execute tests
runTests().catch(console.error);