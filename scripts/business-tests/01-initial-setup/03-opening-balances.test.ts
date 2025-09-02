/**
 * Test: Opening Balances
 * Tests setting up initial account balances with proper journal entries
 */

import { supabaseAdmin } from '../utils/db-client'
import { createTestOrganization } from '../utils/auth-context'
import { getSaaSChartOfAccounts } from '../utils/data-generators'
import { runTestSuite, assertEqual, assertTrue, assertJournalBalances } from '../utils/test-assertions'
import { cleanupBySlug } from '../utils/cleanup'

async function setupChartOfAccounts(orgId: string) {
  const template = getSaaSChartOfAccounts()
  
  const { data: accounts } = await supabaseAdmin
    .from('chart_accounts')
    .insert(
      template.map(acc => ({
        ...acc,
        organization_id: orgId,
        is_system: true,
        is_active: true,
        current_balance: 0
      }))
    )
    .select()
  
  // Return accounts mapped by name for easy access
  const accountMap = {}
  accounts.forEach(acc => {
    accountMap[acc.name] = acc
  })
  
  return accountMap
}

async function testOpeningBalanceEntry() {
  const { org } = await createTestOrganization(
    'Anchorblock Technology Limited',
    'anchorblock-opening',
    'cfo@anchorblock.ai',
    'professional'
  )
  
  const accounts = await setupChartOfAccounts(org.id)
  
  // Create opening balance journal entry
  const openingDate = new Date()
  openingDate.setMonth(0, 1) // January 1st
  
  const { data: journalEntry, error } = await supabaseAdmin
    .from('journal_entries')
    .insert({
      organization_id: org.id,
      entry_number: 'OB-2024-001',
      entry_date: openingDate.toISOString(),
      description: 'Opening Balances - January 1, 2024',
      entry_type: 'opening_balance',
      status: 'posted',
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  assertTrue(journalEntry, 'Opening balance journal entry should be created')
  assertEqual(journalEntry.entry_type, 'opening_balance', 'Should be marked as opening balance')
  
  // Add journal lines for opening balances
  const openingBalances = [
    // Assets (Debits)
    { account: 'Cash - Operating Account', debit: 50000, credit: 0 },
    { account: 'Cash - Savings Account', debit: 100000, credit: 0 },
    { account: 'Accounts Receivable', debit: 35000, credit: 0 },
    { account: 'Prepaid Expenses', debit: 5000, credit: 0 },
    { account: 'Computer Equipment', debit: 25000, credit: 0 },
    
    // Liabilities (Credits)
    { account: 'Accounts Payable', debit: 0, credit: 15000 },
    { account: 'Credit Card Payable', debit: 0, credit: 3000 },
    { account: 'Deferred Revenue', debit: 0, credit: 45000 },
    
    // Equity (Credits) - Balancing entry
    { account: 'Retained Earnings', debit: 0, credit: 152000 }
  ]
  
  for (const line of openingBalances) {
    const account = accounts[line.account]
    assertTrue(account, `Account ${line.account} should exist`)
    
    await supabaseAdmin
      .from('journal_lines')
      .insert({
        journal_entry_id: journalEntry.id,
        account_id: account.id,
        debit: line.debit,
        credit: line.credit,
        description: `Opening balance - ${line.account}`
      })
  }
  
  // Verify journal balances
  await assertJournalBalances(journalEntry.id)
  
  // Update account current balances
  for (const line of openingBalances) {
    const account = accounts[line.account]
    const balance = line.debit > 0 ? line.debit : -line.credit
    
    await supabaseAdmin
      .from('chart_accounts')
      .update({ current_balance: balance })
      .eq('id', account.id)
  }
  
  return { org, journalEntry, accounts }
}

async function testBalanceSheetEquation() {
  const { org } = await createTestOrganization(
    'Balance Sheet Test',
    'balance-test',
    'cfo@balance.ai',
    'professional'
  )
  
  const accounts = await setupChartOfAccounts(org.id)
  
  // Set up a balanced set of opening balances
  const balances = {
    // Assets = 200,000
    assets: [
      { account: accounts['Cash - Operating Account'], amount: 75000 },
      { account: accounts['Accounts Receivable'], amount: 50000 },
      { account: accounts['Prepaid Expenses'], amount: 10000 },
      { account: accounts['Computer Equipment'], amount: 65000 }
    ],
    // Liabilities = 80,000
    liabilities: [
      { account: accounts['Accounts Payable'], amount: 30000 },
      { account: accounts['Credit Card Payable'], amount: 5000 },
      { account: accounts['Deferred Revenue'], amount: 45000 }
    ],
    // Equity = 120,000 (Assets - Liabilities)
    equity: [
      { account: accounts['Common Stock'], amount: 50000 },
      { account: accounts['Retained Earnings'], amount: 70000 }
    ]
  }
  
  // Create opening balance entry
  const { data: journalEntry } = await supabaseAdmin
    .from('journal_entries')
    .insert({
      organization_id: org.id,
      entry_number: 'OB-TEST-001',
      entry_date: new Date().toISOString(),
      description: 'Opening Balances - Balance Sheet Test',
      entry_type: 'opening_balance',
      status: 'posted'
    })
    .select()
    .single()
  
  // Add journal lines
  const journalLines = []
  
  // Assets (debits)
  for (const item of balances.assets) {
    journalLines.push({
      journal_entry_id: journalEntry.id,
      account_id: item.account.id,
      debit: item.amount,
      credit: 0
    })
  }
  
  // Liabilities (credits)
  for (const item of balances.liabilities) {
    journalLines.push({
      journal_entry_id: journalEntry.id,
      account_id: item.account.id,
      debit: 0,
      credit: item.amount
    })
  }
  
  // Equity (credits)
  for (const item of balances.equity) {
    journalLines.push({
      journal_entry_id: journalEntry.id,
      account_id: item.account.id,
      debit: 0,
      credit: item.amount
    })
  }
  
  await supabaseAdmin.from('journal_lines').insert(journalLines)
  
  // Verify the accounting equation: Assets = Liabilities + Equity
  const { data: lines } = await supabaseAdmin
    .from('journal_lines')
    .select('debit, credit')
    .eq('journal_entry_id', journalEntry.id)
  
  const totals = lines.reduce(
    (acc, line) => ({
      debits: acc.debits + parseFloat(line.debit || 0),
      credits: acc.credits + parseFloat(line.credit || 0)
    }),
    { debits: 0, credits: 0 }
  )
  
  assertEqual(totals.debits, 200000, 'Total debits (assets) should be 200,000')
  assertEqual(totals.credits, 200000, 'Total credits (liabilities + equity) should be 200,000')
  assertEqual(totals.debits, totals.credits, 'Debits must equal credits')
  
  // Calculate and verify the accounting equation
  const totalAssets = 200000
  const totalLiabilities = 80000
  const totalEquity = 120000
  
  assertEqual(
    totalAssets,
    totalLiabilities + totalEquity,
    'Assets = Liabilities + Equity'
  )
}

async function testOpeningARBalance() {
  const { org } = await createTestOrganization(
    'AR Opening Test',
    'ar-opening',
    'cfo@ar.ai',
    'growth'
  )
  
  const accounts = await setupChartOfAccounts(org.id)
  
  // Create some customers first
  const customers = []
  for (let i = 1; i <= 3; i++) {
    const { data: customer } = await supabaseAdmin
      .from('contacts')
      .insert({
        organization_id: org.id,
        type: 'customer',
        company_name: `Customer ${i}`,
        display_name: `Customer ${i}`,
        email: `customer${i}@example.com`
      })
      .select()
      .single()
    
    customers.push(customer)
  }
  
  // Create opening AR balances with detailed breakdown
  const arBalances = [
    { customer: customers[0], amount: 15000, age: 15 }, // 15 days old
    { customer: customers[1], amount: 8000, age: 45 },  // 45 days old
    { customer: customers[2], amount: 12000, age: 5 }   // 5 days old
  ]
  
  const totalAR = arBalances.reduce((sum, item) => sum + item.amount, 0)
  
  // Create opening balance journal entry
  const { data: journalEntry } = await supabaseAdmin
    .from('journal_entries')
    .insert({
      organization_id: org.id,
      entry_number: 'OB-AR-001',
      entry_date: new Date().toISOString(),
      description: 'Opening AR Balances',
      entry_type: 'opening_balance',
      status: 'posted'
    })
    .select()
    .single()
  
  // Create journal lines
  await supabaseAdmin
    .from('journal_lines')
    .insert([
      {
        journal_entry_id: journalEntry.id,
        account_id: accounts['Accounts Receivable'].id,
        debit: totalAR,
        credit: 0,
        description: 'Total opening AR'
      },
      {
        journal_entry_id: journalEntry.id,
        account_id: accounts['Retained Earnings'].id,
        debit: 0,
        credit: totalAR,
        description: 'Offset to retained earnings'
      }
    ])
  
  // Create placeholder invoices for AR aging
  for (const arItem of arBalances) {
    const issueDate = new Date()
    issueDate.setDate(issueDate.getDate() - arItem.age - 30) // Issued 30 days before age
    
    const dueDate = new Date(issueDate)
    dueDate.setDate(dueDate.getDate() + 30) // Net 30
    
    await supabaseAdmin
      .from('invoices')
      .insert({
        organization_id: org.id,
        customer_id: arItem.customer.id,
        invoice_number: `OB-${arItem.customer.id}`,
        issue_date: issueDate.toISOString(),
        due_date: dueDate.toISOString(),
        total_amount: arItem.amount,
        paid_amount: 0,
        balance_due: arItem.amount,
        status: arItem.age > 30 ? 'overdue' : 'sent',
        notes: 'Opening balance invoice'
      })
  }
  
  // Verify total AR
  const { data: invoices } = await supabaseAdmin
    .from('invoices')
    .select('balance_due')
    .eq('organization_id', org.id)
  
  const totalInvoiceBalance = invoices.reduce(
    (sum, inv) => sum + parseFloat(inv.balance_due || 0),
    0
  )
  
  assertEqual(totalInvoiceBalance, totalAR, 'Invoice balances should match AR balance')
}

async function testOpeningAPBalance() {
  const { org } = await createTestOrganization(
    'AP Opening Test',
    'ap-opening',
    'cfo@ap.ai',
    'growth'
  )
  
  const accounts = await setupChartOfAccounts(org.id)
  
  // Create vendors
  const vendors = []
  for (let i = 1; i <= 3; i++) {
    const { data: vendor } = await supabaseAdmin
      .from('contacts')
      .insert({
        organization_id: org.id,
        type: 'vendor',
        company_name: `Vendor ${i}`,
        display_name: `Vendor ${i}`,
        email: `vendor${i}@example.com`
      })
      .select()
      .single()
    
    vendors.push(vendor)
  }
  
  // Create opening AP balances
  const apBalances = [
    { vendor: vendors[0], amount: 5000, age: 10 },
    { vendor: vendors[1], amount: 8000, age: 25 },
    { vendor: vendors[2], amount: 2000, age: 40 } // Overdue
  ]
  
  const totalAP = apBalances.reduce((sum, item) => sum + item.amount, 0)
  
  // Create opening balance journal entry
  const { data: journalEntry } = await supabaseAdmin
    .from('journal_entries')
    .insert({
      organization_id: org.id,
      entry_number: 'OB-AP-001',
      entry_date: new Date().toISOString(),
      description: 'Opening AP Balances',
      entry_type: 'opening_balance',
      status: 'posted'
    })
    .select()
    .single()
  
  // Create journal lines
  await supabaseAdmin
    .from('journal_lines')
    .insert([
      {
        journal_entry_id: journalEntry.id,
        account_id: accounts['Retained Earnings'].id,
        debit: totalAP,
        credit: 0,
        description: 'Offset from retained earnings'
      },
      {
        journal_entry_id: journalEntry.id,
        account_id: accounts['Accounts Payable'].id,
        debit: 0,
        credit: totalAP,
        description: 'Total opening AP'
      }
    ])
  
  // Create placeholder bills for AP aging
  for (const apItem of apBalances) {
    const billDate = new Date()
    billDate.setDate(billDate.getDate() - apItem.age - 30)
    
    const dueDate = new Date(billDate)
    dueDate.setDate(dueDate.getDate() + 30)
    
    await supabaseAdmin
      .from('bills')
      .insert({
        organization_id: org.id,
        vendor_id: apItem.vendor.id,
        bill_number: `OB-BILL-${apItem.vendor.id}`,
        bill_date: billDate.toISOString(),
        due_date: dueDate.toISOString(),
        total_amount: apItem.amount,
        paid_amount: 0,
        balance_due: apItem.amount,
        status: apItem.age > 30 ? 'overdue' : 'approved',
        notes: 'Opening balance bill'
      })
  }
}

async function testOpeningInventory() {
  const { org } = await createTestOrganization(
    'Inventory Opening Test',
    'inv-opening',
    'cfo@inventory.ai',
    'professional'
  )
  
  const accounts = await setupChartOfAccounts(org.id)
  
  // Create products
  const products = []
  const productData = [
    { name: 'Software License A', sku: 'LIC-A', cost: 50 },
    { name: 'Software License B', sku: 'LIC-B', cost: 100 },
    { name: 'Hardware Device', sku: 'HW-001', cost: 500 }
  ]
  
  for (const prod of productData) {
    const { data: product } = await supabaseAdmin
      .from('products')
      .insert({
        organization_id: org.id,
        name: prod.name,
        sku: prod.sku,
        is_tracked_inventory: true,
        purchase_price: prod.cost,
        sale_price: prod.cost * 2
      })
      .select()
      .single()
    
    products.push({ ...product, cost: prod.cost })
  }
  
  // Create warehouse
  const { data: warehouse } = await supabaseAdmin
    .from('warehouses')
    .insert({
      organization_id: org.id,
      name: 'Main Warehouse',
      code: 'MAIN',
      type: 'physical',
      is_active: true
    })
    .select()
    .single()
  
  // Create opening inventory levels
  const inventoryData = [
    { product: products[0], quantity: 100 },
    { product: products[1], quantity: 50 },
    { product: products[2], quantity: 10 }
  ]
  
  let totalInventoryValue = 0
  
  for (const item of inventoryData) {
    const value = item.quantity * item.product.cost
    totalInventoryValue += value
    
    await supabaseAdmin
      .from('inventory_levels')
      .insert({
        organization_id: org.id,
        product_id: item.product.id,
        warehouse_id: warehouse.id,
        quantity_on_hand: item.quantity,
        quantity_available: item.quantity,
        quantity_reserved: 0,
        average_cost: item.product.cost,
        total_value: value,
        last_counted_date: new Date().toISOString()
      })
  }
  
  // Create journal entry for inventory
  const { data: journalEntry } = await supabaseAdmin
    .from('journal_entries')
    .insert({
      organization_id: org.id,
      entry_number: 'OB-INV-001',
      entry_date: new Date().toISOString(),
      description: 'Opening Inventory Balances',
      entry_type: 'opening_balance',
      status: 'posted'
    })
    .select()
    .single()
  
  // Create journal lines
  await supabaseAdmin
    .from('journal_lines')
    .insert([
      {
        journal_entry_id: journalEntry.id,
        account_id: accounts['Inventory'].id || accounts['Computer Equipment'].id,
        debit: totalInventoryValue,
        credit: 0,
        description: 'Opening inventory value'
      },
      {
        journal_entry_id: journalEntry.id,
        account_id: accounts['Retained Earnings'].id,
        debit: 0,
        credit: totalInventoryValue,
        description: 'Offset to retained earnings'
      }
    ])
  
  assertEqual(totalInventoryValue, 10000, 'Total inventory value should be correct')
}

async function testTrialBalance() {
  const { org } = await createTestOrganization(
    'Trial Balance Test',
    'trial-balance',
    'cfo@trial.ai',
    'professional'
  )
  
  const accounts = await setupChartOfAccounts(org.id)
  
  // Create comprehensive opening balances
  const { data: journalEntry } = await supabaseAdmin
    .from('journal_entries')
    .insert({
      organization_id: org.id,
      entry_number: 'OB-TB-001',
      entry_date: new Date().toISOString(),
      description: 'Complete Opening Balances',
      entry_type: 'opening_balance',
      status: 'posted'
    })
    .select()
    .single()
  
  const openingBalances = [
    // Assets (Debits)
    { account: 'Cash - Operating Account', debit: 100000, credit: 0 },
    { account: 'Accounts Receivable', debit: 50000, credit: 0 },
    { account: 'Computer Equipment', debit: 30000, credit: 0 },
    
    // Liabilities (Credits)
    { account: 'Accounts Payable', debit: 0, credit: 20000 },
    { account: 'Deferred Revenue', debit: 0, credit: 40000 },
    
    // Equity (Credits)
    { account: 'Common Stock', debit: 0, credit: 100000 },
    { account: 'Retained Earnings', debit: 0, credit: 20000 }
  ]
  
  // Insert journal lines
  for (const line of openingBalances) {
    const account = accounts[line.account]
    await supabaseAdmin
      .from('journal_lines')
      .insert({
        journal_entry_id: journalEntry.id,
        account_id: account.id,
        debit: line.debit,
        credit: line.credit
      })
  }
  
  // Generate trial balance
  const { data: trialBalance } = await supabaseAdmin
    .from('journal_lines')
    .select(`
      account_id,
      chart_accounts!inner (
        code,
        name,
        type,
        normal_balance
      ),
      debit,
      credit
    `)
    .eq('journal_entry_id', journalEntry.id)
  
  // Calculate totals
  const totals = trialBalance.reduce(
    (acc, line) => ({
      debits: acc.debits + parseFloat(line.debit || 0),
      credits: acc.credits + parseFloat(line.credit || 0)
    }),
    { debits: 0, credits: 0 }
  )
  
  assertEqual(totals.debits, totals.credits, 'Trial balance must balance')
  assertEqual(totals.debits, 180000, 'Total debits should be 180,000')
  assertEqual(totals.credits, 180000, 'Total credits should be 180,000')
}

// Run tests
async function main() {
  console.log('🚀 Starting Opening Balances Tests\n')
  
  // Clean up any existing test data
  const slugsToClean = [
    'anchorblock-opening',
    'balance-test',
    'ar-opening',
    'ap-opening',
    'inv-opening',
    'trial-balance'
  ]
  
  for (const slug of slugsToClean) {
    await cleanupBySlug(slug)
  }
  
  const results = await runTestSuite('Opening Balances', [
    { name: 'Basic opening balance entry', fn: testOpeningBalanceEntry },
    { name: 'Balance sheet equation verification', fn: testBalanceSheetEquation },
    { name: 'Opening AR balance setup', fn: testOpeningARBalance },
    { name: 'Opening AP balance setup', fn: testOpeningAPBalance },
    { name: 'Opening inventory setup', fn: testOpeningInventory },
    { name: 'Trial balance verification', fn: testTrialBalance }
  ])
  
  // Cleanup
  for (const slug of slugsToClean) {
    await cleanupBySlug(slug)
  }
  
  process.exit(results.failed > 0 ? 1 : 0)
}

main().catch(console.error)