#!/usr/bin/env npx tsx
/**
 * Test Journey: Daily Operations - Bank Reconciliation
 * 
 * Tests bank account reconciliation with:
 * - Bank statement import and matching
 * - Auto-matching rules configuration
 * - Manual transaction matching
 * - Unreconciled item handling
 * - Bank fees and interest recording
 * - Outstanding checks tracking
 * - Deposit in transit management
 * - Reconciliation reports
 * - Multi-bank account handling
 * - Daily cash position tracking
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
    bankAccountId?: string;
    reconciliationId?: string;
    statementId?: string;
  };
  teamQreative: {
    orgId: string;
    userId: string;
    workspaceId: string;
    bankAccountId?: string;
    reconciliationId?: string;
  };
}

interface BankTransaction {
  date: string;
  description: string;
  amount: number; // Positive for deposits, negative for withdrawals
  reference: string;
  type: 'deposit' | 'withdrawal' | 'fee' | 'interest';
}

/**
 * Create or get bank account
 */
async function ensureBankAccount(
  orgId: string,
  accountData: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    accountType: 'checking' | 'savings';
    currency: string;
    openingBalance: number;
    openingDate: string;
  }
): Promise<string> {
  console.log(chalk.cyan(`Setting up bank account ${accountData.accountName}...`));

  // Check if account exists
  const { data: existing } = await supabase
    .from('bank_accounts')
    .select('id')
    .eq('org_id', orgId)
    .eq('account_number', accountData.accountNumber)
    .single();

  if (existing) {
    return existing.id;
  }

  // Create bank account
  const { data: account, error } = await supabase
    .from('bank_accounts')
    .insert({
      org_id: orgId,
      account_name: accountData.accountName,
      account_number: accountData.accountNumber,
      bank_name: accountData.bankName,
      account_type: accountData.accountType,
      currency: accountData.currency,
      opening_balance: accountData.openingBalance,
      current_balance: accountData.openingBalance,
      opening_date: accountData.openingDate,
      gl_account_code: '1200', // Bank Account in COA
      is_active: true
    })
    .select()
    .single();

  if (error) throw error;
  console.log(chalk.green(`✓ Created bank account ${account.id}`));
  return account.id;
}

/**
 * Import bank statement
 */
async function importBankStatement(
  orgId: string,
  bankAccountId: string,
  statementData: {
    statementDate: string;
    startDate: string;
    endDate: string;
    openingBalance: number;
    closingBalance: number;
    transactions: BankTransaction[];
  }
): Promise<string> {
  console.log(chalk.cyan(`Importing bank statement for period ${statementData.startDate} to ${statementData.endDate}...`));

  // Create statement record
  const { data: statement, error: statementError } = await supabase
    .from('bank_statements')
    .insert({
      org_id: orgId,
      bank_account_id: bankAccountId,
      statement_date: statementData.statementDate,
      start_date: statementData.startDate,
      end_date: statementData.endDate,
      opening_balance: statementData.openingBalance,
      closing_balance: statementData.closingBalance,
      transaction_count: statementData.transactions.length,
      status: 'imported'
    })
    .select()
    .single();

  if (statementError) throw statementError;

  // Import transactions
  const transactions = statementData.transactions.map(txn => ({
    org_id: orgId,
    bank_account_id: bankAccountId,
    statement_id: statement.id,
    transaction_date: txn.date,
    description: txn.description,
    amount: txn.amount,
    reference: txn.reference,
    transaction_type: txn.type,
    match_status: 'unmatched'
  }));

  const { error: txnError } = await supabase
    .from('bank_transactions')
    .insert(transactions);

  if (txnError) throw txnError;

  console.log(chalk.green(`✓ Imported ${transactions.length} transactions`));
  return statement.id;
}

/**
 * Auto-match transactions
 */
