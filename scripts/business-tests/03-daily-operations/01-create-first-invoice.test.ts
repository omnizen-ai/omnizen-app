/**
 * Test: Create First Invoice
 * Tests the complete invoice creation workflow with journal entries
 */

import { supabaseAdmin } from '../utils/db-client'
import { createTestOrganization } from '../utils/auth-context'
import { getSaaSChartOfAccounts } from '../utils/data-generators'
import { runTestSuite, assertEqual, assertTrue, assertJournalBalances, assertInvoiceAccounting } from '../utils/test-assertions'
import { cleanupBySlug } from '../utils/cleanup'

async function setupTestData(org: any) {
  // Setup chart of accounts
  const coaTemplate = getSaaSChartOfAccounts()
  const { data: accounts } = await supabaseAdmin
    .from('chart_accounts')
    .insert(
      coaTemplate.map(acc => ({
        ...acc,
        organization_id: org.id,
        current_balance: 0
      }))
    )
    .select()
  
  const accountsMap = {}
  accounts.forEach(acc => {
    accountsMap[acc.name] = acc.id
  })
  
  // Create customer
  const { data: customer } = await supabaseAdmin
    .from('contacts')
    .insert({
      organization_id: org.id,
      type: 'customer',
      company_name: 'TechStartup Inc',
      display_name: 'TechStartup Inc',
      email: 'billing@techstartup.com',
      payment_terms: 30,
      currency_code: 'USD'
    })
    .select()
    .single()
  
  // Create products
  const { data: products } = await supabaseAdmin
    .from('products')
    .insert([
      {
        organization_id: org.id,
        name: 'Professional Plan - Monthly',
        sku: 'PRO-M',
        sale_price: 299,
        is_service: true,
        income_account_id: accountsMap['Subscription Revenue']
      },
      {
        organization_id: org.id,
        name: 'Setup Fee',
        sku: 'SETUP',
        sale_price: 500,
        is_service: true,
        income_account_id: accountsMap['Professional Services Revenue']
      }
    ])
    .select()
  
  // Create tax code
  const { data: taxCode } = await supabaseAdmin
    .from('tax_codes')
    .insert({
      organization_id: org.id,
      code: 'SALES-TAX',
      name: 'Sales Tax',
      rate: 8.5,
      is_active: true
    })
    .select()
    .single()
  
  return { accountsMap, customer, products, taxCode }
}

async function testCreateFirstInvoice() {
  const { org } = await createTestOrganization(
    'Anchorblock Technology Limited',
    'anchorblock-invoice',
    'sales@anchorblock.ai',
    'professional'
  )
  
  const { accountsMap, customer, products, taxCode } = await setupTestData(org)
  
  // Create invoice
  const invoiceDate = new Date()
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 30)
  
  const { data: invoice, error } = await supabaseAdmin
    .from('invoices')
    .insert({
      organization_id: org.id,
      customer_id: customer.id,
      invoice_number: 'INV-2024-001',
      issue_date: invoiceDate.toISOString(),
      due_date: dueDate.toISOString(),
      currency_code: 'USD',
      status: 'draft',
      payment_terms: 30,
      po_number: 'PO-123',
      notes: 'Thank you for your business!',
      
      // Totals (will be calculated)
      subtotal: 0,
      tax_amount: 0,
      total_amount: 0,
      paid_amount: 0,
      balance_due: 0
    })
    .select()
    .single()
  
  assertTrue(!error, 'Invoice should be created without error')
  assertEqual(invoice.invoice_number, 'INV-2024-001', 'Invoice number should match')
  assertEqual(invoice.status, 'draft', 'Invoice should be in draft status')
  
  // Add invoice lines
  const lines = [
    {
      product_id: products[0].id,
      description: 'Professional Plan - January 2024',
      quantity: 1,
      unit_price: 299,
      amount: 299
    },
    {
      product_id: products[1].id,
      description: 'One-time setup and onboarding',
      quantity: 1,
      unit_price: 500,
      amount: 500
    }
  ]
  
  for (const line of lines) {
    await supabaseAdmin
      .from('invoice_lines')
      .insert({
        invoice_id: invoice.id,
        ...line,
        tax_code_id: taxCode.id,
        tax_rate: taxCode.rate,
        tax_amount: line.amount * (taxCode.rate / 100),
        line_total: line.amount * (1 + taxCode.rate / 100)
      })
  }
  
  // Calculate and update totals
  const subtotal = 799
  const taxAmount = subtotal * 0.085
  const totalAmount = subtotal + taxAmount
  
  const { data: updatedInvoice } = await supabaseAdmin
    .from('invoices')
    .update({
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      balance_due: totalAmount
    })
    .eq('id', invoice.id)
    .select()
    .single()
  
  assertEqual(updatedInvoice.subtotal, 799, 'Subtotal should be $799')
  assertEqual(Math.round(updatedInvoice.tax_amount * 100) / 100, 67.92, 'Tax should be $67.92')
  assertEqual(Math.round(updatedInvoice.total_amount * 100) / 100, 866.92, 'Total should be $866.92')
  
  return { org, invoice: updatedInvoice, accountsMap }
}

