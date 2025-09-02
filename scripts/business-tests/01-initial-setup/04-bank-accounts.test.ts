/**
 * Test: Bank Account Setup
 * Tests creating and configuring bank accounts for the organization
 */

import { supabaseAdmin } from '../utils/db-client'
import { createTestOrganization } from '../utils/auth-context'
import { runTestSuite, assertEqual, assertTrue } from '../utils/test-assertions'
import { cleanupBySlug } from '../utils/cleanup'

async function testBankAccountCreation() {
  const { org } = await createTestOrganization(
    'Anchorblock Technology Limited',
    'anchorblock-bank',
    'cfo@anchorblock.ai',
    'professional'
  )
  
  // Create multiple bank accounts
  const bankAccounts = [
    {
      account_name: 'Operating Account',
      account_type: 'checking',
      bank_name: 'Chase Bank',
      account_number: '****1234',
      routing_number: '021000021',
      currency_code: 'USD',
      current_balance: 75000,
      is_primary: true,
      purpose: 'Daily operations'
    },
    {
      account_name: 'Payroll Account',
      account_type: 'checking',
      bank_name: 'Chase Bank',
      account_number: '****5678',
      routing_number: '021000021',
      currency_code: 'USD',
      current_balance: 50000,
      is_primary: false,
      purpose: 'Employee payroll'
    },
    {
      account_name: 'Savings Account',
      account_type: 'savings',
      bank_name: 'Chase Bank',
      account_number: '****9012',
      routing_number: '021000021',
      currency_code: 'USD',
      current_balance: 100000,
      is_primary: false,
      purpose: 'Emergency fund'
    },
    {
      account_name: 'Stripe Payout Account',
      account_type: 'checking',
      bank_name: 'Silicon Valley Bank',
      account_number: '****3456',
      routing_number: '121140399',
      currency_code: 'USD',
      current_balance: 25000,
      is_primary: false,
      purpose: 'Customer payment processing'
    }
  ]
  
  const createdAccounts = []
  
  for (const bankAccount of bankAccounts) {
    const { data: account, error } = await supabaseAdmin
      .from('bank_accounts')
      .insert({
        organization_id: org.id,
        ...bankAccount,
        is_active: true,
        last_synced_at: new Date().toISOString()
      })
      .select()
      .single()
    
    assertTrue(!error, `Bank account ${bankAccount.account_name} should be created`)
    assertEqual(account.account_name, bankAccount.account_name, 'Account name should match')
    assertEqual(account.current_balance, bankAccount.current_balance, 'Balance should match')
    
    createdAccounts.push(account)
  }
  
  // Verify primary account
  const primaryAccount = createdAccounts.find(a => a.is_primary)
  assertTrue(primaryAccount, 'Should have a primary account')
  assertEqual(primaryAccount.account_name, 'Operating Account', 'Operating account should be primary')
  
  // Verify total cash position
  const totalCash = createdAccounts.reduce(
    (sum, acc) => sum + parseFloat(acc.current_balance || 0),
    0
  )
  assertEqual(totalCash, 250000, 'Total cash across all accounts should be $250,000')
  
  return { org, accounts: createdAccounts }
}