async function autoMatchTransactions(
  orgId: string,
  bankAccountId: string,
  statementId: string
): Promise<number> {
  console.log(chalk.cyan('Auto-matching transactions...'));

  let matchedCount = 0;

  // Get unmatched bank transactions
  const { data: bankTxns } = await supabase
    .from('bank_transactions')
    .select('*')
    .eq('statement_id', statementId)
    .eq('match_status', 'unmatched');

  for (const bankTxn of bankTxns || []) {
    // Try to match with payments
    if (bankTxn.amount > 0) {
      // Deposit - match with received payments
      const { data: payment } = await supabase
        .from('payments')
        .select('id')
        .eq('org_id', orgId)
        .eq('amount', bankTxn.amount)
        .eq('payment_date', bankTxn.transaction_date)
        .eq('payment_type', 'received')
        .is('bank_transaction_id', null)
        .single();

      if (payment) {
        // Create match
        await supabase
          .from('bank_reconciliation_items')
          .insert({
            org_id: orgId,
            bank_transaction_id: bankTxn.id,
            matched_type: 'payment',
            matched_id: payment.id,
            match_confidence: 0.95,
            is_confirmed: true
          });

        // Update bank transaction
        await supabase
          .from('bank_transactions')
          .update({ 
            match_status: 'matched',
            matched_at: new Date().toISOString()
          })
          .eq('id', bankTxn.id);

        // Update payment
        await supabase
          .from('payments')
          .update({ 
            bank_transaction_id: bankTxn.id,
            is_reconciled: true
          })
          .eq('id', payment.id);

        matchedCount++;
      }
    } else {
      // Withdrawal - match with sent payments
      const absAmount = Math.abs(bankTxn.amount);
      const { data: payment } = await supabase
        .from('payments')
        .select('id, check_number')
        .eq('org_id', orgId)
        .eq('amount', absAmount)
        .eq('payment_date', bankTxn.transaction_date)
        .eq('payment_type', 'sent')
        .is('bank_transaction_id', null)
        .single();

      if (payment) {
        // Create match
        await supabase
          .from('bank_reconciliation_items')
          .insert({
            org_id: orgId,
            bank_transaction_id: bankTxn.id,
            matched_type: 'payment',
            matched_id: payment.id,
            match_confidence: payment.check_number && bankTxn.reference.includes(payment.check_number) ? 1.0 : 0.9,
            is_confirmed: true
          });

        // Update bank transaction
        await supabase
          .from('bank_transactions')
          .update({ 
            match_status: 'matched',
            matched_at: new Date().toISOString()
          })
          .eq('id', bankTxn.id);

        // Update payment
        await supabase
          .from('payments')
          .update({ 
            bank_transaction_id: bankTxn.id,
            is_reconciled: true
          })
          .eq('id', payment.id);

        matchedCount++;
      }
    }
  }

  console.log(chalk.green(`✓ Auto-matched ${matchedCount} transactions`));
  return matchedCount;
}

/**
 * Manual transaction matching
 */
async function manualMatchTransaction(
  orgId: string,
  bankTransactionId: string,
  matchType: 'payment' | 'invoice' | 'bill' | 'journal',
  matchId: string
): Promise<void> {
  console.log(chalk.cyan('Manually matching transaction...'));

  // Create match
  await supabase
    .from('bank_reconciliation_items')
    .insert({
      org_id: orgId,
      bank_transaction_id: bankTransactionId,
      matched_type: matchType,
      matched_id: matchId,
      match_confidence: 0.5,
      is_confirmed: true,
      matched_manually: true
    });

  // Update bank transaction
  await supabase
    .from('bank_transactions')
    .update({ 
      match_status: 'matched',
      matched_at: new Date().toISOString()
    })
    .eq('id', bankTransactionId);

  console.log(chalk.green('✓ Transaction manually matched'));
}

/**
 * Record bank fees or interest
 */
