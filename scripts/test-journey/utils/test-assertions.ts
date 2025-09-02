/**
 * Custom Test Assertions
 * Utility functions for validating test results
 */

import { supabaseAdmin } from './db-client'

/**
 * Assert that two values are equal
 */
export function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(
      message || `Assertion failed: ${actual} !== ${expected}`
    )
  }
}

/**
 * Assert that a value is truthy
 */
export function assertTrue(value: any, message?: string) {
  if (!value) {
    throw new Error(
      message || `Assertion failed: ${value} is not truthy`
    )
  }
}

/**
 * Assert that a value is falsy
 */
export function assertFalse(value: any, message?: string) {
  if (value) {
    throw new Error(
      message || `Assertion failed: ${value} is not falsy`
    )
  }
}

/**
 * Assert that journal entries balance (debits = credits)
 */
export async function assertJournalBalances(journalEntryId: string) {
  const { data: lines, error } = await supabaseAdmin
    .from('journal_lines')
    .select('debit, credit')
    .eq('journal_entry_id', journalEntryId)
  
  if (error) throw error
  
  const totals = lines.reduce(
    (acc, line) => ({
      debits: acc.debits + (parseFloat(line.debit) || 0),
      credits: acc.credits + (parseFloat(line.credit) || 0)
    }),
    { debits: 0, credits: 0 }
  )
  
  if (Math.abs(totals.debits - totals.credits) > 0.01) {
    throw new Error(
      `Journal entry ${journalEntryId} does not balance: Debits=${totals.debits}, Credits=${totals.credits}`
    )
  }
  
  return true
}

/**
 * Assert that an invoice has proper journal entries
 */
export async function assertInvoiceAccounting(invoiceId: string) {
  // Get the invoice
  const { data: invoice, error: invError } = await supabaseAdmin
    .from('invoices')
    .select('*, journal_entries!journal_entries_reference_id_fkey(*)')
    .eq('id', invoiceId)
    .single()
  
  if (invError) throw invError
  
  // Check journal entry exists
  if (!invoice.journal_entries || invoice.journal_entries.length === 0) {
    throw new Error(`Invoice ${invoiceId} has no journal entries`)
  }
  
  // Check journal balances
  for (const entry of invoice.journal_entries) {
    await assertJournalBalances(entry.id)
  }
  
  // Check correct accounts are used
  const { data: lines } = await supabaseAdmin
    .from('journal_lines')
    .select('*, chart_accounts!journal_lines_account_id_fkey(*)')
    .eq('journal_entry_id', invoice.journal_entries[0].id)
  
  const hasReceivable = lines?.some(l => 
    l.chart_accounts.name.toLowerCase().includes('receivable') && l.debit > 0
  )
  const hasRevenue = lines?.some(l => 
    l.chart_accounts.type === 'income' && l.credit > 0
  )
  
  if (!hasReceivable) {
    throw new Error(`Invoice ${invoiceId} missing AR debit`)
  }
  if (!hasRevenue) {
    throw new Error(`Invoice ${invoiceId} missing revenue credit`)
  }
  
  return true
}

/**
 * Assert RLS isolation between organizations
 */
export async function assertOrgIsolation(
  table: string,
  orgId1: string,
  orgId2: string
) {
  // Set context to org1
  await supabaseAdmin.rpc('set_auth_context', {
    p_org_id: orgId1,
    p_user_id: 'test-user-1',
    p_role: 'admin'
  })
  
  // Query data as org1
  const { data: org1Data } = await supabaseAdmin
    .from(table)
    .select('organization_id')
  
  // Check no org2 data visible
  const hasOrg2Data = org1Data?.some(row => row.organization_id === orgId2)
  
  if (hasOrg2Data) {
    throw new Error(
      `RLS violation: Org ${orgId1} can see data from Org ${orgId2} in table ${table}`
    )
  }
  
  // Set context to org2
  await supabaseAdmin.rpc('set_auth_context', {
    p_org_id: orgId2,
    p_user_id: 'test-user-2',
    p_role: 'admin'
  })
  
  // Query data as org2
  const { data: org2Data } = await supabaseAdmin
    .from(table)
    .select('organization_id')
  
  // Check no org1 data visible
  const hasOrg1Data = org2Data?.some(row => row.organization_id === orgId1)
  
  if (hasOrg1Data) {
    throw new Error(
      `RLS violation: Org ${orgId2} can see data from Org ${orgId1} in table ${table}`
    )
  }
  
  return true
}