async function testSendInvoice() {
  const { org, invoice, accountsMap } = await testCreateFirstInvoice()
  
  // Send invoice (changes status and creates journal entry)
  const { data: sentInvoice } = await supabaseAdmin
    .from('invoices')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString()
    })
    .eq('id', invoice.id)
    .select()
    .single()
  
  assertEqual(sentInvoice.status, 'sent', 'Invoice should be marked as sent')
  
  // Create journal entry for the invoice
  const { data: journalEntry } = await supabaseAdmin
    .from('journal_entries')
    .insert({
      organization_id: org.id,
      entry_number: `JE-INV-${invoice.invoice_number}`,
      entry_date: invoice.issue_date,
      description: `Invoice ${invoice.invoice_number} - TechStartup Inc`,
      entry_type: 'sales',
      reference_type: 'invoice',
      reference_id: invoice.id,
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
        account_id: accountsMap['Accounts Receivable'],
        debit: invoice.total_amount,
        credit: 0,
        description: 'AR from invoice'
      },
      {
        journal_entry_id: journalEntry.id,
        account_id: accountsMap['Subscription Revenue'],
        debit: 0,
        credit: 299,
        description: 'Professional Plan revenue'
      },
      {
        journal_entry_id: journalEntry.id,
        account_id: accountsMap['Professional Services Revenue'],
        debit: 0,
        credit: 500,
        description: 'Setup fee revenue'
      },
      {
        journal_entry_id: journalEntry.id,
        account_id: accountsMap['Sales Tax Payable'],
        debit: 0,
        credit: invoice.tax_amount,
        description: 'Sales tax collected'
      }
    ])
  
  // Verify journal balances
  await assertJournalBalances(journalEntry.id)
  
  // Update account balances
  await supabaseAdmin
    .from('chart_accounts')
    .update({ current_balance: invoice.total_amount })
    .eq('id', accountsMap['Accounts Receivable'])
  
  return { org, invoice: sentInvoice, journalEntry, accountsMap }
}

