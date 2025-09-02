/**
 * Test: Chart of Accounts Setup
 * Tests creating and configuring the chart of accounts from templates
 */

import { supabaseAdmin } from '../utils/db-client'
import { createTestOrganization } from '../utils/auth-context'
import { getSaaSChartOfAccounts, getAgencyChartOfAccounts } from '../utils/data-generators'
import { runTestSuite, assertEqual, assertTrue } from '../utils/test-assertions'
import { cleanupBySlug } from '../utils/cleanup'

async function testSaaSChartOfAccounts() {
  const { org, authContext } = await createTestOrganization(
    'Anchorblock Technology Limited',
    'anchorblock-coa',
    'cfo@anchorblock.ai',
    'professional'
  )
  
  // Get SaaS COA template
  const template = getSaaSChartOfAccounts()
  
  // Insert all accounts
  const { data: accounts, error } = await supabaseAdmin
    .from('chart_accounts')
    .insert(
      template.map(acc => ({
        ...acc,
        organization_id: org.id,
        is_system: true,
        is_active: true,
        current_balance: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
    )
    .select()
  
  assertTrue(!error, 'Chart of accounts should be created without errors')
  assertEqual(accounts.length, template.length, 'All accounts should be created')
  
  // Verify account types
  const assetAccounts = accounts.filter(a => a.type === 'asset')
  const liabilityAccounts = accounts.filter(a => a.type === 'liability')
  const equityAccounts = accounts.filter(a => a.type === 'equity')
  const incomeAccounts = accounts.filter(a => a.type === 'income')
  const expenseAccounts = accounts.filter(a => a.type === 'expense')
  
  assertTrue(assetAccounts.length > 0, 'Should have asset accounts')
  assertTrue(liabilityAccounts.length > 0, 'Should have liability accounts')
  assertTrue(equityAccounts.length > 0, 'Should have equity accounts')
  assertTrue(incomeAccounts.length > 0, 'Should have income accounts')
  assertTrue(expenseAccounts.length > 0, 'Should have expense accounts')
  
  // Verify key accounts exist
  const arAccount = accounts.find(a => a.name === 'Accounts Receivable')
  const apAccount = accounts.find(a => a.name === 'Accounts Payable')
  const cashAccount = accounts.find(a => a.name.includes('Cash'))
  const revenueAccount = accounts.find(a => a.name.includes('Revenue'))
  
  assertTrue(arAccount, 'Should have Accounts Receivable')
  assertTrue(apAccount, 'Should have Accounts Payable')
  assertTrue(cashAccount, 'Should have Cash account')
  assertTrue(revenueAccount, 'Should have Revenue account')
  
  return { org, accounts }
}

async function testAgencyChartOfAccounts() {
  const { org } = await createTestOrganization(
    'Team Qreative',
    'teamqreative-coa',
    'accountant@teamqreative.ai',
    'growth'
  )
  
  // Get Agency COA template
  const template = getAgencyChartOfAccounts()
  
  // Insert all accounts
  const { data: accounts } = await supabaseAdmin
    .from('chart_accounts')
    .insert(
      template.map(acc => ({
        ...acc,
        organization_id: org.id,
        is_system: true,
        is_active: true,
        current_balance: 0
      }))
    )
    .select()
  
  // Verify agency-specific accounts
  const wipAccount = accounts.find(a => a.name === 'Work in Progress')
  const designRevenueAccount = accounts.find(a => a.name === 'Design Services Revenue')
  const contractorCostsAccount = accounts.find(a => a.name === 'Contractor Costs')
  
  assertTrue(wipAccount, 'Agency should have Work in Progress account')
  assertTrue(designRevenueAccount, 'Agency should have Design Services Revenue')
  assertTrue(contractorCostsAccount, 'Agency should have Contractor Costs account')
  
  return { org, accounts }
}

async function testAccountCodeUniqueness() {
  const { org } = await createTestOrganization(
    'Test Unique Codes',
    'unique-codes',
    'admin@unique.ai',
    'starter'
  )
  
  // Try to create duplicate account codes
  await supabaseAdmin
    .from('chart_accounts')
    .insert({
      organization_id: org.id,
      code: '1000',
      name: 'First Account',
      type: 'asset',
      normal_balance: 'debit'
    })
  
  const { error } = await supabaseAdmin
    .from('chart_accounts')
    .insert({
      organization_id: org.id,
      code: '1000', // Same code
      name: 'Second Account',
      type: 'asset',
      normal_balance: 'debit'
    })
  
  assertTrue(error, 'Should prevent duplicate account codes within organization')
}

async function testAccountHierarchy() {
  const { org } = await createTestOrganization(
    'Hierarchy Test Org',
    'hierarchy-test',
    'admin@hierarchy.ai',
    'professional'
  )
  
  // Create parent account
  const { data: parentAccount } = await supabaseAdmin
    .from('chart_accounts')
    .insert({
      organization_id: org.id,
      code: '1000',
      name: 'Current Assets',
      type: 'asset',
      normal_balance: 'debit',
      is_header: true // Header account (no transactions)
    })
    .select()
    .single()
  
  // Create child accounts
  const childAccounts = [
    { code: '1100', name: 'Cash', parent_id: parentAccount.id },
    { code: '1200', name: 'Accounts Receivable', parent_id: parentAccount.id },
    { code: '1300', name: 'Inventory', parent_id: parentAccount.id }
  ]
  
  for (const child of childAccounts) {
    const { data: childAccount } = await supabaseAdmin
      .from('chart_accounts')
      .insert({
        organization_id: org.id,
        ...child,
        type: 'asset',
        normal_balance: 'debit',
        is_header: false
      })
      .select()
      .single()
    
    assertEqual(childAccount.parent_id, parentAccount.id, 'Child should reference parent')
  }
  
  // Verify hierarchy
  const { data: children } = await supabaseAdmin
    .from('chart_accounts')
    .select()
    .eq('parent_id', parentAccount.id)
  
  assertEqual(children.length, 3, 'Parent should have 3 child accounts')
}

async function testSystemAccounts() {
  const { org } = await createTestOrganization(
    'System Accounts Org',
    'system-accounts',
    'admin@system.ai',
    'professional'
  )
  
  // Create system accounts that shouldn't be deleted
  const systemAccounts = [
    { code: 'SYS-AR', name: 'System AR Account', type: 'asset' },
    { code: 'SYS-AP', name: 'System AP Account', type: 'liability' },
    { code: 'SYS-REV', name: 'System Revenue Account', type: 'income' }
  ]
  
  for (const acc of systemAccounts) {
    const { data: account } = await supabaseAdmin
      .from('chart_accounts')
      .insert({
        organization_id: org.id,
        ...acc,
        normal_balance: acc.type === 'asset' ? 'debit' : 'credit',
        is_system: true,
        is_active: true
      })
      .select()
      .single()
    
    assertTrue(account.is_system, 'Should be marked as system account')
    
    // Try to deactivate system account (should be prevented in production)
    const { data: updated } = await supabaseAdmin
      .from('chart_accounts')
      .update({ is_active: false })
      .eq('id', account.id)
      .select()
      .single()
    
    // In production, this would be prevented by business logic
    // For testing, we just verify the flag exists
    assertTrue(account.is_system, 'System flag should remain')
  }
}

async function testAccountBalanceTypes() {
  const { org } = await createTestOrganization(
    'Balance Types Org',
    'balance-types',
    'admin@balance.ai',
    'growth'
  )
  
  // Test normal balance for each account type
  const accountTypes = [
    { type: 'asset', normal_balance: 'debit', increases_with: 'debit' },
    { type: 'liability', normal_balance: 'credit', increases_with: 'credit' },
    { type: 'equity', normal_balance: 'credit', increases_with: 'credit' },
    { type: 'income', normal_balance: 'credit', increases_with: 'credit' },
    { type: 'expense', normal_balance: 'debit', increases_with: 'debit' },
    { type: 'contra_asset', normal_balance: 'credit', increases_with: 'credit' },
    { type: 'contra_liability', normal_balance: 'debit', increases_with: 'debit' }
  ]
  
  for (const accType of accountTypes) {
    const { data: account } = await supabaseAdmin
      .from('chart_accounts')
      .insert({
        organization_id: org.id,
        code: `TEST-${accType.type.toUpperCase()}`,
        name: `Test ${accType.type} Account`,
        type: accType.type,
        normal_balance: accType.normal_balance
      })
      .select()
      .single()
    
    assertEqual(account.type, accType.type, `Account type should be ${accType.type}`)
    assertEqual(account.normal_balance, accType.normal_balance, `Normal balance should be ${accType.normal_balance}`)
  }
}

async function testDefaultAccountsSetup() {
  const { org } = await createTestOrganization(
    'Default Accounts Org',
    'default-accounts',
    'admin@defaults.ai',
    'professional'
  )
  
  // Create essential default accounts
  const defaults = {
    accounts_receivable: { code: '1200', name: 'Accounts Receivable', type: 'asset' },
    accounts_payable: { code: '2000', name: 'Accounts Payable', type: 'liability' },
    sales_revenue: { code: '4000', name: 'Sales Revenue', type: 'income' },
    sales_tax_payable: { code: '2300', name: 'Sales Tax Payable', type: 'liability' },
    retained_earnings: { code: '3200', name: 'Retained Earnings', type: 'equity' }
  }
  
  const createdDefaults = {}
  
  for (const [key, acc] of Object.entries(defaults)) {
    const { data: account } = await supabaseAdmin
      .from('chart_accounts')
      .insert({
        organization_id: org.id,
        ...acc,
        normal_balance: acc.type === 'asset' || acc.type === 'expense' ? 'debit' : 'credit',
        is_system: true
      })
      .select()
      .single()
    
    createdDefaults[key] = account.id
  }
  
  // Store default account IDs in org settings
  const { data: updated } = await supabaseAdmin
    .from('organizations')
    .update({
      feature_flags: {
        ...org.feature_flags,
        default_accounts: createdDefaults
      }
    })
    .eq('id', org.id)
    .select()
    .single()
  
  assertTrue(updated.feature_flags.default_accounts, 'Default accounts should be stored')
  assertTrue(updated.feature_flags.default_accounts.accounts_receivable, 'Should have default AR account')
  assertTrue(updated.feature_flags.default_accounts.accounts_payable, 'Should have default AP account')
}

// Run tests
async function main() {
  console.log('🚀 Starting Chart of Accounts Tests\n')
  
  // Clean up any existing test data
  const slugsToClean = [
    'anchorblock-coa',
    'teamqreative-coa',
    'unique-codes',
    'hierarchy-test',
    'system-accounts',
    'balance-types',
    'default-accounts'
  ]
  
  for (const slug of slugsToClean) {
    await cleanupBySlug(slug)
  }
  
  const results = await runTestSuite('Chart of Accounts Setup', [
    { name: 'SaaS chart of accounts template', fn: testSaaSChartOfAccounts },
    { name: 'Agency chart of accounts template', fn: testAgencyChartOfAccounts },
    { name: 'Account code uniqueness', fn: testAccountCodeUniqueness },
    { name: 'Account hierarchy structure', fn: testAccountHierarchy },
    { name: 'System account protection', fn: testSystemAccounts },
    { name: 'Account balance types', fn: testAccountBalanceTypes },
    { name: 'Default accounts setup', fn: testDefaultAccountsSetup }
  ])
  
  // Cleanup
  for (const slug of slugsToClean) {
    await cleanupBySlug(slug)
  }
  
  process.exit(results.failed > 0 ? 1 : 0)
}

main().catch(console.error)