async function testBankRules() {
  const { org } = await createTestOrganization(
    'Bank Rules Test',
    'bank-rules',
    'cfo@rules.ai',
    'growth'
  )
  
  // Create bank account
  const { data: bankAccount } = await supabaseAdmin
    .from('bank_accounts')
    .insert({
      organization_id: org.id,
      account_name: 'Main Operating',
      account_type: 'checking',
      bank_name: 'Test Bank',
      currency_code: 'USD',
      is_primary: true
    })
    .select()
    .single()
  
  // Create chart of accounts for categorization
  const expenseAccounts = [
    { code: '6000', name: 'AWS Infrastructure', type: 'expense' },
    { code: '6100', name: 'Google Cloud', type: 'expense' },
    { code: '6200', name: 'Software Subscriptions', type: 'expense' },
    { code: '6300', name: 'Office Supplies', type: 'expense' }
  ]
  
  const accountIds = {}
  for (const acc of expenseAccounts) {
    const { data: account } = await supabaseAdmin
      .from('chart_accounts')
      .insert({
        organization_id: org.id,
        ...acc,
        normal_balance: 'debit'
      })
      .select()
      .single()
    
    accountIds[acc.name] = account.id
  }
  
  // Create auto-categorization rules
  const rules = [
    {
      rule_name: 'AWS Charges',
      match_type: 'contains',
      match_text: 'AMAZON WEB SERVICES',
      account_id: accountIds['AWS Infrastructure'],
      auto_apply: true
    },
    {
      rule_name: 'Google Cloud',
      match_type: 'contains',
      match_text: 'GOOGLE CLOUD',
      account_id: accountIds['Google Cloud'],
      auto_apply: true
    },
    {
      rule_name: 'Software Subscriptions',
      match_type: 'regex',
      match_text: '(GITHUB|SLACK|DATADOG|SENTRY)',
      account_id: accountIds['Software Subscriptions'],
      auto_apply: true
    },
    {
      rule_name: 'Office Supplies',
      match_type: 'starts_with',
      match_text: 'STAPLES',
      account_id: accountIds['Office Supplies'],
      auto_apply: false
    }
  ]
  
  for (const rule of rules) {
    const { data: bankRule } = await supabaseAdmin
      .from('bank_rules')
      .insert({
        organization_id: org.id,
        bank_account_id: bankAccount.id,
        ...rule,
        is_active: true
      })
      .select()
      .single()
    
    assertEqual(bankRule.rule_name, rule.rule_name, `Rule ${rule.rule_name} should be created`)
    assertEqual(bankRule.match_type, rule.match_type, 'Match type should be correct')
  }
}

async function testBankTransactionImport() {
  const { org } = await createTestOrganization(
    'Transaction Import Test',
    'trans-import',
    'cfo@import.ai',
    'professional'
  )
  
  // Create bank account
  const { data: bankAccount } = await supabaseAdmin
    .from('bank_accounts')
    .insert({
      organization_id: org.id,
      account_name: 'Operating Account',
      account_type: 'checking',
      bank_name: 'Chase',
      currency_code: 'USD',
      current_balance: 50000
    })
    .select()
    .single()
  
  // Simulate imported bank transactions
  const transactions = [
    {
      transaction_date: '2024-01-15',
      description: 'STRIPE PAYOUT',
      amount: 15000,
      type: 'deposit',
      reference: 'STRIPE-001'
    },
    {
      transaction_date: '2024-01-16',
      description: 'AMAZON WEB SERVICES',
      amount: -3500,
      type: 'withdrawal',
      reference: 'AWS-001'
    },
    {
      transaction_date: '2024-01-17',
      description: 'GOOGLE CLOUD PLATFORM',
      amount: -1200,
      type: 'withdrawal',
      reference: 'GCP-001'
    },
    {
      transaction_date: '2024-01-18',
      description: 'CUSTOMER PAYMENT - INV-001',
      amount: 5000,
      type: 'deposit',
      reference: 'PMT-001'
    },
    {
      transaction_date: '2024-01-19',
      description: 'PAYROLL TRANSFER',
      amount: -25000,
      type: 'transfer',
      reference: 'PAYROLL-001'
    }
  ]
  
  let runningBalance = parseFloat(bankAccount.current_balance)
  
  for (const trans of transactions) {
    runningBalance += trans.amount
    
    const { data: bankTransaction } = await supabaseAdmin
      .from('bank_transactions')
      .insert({
        organization_id: org.id,
        bank_account_id: bankAccount.id,
        transaction_date: trans.transaction_date,
        description: trans.description,
        amount: Math.abs(trans.amount),
        transaction_type: trans.type,
        reference_number: trans.reference,
        is_debit: trans.amount < 0,
        is_credit: trans.amount > 0,
        running_balance: runningBalance,
        status: 'pending', // Not yet reconciled
        imported_at: new Date().toISOString()
      })
      .select()
      .single()
    
    assertTrue(bankTransaction, `Transaction ${trans.reference} should be imported`)
  }
  
  // Verify final balance
  assertEqual(runningBalance, 40500, 'Running balance should be correct after all transactions')
}