async function testRecurringInvoice() {
  const { org } = await createTestOrganization(
    'Recurring Invoice Test',
    'recurring-invoice',
    'billing@recurring.ai',
    'professional'
  )
  
  const { accountsMap, customer, products } = await setupTestData(org)
  
  // Create recurring invoice template
  const { data: recurringTemplate } = await supabaseAdmin
    .from('recurring_invoices')
    .insert({
      organization_id: org.id,
      customer_id: customer.id,
      template_name: 'Monthly Subscription',
      frequency: 'monthly',
      next_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      
      // Template details
      product_id: products[0].id,
      quantity: 1,
      unit_price: 299,
      subtotal: 299,
      tax_rate: 8.5,
      tax_amount: 25.42,
      total_amount: 324.42,
      
      is_active: true,
      auto_send: true
    })
    .select()
    .single()
  
  assertTrue(recurringTemplate.is_active, 'Recurring template should be active')
  assertEqual(recurringTemplate.frequency, 'monthly', 'Should be monthly recurring')
  
  // Generate invoices for 3 months
  const generatedInvoices = []
  
  for (let month = 0; month < 3; month++) {
    const invoiceDate = new Date()
    invoiceDate.setMonth(invoiceDate.getMonth() + month)
    
    const { data: invoice } = await supabaseAdmin
      .from('invoices')
      .insert({
        organization_id: org.id,
        customer_id: customer.id,
        invoice_number: `INV-2024-${String(month + 1).padStart(3, '0')}`,
        issue_date: invoiceDate.toISOString(),
        due_date: new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        
        recurring_invoice_id: recurringTemplate.id,
        
        subtotal: recurringTemplate.subtotal,
        tax_amount: recurringTemplate.tax_amount,
        total_amount: recurringTemplate.total_amount,
        balance_due: recurringTemplate.total_amount,
        
        status: recurringTemplate.auto_send ? 'sent' : 'draft',
        sent_at: recurringTemplate.auto_send ? invoiceDate.toISOString() : null
      })
      .select()
      .single()
    
    generatedInvoices.push(invoice)
  }
  
  assertEqual(generatedInvoices.length, 3, 'Should generate 3 monthly invoices')
  
  // Calculate total MRR
  const mrr = recurringTemplate.total_amount
  const quarterlyRevenue = mrr * 3
  
  assertEqual(Math.round(quarterlyRevenue * 100) / 100, 973.26, 'Quarterly revenue should be $973.26')
}

async function testInvoiceWithDiscounts() {
  const { org } = await createTestOrganization(
    'Invoice Discount Test',
    'invoice-discount',
    'sales@discount.ai',
    'growth'
  )
  
  const { accountsMap, customer, products } = await setupTestData(org)
  
  // Create invoice with line-level and invoice-level discounts
  const { data: invoice } = await supabaseAdmin
    .from('invoices')
    .insert({
      organization_id: org.id,
      customer_id: customer.id,
      invoice_number: 'INV-DISC-001',
      issue_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'draft'
    })
    .select()
    .single()
  
  // Add lines with discounts
  const linesWithDiscounts = [
    {
      product_id: products[0].id,
      description: 'Professional Plan with 20% discount',
      quantity: 1,
      unit_price: 299,
      discount_type: 'percentage',
      discount_value: 20,
      discount_amount: 59.80,
      amount: 239.20 // After discount
    },
    {
      product_id: products[1].id,
      description: 'Setup Fee with $100 off',
      quantity: 1,
      unit_price: 500,
      discount_type: 'fixed',
      discount_value: 100,
      discount_amount: 100,
      amount: 400 // After discount
    }
  ]
  
  for (const line of linesWithDiscounts) {
    await supabaseAdmin
      .from('invoice_lines')
      .insert({
        invoice_id: invoice.id,
        ...line,
        line_total: line.amount
      })
  }
  
  // Apply invoice-level discount
  const subtotalAfterLineDiscounts = 639.20
  const invoiceDiscountPercentage = 10
  const invoiceDiscountAmount = subtotalAfterLineDiscounts * 0.10
  const finalSubtotal = subtotalAfterLineDiscounts - invoiceDiscountAmount
  
  // Calculate tax on discounted amount
  const taxRate = 8.5
  const taxAmount = finalSubtotal * (taxRate / 100)
  const totalAmount = finalSubtotal + taxAmount
  
  await supabaseAdmin
    .from('invoices')
    .update({
      subtotal: subtotalAfterLineDiscounts,
      discount_type: 'percentage',
      discount_value: invoiceDiscountPercentage,
      discount_amount: invoiceDiscountAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      balance_due: totalAmount
    })
    .eq('id', invoice.id)
  
  // Verify discount calculations
  assertEqual(Math.round(invoiceDiscountAmount * 100) / 100, 63.92, 'Invoice discount should be $63.92')
  assertEqual(Math.round(finalSubtotal * 100) / 100, 575.28, 'Final subtotal should be $575.28')
  assertEqual(Math.round(totalAmount * 100) / 100, 624.18, 'Total with tax should be $624.18')
}