/**
 * Assert that a semantic view returns valid data
 */
export async function assertSemanticView(
  viewName: string,
  orgId: string,
  expectations: {
    minRows?: number
    maxRows?: number
    requiredColumns?: string[]
    validations?: Array<(row: any) => boolean>
  } = {}
) {
  // Set auth context
  await supabaseAdmin.rpc('set_auth_context', {
    p_org_id: orgId,
    p_user_id: 'test-user',
    p_role: 'admin'
  })
  
  // Query the view
  const { data, error } = await supabaseAdmin
    .from(`semantic.${viewName}`)
    .select()
  
  if (error) {
    throw new Error(`Failed to query view ${viewName}: ${error.message}`)
  }
  
  // Check row count
  if (expectations.minRows !== undefined && data.length < expectations.minRows) {
    throw new Error(
      `View ${viewName} returned ${data.length} rows, expected at least ${expectations.minRows}`
    )
  }
  
  if (expectations.maxRows !== undefined && data.length > expectations.maxRows) {
    throw new Error(
      `View ${viewName} returned ${data.length} rows, expected at most ${expectations.maxRows}`
    )
  }
  
  // Check required columns exist
  if (expectations.requiredColumns && data.length > 0) {
    const columns = Object.keys(data[0])
    for (const col of expectations.requiredColumns) {
      if (!columns.includes(col)) {
        throw new Error(`View ${viewName} missing required column: ${col}`)
      }
    }
  }
  
  // Run custom validations
  if (expectations.validations) {
    for (const row of data) {
      for (const validation of expectations.validations) {
        if (!validation(row)) {
          throw new Error(
            `View ${viewName} validation failed for row: ${JSON.stringify(row)}`
          )
        }
      }
    }
  }
  
  return true
}

/**
 * Assert that financial ratios are calculated correctly
 */
export async function assertFinancialRatios(orgId: string) {
  const { data: ratios } = await supabaseAdmin
    .from('semantic.v_financial_ratios')
    .select()
    .single()
  
  // Current ratio should be positive if there are assets
  if (ratios.total_current_assets > 0 && ratios.current_ratio <= 0) {
    throw new Error('Invalid current ratio calculation')
  }
  
  // Debt to equity should be non-negative
  if (ratios.debt_to_equity_ratio < 0) {
    throw new Error('Invalid debt to equity ratio')
  }
  
  // Working capital calculation
  const expectedWorkingCapital = 
    ratios.total_current_assets - ratios.total_current_liabilities
  
  if (Math.abs(ratios.working_capital - expectedWorkingCapital) > 0.01) {
    throw new Error(
      `Working capital mismatch: ${ratios.working_capital} != ${expectedWorkingCapital}`
    )
  }
  
  return true
}

/**
 * Test runner helper
 */
export async function runTest(
  name: string,
  testFn: () => Promise<void>
) {
  try {
    console.log(`\n🧪 Running: ${name}`)
    await testFn()
    console.log(`✅ Passed: ${name}`)
    return { name, passed: true }
  } catch (error) {
    console.error(`❌ Failed: ${name}`)
    console.error(`   Error: ${error.message}`)
    return { name, passed: false, error: error.message }
  }
}

/**
 * Run multiple tests and report results
 */
export async function runTestSuite(
  suiteName: string,
  tests: Array<{ name: string; fn: () => Promise<void> }>
) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`📋 Test Suite: ${suiteName}`)
  console.log(`${'='.repeat(60)}`)
  
  const results = []
  
  for (const test of tests) {
    const result = await runTest(test.name, test.fn)
    results.push(result)
  }
  
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  
  console.log(`\n${'='.repeat(60)}`)
  console.log(`📊 Results: ${passed} passed, ${failed} failed`)
  
  if (failed > 0) {
    console.log('\nFailed tests:')
    results
      .filter(r => !r.passed)
      .forEach(r => console.log(`  ❌ ${r.name}: ${r.error}`))
  }
  
  console.log(`${'='.repeat(60)}\n`)
  
  return {
    suiteName,
    total: tests.length,
    passed,
    failed,
    results
  }
}