async function testBankReconciliation() {
  const { org } = await createTestOrganization(
    'Bank Reconciliation Test',
    'reconciliation',
    'cfo@reconcile.ai',
    'professional'
  )
  
  // Create bank account
  const { data: bankAccount } = await supabaseAdmin
    .from('bank_accounts')
    .insert({
      organization_id: org.id,
      account_name: 'Checking Account',
      account_type: 'checking',
      bank_name: 'Wells Fargo',
      currency_code: 'USD',
      current_balance: 75000,
      last_statement_balance: 70000,
      last_statement_date: '2024-01-31'
    })
    .select()
    .single()
  
  // Create some transactions to reconcile
  const transactions = [
    { date: '2024-02-01', amount: 5000, type: 'deposit', status: 'cleared' },
    { date: '2024-02-02', amount: -2000, type: 'withdrawal', status: 'cleared' },
    { date: '2024-02-03', amount: 3000, type: 'deposit', status: 'pending' },
    { date: '2024-02-04', amount: -1000, type: 'withdrawal', status: 'pending' }
  ]
  
  const transactionIds = []
  
  for (const trans of transactions) {
    const { data: bankTrans } = await supabaseAdmin
      .from('bank_transactions')
      .insert({
        organization_id: org.id,
        bank_account_id: bankAccount.id,
        transaction_date: trans.date,
        amount: Math.abs(trans.amount),
        transaction_type: trans.type,
        is_debit: trans.amount < 0,
        is_credit: trans.amount > 0,
        status: trans.status
      })
      .select()
      .single()
    
    transactionIds.push(bankTrans.id)
  }
  
  // Create reconciliation record
  const { data: reconciliation } = await supabaseAdmin
    .from('bank_reconciliations')
    .insert({
      organization_id: org.id,
      bank_account_id: bankAccount.id,
      statement_date: '2024-02-28',
      statement_balance: 75000,
      beginning_balance: 70000,
      ending_balance: 75000,
      cleared_deposits: 5000,
      cleared_withdrawals: 2000,
      outstanding_deposits: 3000,
      outstanding_withdrawals: 1000,
      status: 'in_progress',
      reconciled_by: 'cfo@reconcile.ai',
      reconciled_at: new Date().toISOString()
    })
    .select()
    .single()
  
  // Verify reconciliation math
  const calculatedBalance = 
    reconciliation.beginning_balance + 
    reconciliation.cleared_deposits - 
    reconciliation.cleared_withdrawals
  
  assertEqual(calculatedBalance, 73000, 'Cleared balance should be correct')
  
  // Verify outstanding items
  const adjustedBalance = 
    calculatedBalance + 
    reconciliation.outstanding_deposits - 
    reconciliation.outstanding_withdrawals
  
  assertEqual(adjustedBalance, reconciliation.statement_balance, 'Adjusted balance should match statement')
  
  // Mark reconciliation as complete
  await supabaseAdmin
    .from('bank_reconciliations')
    .update({ status: 'completed' })
    .eq('id', reconciliation.id)
  
  // Mark cleared transactions as reconciled
  await supabaseAdmin
    .from('bank_transactions')
    .update({ 
      status: 'reconciled',
      reconciliation_id: reconciliation.id
    })
    .in('id', transactionIds.slice(0, 2)) // First two are cleared
}