async function testInvoiceVoid() {
  const { org, invoice, journalEntry } = await testSendInvoice()
  
  // Void the invoice
  const { data: voidedInvoice } = await supabaseAdmin
    .from('invoices')
    .update({
      status: 'void',
      voided_at: new Date().toISOString(),
      void_reason: 'Customer cancelled order'
    })
    .eq('id', invoice.id)
    .select()
    .single()
  
  assertEqual(voidedInvoice.status, 'void', 'Invoice should be voided')
  
  // Create reversal journal entry
  const { data: reversalEntry } = await supabaseAdmin
    .from('journal_entries')
    .insert({
      organization_id: org.id,
      entry_number: `REV-${journalEntry.entry_number}`,
      entry_date: new Date().toISOString(),
      description: `Reversal of ${journalEntry.description} - Voided`,
      entry_type: 'reversal',
      reference_type: 'invoice',
      reference_id: invoice.id,
      reverses_entry_id: journalEntry.id,
      status: 'posted'
    })
    .select()
    .single()
  
  // Create reversal lines (opposite of original)
  const { data: originalLines } = await supabaseAdmin
    .from('journal_lines')
    .select()
    .eq('journal_entry_id', journalEntry.id)
  
  for (const line of originalLines) {
    await supabaseAdmin
      .from('journal_lines')
      .insert({
        journal_entry_id: reversalEntry.id,
        account_id: line.account_id,
        debit: line.credit, // Swap debit and credit
        credit: line.debit,
        description: `Reversal: ${line.description}`
      })
  }
  
  // Verify reversal balances
  await assertJournalBalances(reversalEntry.id)
  
  // Update AR balance
  await supabaseAdmin
    .from('chart_accounts')
    .update({ current_balance: 0 })
    .eq('name', 'Accounts Receivable')
}

async function testCreditNote() {
  const { org, invoice, accountsMap } = await testSendInvoice()
  
  // Create credit note for partial refund
  const creditAmount = 100
  const creditTaxAmount = creditAmount * 0.085
  const creditTotal = creditAmount + creditTaxAmount
  
  const { data: creditNote } = await supabaseAdmin
    .from('credit_notes')
    .insert({
      organization_id: org.id,
      customer_id: invoice.customer_id,
      invoice_id: invoice.id,
      credit_note_number: 'CN-2024-001',
      issue_date: new Date().toISOString(),
      reason: 'Service adjustment',
      
      subtotal: creditAmount,
      tax_amount: creditTaxAmount,
      total_amount: creditTotal,
      
      status: 'issued'
    })
    .select()
    .single()
  
  assertEqual(creditNote.total_amount, creditTotal, 'Credit note total should match')
  
  // Create journal entry for credit note
  const { data: creditJournal } = await supabaseAdmin
    .from('journal_entries')
    .insert({
      organization_id: org.id,
      entry_number: `JE-CN-${creditNote.credit_note_number}`,
      entry_date: creditNote.issue_date,
      description: `Credit Note ${creditNote.credit_note_number}`,
      entry_type: 'credit_note',
      reference_type: 'credit_note',
      reference_id: creditNote.id,
      status: 'posted'
    })
    .select()
    .single()
  
  // Create journal lines (reverse of invoice)
  await supabaseAdmin
    .from('journal_lines')
    .insert([
      {
        journal_entry_id: creditJournal.id,
        account_id: accountsMap['Accounts Receivable'],
        debit: 0,
        credit: creditTotal, // Reduce AR
        description: 'Credit note - reduce AR'
      },
      {
        journal_entry_id: creditJournal.id,
        account_id: accountsMap['Subscription Revenue'],
        debit: creditAmount, // Reduce revenue
        credit: 0,
        description: 'Credit note - reduce revenue'
      },
      {
        journal_entry_id: creditJournal.id,
        account_id: accountsMap['Sales Tax Payable'],
        debit: creditTaxAmount, // Reduce tax liability
        credit: 0,
        description: 'Credit note - reduce tax'
      }
    ])
  
  // Update invoice balance
  const newBalance = invoice.balance_due - creditTotal
  await supabaseAdmin
    .from('invoices')
    .update({
      credit_amount: creditTotal,
      balance_due: newBalance
    })
    .eq('id', invoice.id)
  
  // Verify journal balances
  await assertJournalBalances(creditJournal.id)
}