async function recordBankAdjustment(
  orgId: string,
  bankAccountId: string,
  adjustmentData: {
    date: string;
    type: 'fee' | 'interest';
    amount: number;
    description: string;
  }
): Promise<void> {
  console.log(chalk.cyan(`Recording bank ${adjustmentData.type}...`));

  // Create journal entry
  const { data: journalEntry, error: journalError } = await supabase
    .from('journal_entries')
    .insert({
      org_id: orgId,
      entry_date: adjustmentData.date,
      reference_type: `bank_${adjustmentData.type}`,
      description: adjustmentData.description,
      status: 'posted',
      total_debit: adjustmentData.amount,
      total_credit: adjustmentData.amount
    })
    .select()
    .single();

  if (journalError) throw journalError;

  // Create journal lines
  const journalLines = [];
  
  if (adjustmentData.type === 'fee') {
    // Bank fee: Debit expense, Credit bank
    journalLines.push(
      {
        org_id: orgId,
        journal_entry_id: journalEntry.id,
        account_code: '6500', // Bank Fees
        debit_amount: adjustmentData.amount,
        credit_amount: 0,
        description: 'Bank service charge'
      },
      {
        org_id: orgId,
        journal_entry_id: journalEntry.id,
        account_code: '1200', // Bank Account
        debit_amount: 0,
        credit_amount: adjustmentData.amount,
        description: 'Bank fee deduction'
      }
    );
  } else {
    // Interest: Debit bank, Credit income
    journalLines.push(
      {
        org_id: orgId,
        journal_entry_id: journalEntry.id,
        account_code: '1200', // Bank Account
        debit_amount: adjustmentData.amount,
        credit_amount: 0,
        description: 'Interest earned'
      },
      {
        org_id: orgId,
        journal_entry_id: journalEntry.id,
        account_code: '4500', // Interest Income
        debit_amount: 0,
        credit_amount: adjustmentData.amount,
        description: 'Bank interest income'
      }
    );
  }

  await supabase
    .from('journal_lines')
    .insert(journalLines);

  // Update bank account balance
  const { data: account } = await supabase
    .from('bank_accounts')
    .select('current_balance')
    .eq('id', bankAccountId)
    .single();

  if (account) {
    const newBalance = adjustmentData.type === 'fee' 
      ? account.current_balance - adjustmentData.amount
      : account.current_balance + adjustmentData.amount;

    await supabase
      .from('bank_accounts')
      .update({ current_balance: newBalance })
      .eq('id', bankAccountId);
  }

  console.log(chalk.green(`✓ Recorded bank ${adjustmentData.type}`));
}

/**
 * Complete reconciliation
 */