async function testMultiCurrencyAccounts() {
  const { org } = await createTestOrganization(
    'Multi-Currency Test',
    'multi-currency',
    'cfo@currency.ai',
    'enterprise'
  )
  
  // Create accounts in different currencies
  const currencyAccounts = [
    {
      account_name: 'USD Operating',
      currency_code: 'USD',
      current_balance: 100000,
      exchange_rate: 1.0
    },
    {
      account_name: 'EUR Account',
      currency_code: 'EUR',
      current_balance: 50000,
      exchange_rate: 0.85 // 1 USD = 0.85 EUR
    },
    {
      account_name: 'GBP Account',
      currency_code: 'GBP',
      current_balance: 30000,
      exchange_rate: 0.73 // 1 USD = 0.73 GBP
    },
    {
      account_name: 'JPY Account',
      currency_code: 'JPY',
      current_balance: 5000000,
      exchange_rate: 110.0 // 1 USD = 110 JPY
    }
  ]
  
  let totalUSDEquivalent = 0
  
  for (const acc of currencyAccounts) {
    const { data: account } = await supabaseAdmin
      .from('bank_accounts')
      .insert({
        organization_id: org.id,
        account_name: acc.account_name,
        account_type: 'checking',
        bank_name: 'International Bank',
        currency_code: acc.currency_code,
        current_balance: acc.current_balance,
        is_active: true
      })
      .select()
      .single()
    
    // Calculate USD equivalent
    const usdEquivalent = acc.currency_code === 'USD' 
      ? acc.current_balance
      : acc.current_balance / acc.exchange_rate
    
    totalUSDEquivalent += usdEquivalent
    
    // Store exchange rate
    if (acc.currency_code !== 'USD') {
      await supabaseAdmin
        .from('exchange_rates')
        .insert({
          organization_id: org.id,
          from_currency_code: 'USD',
          to_currency_code: acc.currency_code,
          exchange_rate: acc.exchange_rate,
          effective_date: new Date().toISOString()
        })
    }
  }
  
  // Verify total USD equivalent (approximately)
  assertTrue(
    Math.abs(totalUSDEquivalent - 234589) < 1000,
    'Total USD equivalent should be approximately $234,589'
  )
}

async function testBankFeedIntegration() {
  const { org } = await createTestOrganization(
    'Bank Feed Test',
    'bank-feed',
    'cfo@feed.ai',
    'professional'
  )
  
  // Create bank account with feed configuration
  const { data: bankAccount } = await supabaseAdmin
    .from('bank_accounts')
    .insert({
      organization_id: org.id,
      account_name: 'Connected Account',
      account_type: 'checking',
      bank_name: 'Plaid Bank',
      currency_code: 'USD',
      current_balance: 50000,
      integration_provider: 'plaid',
      integration_account_id: 'plaid_account_123',
      auto_import: true,
      import_start_date: '2024-01-01',
      last_synced_at: new Date().toISOString()
    })
    .select()
    .single()
  
  assertTrue(bankAccount.integration_provider, 'Should have integration provider')
  assertTrue(bankAccount.auto_import, 'Auto-import should be enabled')
  
  // Simulate automatic transaction import
  const today = new Date()
  for (let i = 0; i < 5; i++) {
    const transDate = new Date(today)
    transDate.setDate(transDate.getDate() - i)
    
    await supabaseAdmin
      .from('bank_transactions')
      .insert({
        organization_id: org.id,
        bank_account_id: bankAccount.id,
        transaction_date: transDate.toISOString(),
        description: `Auto-imported transaction ${i + 1}`,
        amount: Math.random() * 1000,
        transaction_type: Math.random() > 0.5 ? 'deposit' : 'withdrawal',
        status: 'pending',
        imported_at: new Date().toISOString(),
        import_source: 'plaid_feed'
      })
  }
  
  // Verify transactions were imported
  const { data: imported } = await supabaseAdmin
    .from('bank_transactions')
    .select('id')
    .eq('bank_account_id', bankAccount.id)
    .eq('import_source', 'plaid_feed')
  
  assertEqual(imported.length, 5, 'Should have 5 auto-imported transactions')
}

// Run tests
async function main() {
  console.log('🚀 Starting Bank Account Tests\n')
  
  // Clean up any existing test data
  const slugsToClean = [
    'anchorblock-bank',
    'bank-rules',
    'trans-import',
    'reconciliation',
    'multi-currency',
    'bank-feed'
  ]
  
  for (const slug of slugsToClean) {
    await cleanupBySlug(slug)
  }
  
  const results = await runTestSuite('Bank Account Setup', [
    { name: 'Create multiple bank accounts', fn: testBankAccountCreation },
    { name: 'Bank rules and auto-categorization', fn: testBankRules },
    { name: 'Bank transaction import', fn: testBankTransactionImport },
    { name: 'Bank reconciliation process', fn: testBankReconciliation },
    { name: 'Multi-currency accounts', fn: testMultiCurrencyAccounts },
    { name: 'Bank feed integration', fn: testBankFeedIntegration }
  ])
  
  // Cleanup
  for (const slug of slugsToClean) {
    await cleanupBySlug(slug)
  }
  
  process.exit(results.failed > 0 ? 1 : 0)
}

main().catch(console.error)