async function testInvoiceAging() {
  const { org } = await createTestOrganization(
    'Invoice Aging Test',
    'invoice-aging',
    'credit@aging.ai',
    'professional'
  )
  
  const { customer } = await setupTestData(org)
  
  // Create invoices with different ages
  const agingInvoices = [
    { days_old: 0, status: 'sent', bucket: 'current' },
    { days_old: 15, status: 'sent', bucket: 'current' },
    { days_old: 35, status: 'overdue', bucket: '1-30 days' },
    { days_old: 55, status: 'overdue', bucket: '31-60 days' },
    { days_old: 75, status: 'overdue', bucket: '61-90 days' },
    { days_old: 120, status: 'overdue', bucket: 'over 90 days' }
  ]
  
  for (const inv of agingInvoices) {
    const issueDate = new Date()
    issueDate.setDate(issueDate.getDate() - inv.days_old - 30) // Issue 30 days before due
    
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() - inv.days_old)
    
    await supabaseAdmin
      .from('invoices')
      .insert({
        organization_id: org.id,
        customer_id: customer.id,
        invoice_number: `INV-AGE-${inv.days_old}`,
        issue_date: issueDate.toISOString(),
        due_date: dueDate.toISOString(),
        total_amount: 1000,
        balance_due: 1000,
        status: inv.status,
        aging_bucket: inv.bucket
      })
  }
  
  // Query overdue invoices
  const { data: overdueInvoices } = await supabaseAdmin
    .from('invoices')
    .select()
    .eq('organization_id', org.id)
    .eq('status', 'overdue')
  
  assertEqual(overdueInvoices.length, 4, 'Should have 4 overdue invoices')
  
  // Calculate total overdue amount
  const totalOverdue = overdueInvoices.reduce(
    (sum, inv) => sum + parseFloat(inv.balance_due),
    0
  )
  assertEqual(totalOverdue, 4000, 'Total overdue should be $4,000')
}

// Run tests
async function main() {
  console.log('🚀 Starting Create First Invoice Tests\n')
  
  // Clean up any existing test data
  const slugsToClean = [
    'anchorblock-invoice',
    'recurring-invoice',
    'invoice-discount',
    'invoice-aging'
  ]
  
  for (const slug of slugsToClean) {
    await cleanupBySlug(slug)
  }
  
  const results = await runTestSuite('Create First Invoice', [
    { name: 'Create first invoice', fn: testCreateFirstInvoice },
    { name: 'Send invoice with journal entry', fn: testSendInvoice },
    { name: 'Recurring invoice generation', fn: testRecurringInvoice },
    { name: 'Invoice with discounts', fn: testInvoiceWithDiscounts },
    { name: 'Void invoice with reversal', fn: testInvoiceVoid },
    { name: 'Credit note processing', fn: testCreditNote },
    { name: 'Invoice aging buckets', fn: testInvoiceAging }
  ])
  
  // Cleanup
  for (const slug of slugsToClean) {
    await cleanupBySlug(slug)
  }
  
  process.exit(results.failed > 0 ? 1 : 0)
}

main().catch(console.error)