async function completeReconciliation(
  orgId: string,
  bankAccountId: string,
  reconciliationData: {
    reconciliationDate: string;
    statementBalance: number;
    reconciledBalance: number;
    outstandingChecks: number;
    depositsInTransit: number;
  }
): Promise<string> {
  console.log(chalk.cyan('Completing bank reconciliation...'));

  // Calculate difference
  const calculatedBalance = reconciliationData.statementBalance 
    - reconciliationData.outstandingChecks 
    + reconciliationData.depositsInTransit;
  
  const difference = Math.abs(calculatedBalance - reconciliationData.reconciledBalance);

  // Create reconciliation record
  const { data: reconciliation, error } = await supabase
    .from('bank_reconciliations')
    .insert({
      org_id: orgId,
      bank_account_id: bankAccountId,
      reconciliation_date: reconciliationData.reconciliationDate,
      statement_balance: reconciliationData.statementBalance,
      reconciled_balance: reconciliationData.reconciledBalance,
      outstanding_checks: reconciliationData.outstandingChecks,
      deposits_in_transit: reconciliationData.depositsInTransit,
      difference,
      status: difference < 0.01 ? 'balanced' : 'unbalanced',
      completed_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;

  // Update bank account
  await supabase
    .from('bank_accounts')
    .update({
      last_reconciled_date: reconciliationData.reconciliationDate,
      last_reconciled_balance: reconciliationData.reconciledBalance
    })
    .eq('id', bankAccountId);

  console.log(chalk.green(`✓ Reconciliation completed (Difference: $${difference.toFixed(2)})`));
  return reconciliation.id;
}

/**
 * Generate reconciliation report
 */
async function generateReconciliationReport(
  orgId: string,
  bankAccountId: string,
  reconciliationId: string
): Promise<void> {
  console.log(chalk.cyan('Generating reconciliation report...'));

  // Get reconciliation details
  const { data: recon } = await supabase
    .from('bank_reconciliations')
    .select(`
      *,
      bank_account:bank_accounts!bank_account_id(
        account_name,
        bank_name,
        account_number
      )
    `)
    .eq('id', reconciliationId)
    .single();

  if (!recon) return;

  // Get outstanding items
  const { data: outstandingPayments } = await supabase
    .from('payments')
    .select('payment_date, amount, check_number, reference_number')
    .eq('org_id', orgId)
    .eq('bank_account_id', bankAccountId)
    .eq('is_reconciled', false)
    .eq('payment_type', 'sent')
    .lte('payment_date', recon.reconciliation_date);

  const { data: undeposited } = await supabase
    .from('payments')
    .select('payment_date, amount, reference_number')
    .eq('org_id', orgId)
    .eq('is_reconciled', false)
    .eq('payment_type', 'received')
    .lte('payment_date', recon.reconciliation_date);

  console.log(chalk.blue('\n=== Bank Reconciliation Report ==='));
  console.log(chalk.blue(`Account: ${recon.bank_account?.account_name}`));
  console.log(chalk.blue(`Bank: ${recon.bank_account?.bank_name}`));
  console.log(chalk.blue(`Date: ${recon.reconciliation_date}\n`));

  console.log(chalk.yellow('Reconciliation Summary:'));
  console.log(`Statement Balance: $${recon.statement_balance.toFixed(2)}`);
  console.log(`Less: Outstanding Checks: ($${recon.outstanding_checks.toFixed(2)})`);
  console.log(`Add: Deposits in Transit: $${recon.deposits_in_transit.toFixed(2)}`);
  console.log(`Adjusted Bank Balance: $${(recon.statement_balance - recon.outstanding_checks + recon.deposits_in_transit).toFixed(2)}`);
  console.log(`Book Balance: $${recon.reconciled_balance.toFixed(2)}`);
  console.log(`Difference: $${recon.difference.toFixed(2)}`);
  console.log(`Status: ${recon.status === 'balanced' ? '✓ Balanced' : '⚠ Unbalanced'}`);

  if (outstandingPayments && outstandingPayments.length > 0) {
    console.log(chalk.yellow('\nOutstanding Checks:'));
    console.table(outstandingPayments.map(p => ({
      date: p.payment_date,
      check: p.check_number,
      amount: p.amount
    })));
  }

  if (undeposited && undeposited.length > 0) {
    console.log(chalk.yellow('\nDeposits in Transit:'));
    console.table(undeposited.map(p => ({
      date: p.payment_date,
      reference: p.reference_number,
      amount: p.amount
    })));
  }

  console.log(chalk.green('\n✓ Reconciliation report generated'));
}

/**
 * Main test execution
 */
async function runTests() {
  console.log(chalk.bold.blue('\n🧪 Testing Daily Operations - Bank Reconciliation\n'));

  const context: TestContext = {
    anchorblock: {
      orgId: '',
      userId: '',
      workspaceId: ''
    },
    teamQreative: {
      orgId: '',
      userId: '',
      workspaceId: ''
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

    context.anchorblock = {
      orgId: anchorblockOrg?.id || '',
      userId: anchorblockUser?.id || '',
      workspaceId: anchorblockWorkspace?.id || ''
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

    context.teamQreative = {
      orgId: qreativeOrg?.id || '',
      userId: qreativeUser?.id || '',
      workspaceId: qreativeWorkspace?.id || ''
    };

    // Validate context
    assertDataExists(context.anchorblock.orgId, 'Anchorblock organization');
    assertDataExists(context.teamQreative.orgId, 'Team Qreative organization');

    // Test 1: Set up bank accounts
    console.log(chalk.bold('\n🏦 Test 1: Set up bank accounts'));
    await setAuthContext(
      context.anchorblock.orgId,
      context.anchorblock.userId,
      context.anchorblock.workspaceId
    );

    context.anchorblock.bankAccountId = await ensureBankAccount(
      context.anchorblock.orgId,
      {
        accountName: 'Operating Account',
        accountNumber: '1234567890',
        bankName: 'Chase Bank',
        accountType: 'checking',
        currency: 'USD',
        openingBalance: 50000,
        openingDate: '2024-01-01'
      }
    );

    // Test 2: Import bank statement
    console.log(chalk.bold('\n📄 Test 2: Import bank statement'));
    
    const statementTransactions: BankTransaction[] = [
      {
        date: '2024-02-01',
        description: 'Wire Transfer - TechStartup Inc',
        amount: 5000,
        reference: 'WIRE-001',
        type: 'deposit'
      },
      {
        date: '2024-02-05',
        description: 'Check 1001 - Amazon Web Services',
        amount: -2500,
        reference: 'CHK-1001',
        type: 'withdrawal'
      },
      {
        date: '2024-02-10',
        description: 'ACH Credit - Customer Payment',
        amount: 3000,
        reference: 'ACH-12345',
        type: 'deposit'
      },
      {
        date: '2024-02-15',
        description: 'Bank Service Charge',
        amount: -25,
        reference: 'FEE-001',
        type: 'fee'
      },
      {
        date: '2024-02-20',
        description: 'Interest Earned',
        amount: 15.50,
        reference: 'INT-001',
        type: 'interest'
      },
      {
        date: '2024-02-25',
        description: 'Wire Transfer Fee',
        amount: -30,
        reference: 'WIRE-FEE',
        type: 'fee'
      }
    ];

    context.anchorblock.statementId = await importBankStatement(
      context.anchorblock.orgId,
      context.anchorblock.bankAccountId,
      {
        statementDate: '2024-02-28',
        startDate: '2024-02-01',
        endDate: '2024-02-28',
        openingBalance: 50000,
        closingBalance: 55460.50,
        transactions: statementTransactions
      }
    );

    // Test 3: Auto-match transactions
    console.log(chalk.bold('\n🔄 Test 3: Auto-match transactions'));
    
    // First create some payments to match
    await supabase
      .from('payments')
      .insert([
        {
          org_id: context.anchorblock.orgId,
          payment_type: 'received',
          amount: 5000,
          payment_date: '2024-02-01',
          payment_method: 'wire',
          reference_number: 'WIRE-001',
          status: 'completed'
        },
        {
          org_id: context.anchorblock.orgId,
          payment_type: 'sent',
          amount: 2500,
          payment_date: '2024-02-05',
          payment_method: 'check',
          check_number: '1001',
          reference_number: 'CHK-1001',
          status: 'completed'
        },
        {
          org_id: context.anchorblock.orgId,
          payment_type: 'received',
          amount: 3000,
          payment_date: '2024-02-10',
          payment_method: 'ach',
          reference_number: 'ACH-12345',
          status: 'completed'
        }
      ]);

    const matchedCount = await autoMatchTransactions(
      context.anchorblock.orgId,
      context.anchorblock.bankAccountId,
      context.anchorblock.statementId
    );

    console.log(`Matched ${matchedCount} transactions automatically`);

    // Test 4: Manual matching for remaining items
    console.log(chalk.bold('\n✋ Test 4: Manual transaction matching'));
    
    // Get an unmatched transaction
    const { data: unmatchedTxn } = await supabase
      .from('bank_transactions')
      .select('id')
      .eq('statement_id', context.anchorblock.statementId)
      .eq('match_status', 'unmatched')
      .eq('transaction_type', 'fee')
      .limit(1)
      .single();

    if (unmatchedTxn) {
      // Create a journal entry to match with
      const { data: feeJournal } = await supabase
        .from('journal_entries')
        .insert({
          org_id: context.anchorblock.orgId,
          entry_date: '2024-02-15',
          reference_type: 'bank_fee',
          description: 'Monthly service charge',
          status: 'posted',
          total_debit: 25,
          total_credit: 25
        })
        .select()
        .single();

      if (feeJournal) {
        await manualMatchTransaction(
          context.anchorblock.orgId,
          unmatchedTxn.id,
          'journal',
          feeJournal.id
        );
      }
    }

    // Test 5: Record bank adjustments
    console.log(chalk.bold('\n💰 Test 5: Record bank fees and interest'));
    
    await recordBankAdjustment(
      context.anchorblock.orgId,
      context.anchorblock.bankAccountId,
      {
        date: '2024-02-15',
        type: 'fee',
        amount: 25,
        description: 'Monthly service charge'
      }
    );

    await recordBankAdjustment(
      context.anchorblock.orgId,
      context.anchorblock.bankAccountId,
      {
        date: '2024-02-20',
        type: 'interest',
        amount: 15.50,
        description: 'Monthly interest earned'
      }
    );

    // Test 6: Complete reconciliation
    console.log(chalk.bold('\n✅ Test 6: Complete bank reconciliation'));
    
    // Create some outstanding items
    await supabase
      .from('payments')
      .insert([
        {
          org_id: context.anchorblock.orgId,
          payment_type: 'sent',
          amount: 1500,
          payment_date: '2024-02-27',
          payment_method: 'check',
          check_number: '1002',
          bank_account_id: context.anchorblock.bankAccountId,
          is_reconciled: false,
          status: 'completed'
        },
        {
          org_id: context.anchorblock.orgId,
          payment_type: 'received',
          amount: 2000,
          payment_date: '2024-02-28',
          payment_method: 'check',
          reference_number: 'DEP-001',
          is_reconciled: false,
          status: 'completed'
        }
      ]);

    context.anchorblock.reconciliationId = await completeReconciliation(
      context.anchorblock.orgId,
      context.anchorblock.bankAccountId,
      {
        reconciliationDate: '2024-02-28',
        statementBalance: 55460.50,
        reconciledBalance: 55960.50, // Adjusted for outstanding items
        outstandingChecks: 1500,
        depositsInTransit: 2000
      }
    );

    // Test 7: Generate reconciliation report
    console.log(chalk.bold('\n📊 Test 7: Generate reconciliation report'));
    await generateReconciliationReport(
      context.anchorblock.orgId,
      context.anchorblock.bankAccountId,
      context.anchorblock.reconciliationId
    );

    // Test 8: Team Qreative bank setup
    console.log(chalk.bold('\n🎨 Test 8: Team Qreative bank reconciliation'));
    await clearAuthContext();
    await setAuthContext(
      context.teamQreative.orgId,
      context.teamQreative.userId,
      context.teamQreative.workspaceId
    );

    context.teamQreative.bankAccountId = await ensureBankAccount(
      context.teamQreative.orgId,
      {
        accountName: 'Business Checking',
        accountNumber: '9876543210',
        bankName: 'Bank of America',
        accountType: 'checking',
        currency: 'USD',
        openingBalance: 25000,
        openingDate: '2024-01-01'
      }
    );

    // Simple statement for Team Qreative
    await importBankStatement(
      context.teamQreative.orgId,
      context.teamQreative.bankAccountId,
      {
        statementDate: '2024-02-28',
        startDate: '2024-02-01',
        endDate: '2024-02-28',
        openingBalance: 25000,
        closingBalance: 35000,
        transactions: [
          {
            date: '2024-02-15',
            description: 'Client Payment - BrandCorp',
            amount: 15000,
            reference: 'WIRE-TQ-001',
            type: 'deposit'
          },
          {
            date: '2024-02-20',
            description: 'Adobe Payment',
            amount: -5000,
            reference: 'ACH-ADOBE',
            type: 'withdrawal'
          }
        ]
      }
    );

    context.teamQreative.reconciliationId = await completeReconciliation(
      context.teamQreative.orgId,
      context.teamQreative.bankAccountId,
      {
        reconciliationDate: '2024-02-28',
        statementBalance: 35000,
        reconciledBalance: 35000,
        outstandingChecks: 0,
        depositsInTransit: 0
      }
    );

    // Test 9: RLS isolation
    console.log(chalk.bold('\n🔒 Test 9: Test RLS isolation'));
    await assertRLSIsolation(
      'bank_accounts',
      context.anchorblock.orgId,
      context.teamQreative.orgId,
      context.anchorblock.userId,
      context.teamQreative.userId
    );

    await assertRLSIsolation(
      'bank_reconciliations',
      context.anchorblock.orgId,
      context.teamQreative.orgId,
      context.anchorblock.userId,
      context.teamQreative.userId
    );

    // Test 10: Financial integrity
    console.log(chalk.bold('\n✅ Test 10: Validate financial integrity'));
    await assertFinancialIntegrity(context.anchorblock.orgId);
    await assertFinancialIntegrity(context.teamQreative.orgId);

    console.log(chalk.bold.green('\n✅ All bank reconciliation tests passed!\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ Test failed:'), error);
    throw error;
  } finally {
    await clearAuthContext();
  }
}

// Execute tests
runTests().catch(console.error);