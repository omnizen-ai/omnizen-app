/**
 * Data Generator Utilities
 * Functions to generate realistic test data for business scenarios
 */

import { supabaseAdmin } from './db-client'

/**
 * Generate a realistic company name
 */
export function generateCompanyName(type: 'tech' | 'agency' | 'retail' | 'service' = 'tech'): string {
  const prefixes = {
    tech: ['Tech', 'Digital', 'Cloud', 'Data', 'Cyber', 'AI', 'Smart', 'Net'],
    agency: ['Creative', 'Design', 'Brand', 'Media', 'Marketing', 'Studio'],
    retail: ['Global', 'Premier', 'Elite', 'Prime', 'Select'],
    service: ['Pro', 'Expert', 'Master', 'Premier', 'Solutions']
  }
  
  const suffixes = {
    tech: ['Labs', 'Systems', 'Solutions', 'Technologies', 'Innovations', 'Inc'],
    agency: ['Agency', 'Studios', 'Creative', 'Collective', 'Partners'],
    retail: ['Store', 'Market', 'Outlet', 'Trading', 'Co'],
    service: ['Services', 'Consulting', 'Group', 'Associates', 'Partners']
  }
  
  const prefix = prefixes[type][Math.floor(Math.random() * prefixes[type].length)]
  const suffix = suffixes[type][Math.floor(Math.random() * suffixes[type].length)]
  
  return `${prefix} ${suffix}`
}

/**
 * Generate realistic customer data for a SaaS company
 */
export function generateSaaSCustomers(count: number = 10) {
  const customers = []
  const plans = ['starter', 'growth', 'professional', 'enterprise']
  
  for (let i = 0; i < count; i++) {
    const companyName = generateCompanyName('tech')
    const plan = plans[Math.floor(Math.random() * plans.length)]
    
    customers.push({
      type: 'customer',
      company_name: companyName,
      display_name: companyName,
      email: `billing@${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
      phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
      address_line1: `${Math.floor(Math.random() * 9999) + 1} Tech Boulevard`,
      city: ['San Francisco', 'Austin', 'Seattle', 'Boston', 'Denver'][Math.floor(Math.random() * 5)],
      state: ['CA', 'TX', 'WA', 'MA', 'CO'][Math.floor(Math.random() * 5)],
      postal_code: `${Math.floor(Math.random() * 90000) + 10000}`,
      country: 'US',
      currency_code: 'USD',
      payment_terms: plan === 'enterprise' ? 45 : 30,
      credit_limit: plan === 'enterprise' ? 50000 : plan === 'professional' ? 20000 : 5000,
      custom_fields: {
        subscription_plan: plan,
        mrr: plan === 'enterprise' ? 999 : plan === 'professional' ? 299 : plan === 'growth' ? 99 : 29,
        signup_date: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString()
      },
      is_active: Math.random() > 0.1 // 90% active
    })
  }
  
  return customers
}

/**
 * Generate realistic vendor data
 */
export function generateVendors(type: 'saas' | 'agency' = 'saas') {
  const saasVendors = [
    { name: 'Amazon Web Services', email: 'billing@aws.amazon.com', category: 'Infrastructure' },
    { name: 'Google Cloud Platform', email: 'billing@cloud.google.com', category: 'Infrastructure' },
    { name: 'Stripe Inc', email: 'invoices@stripe.com', category: 'Payment Processing' },
    { name: 'Twilio Inc', email: 'billing@twilio.com', category: 'Communications' },
    { name: 'SendGrid', email: 'billing@sendgrid.com', category: 'Email Service' },
    { name: 'Datadog Inc', email: 'billing@datadoghq.com', category: 'Monitoring' },
    { name: 'Slack Technologies', email: 'billing@slack.com', category: 'Collaboration' },
    { name: 'GitHub Inc', email: 'billing@github.com', category: 'Development Tools' }
  ]
  
  const agencyVendors = [
    { name: 'Adobe Inc', email: 'billing@adobe.com', category: 'Software' },
    { name: 'Figma Inc', email: 'billing@figma.com', category: 'Design Tools' },
    { name: 'Shutterstock', email: 'billing@shutterstock.com', category: 'Stock Assets' },
    { name: 'Freelancer Platform', email: 'invoices@upwork.com', category: 'Contractors' },
    { name: 'Print House Pro', email: 'orders@printhousepro.com', category: 'Printing' },
    { name: 'Office Supplies Co', email: 'billing@officesupplies.com', category: 'Supplies' }
  ]
  
  const vendors = type === 'saas' ? saasVendors : agencyVendors
  
  return vendors.map(v => ({
    type: 'vendor',
    company_name: v.name,
    display_name: v.name,
    email: v.email,
    payment_terms: 30,
    currency_code: 'USD',
    tax_id: `${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000000) + 1000000}`,
    custom_fields: { category: v.category },
    is_active: true
  }))
}

/**
 * Generate SaaS Chart of Accounts
 */
export function getSaaSChartOfAccounts() {
  return [
    // Assets (1000s)
    { code: '1000', name: 'Cash - Operating Account', type: 'asset', normal_balance: 'debit' },
    { code: '1010', name: 'Cash - Payroll Account', type: 'asset', normal_balance: 'debit' },
    { code: '1020', name: 'Cash - Savings Account', type: 'asset', normal_balance: 'debit' },
    { code: '1200', name: 'Accounts Receivable', type: 'asset', normal_balance: 'debit' },
    { code: '1210', name: 'Allowance for Doubtful Accounts', type: 'contra_asset', normal_balance: 'credit' },
    { code: '1300', name: 'Prepaid Expenses', type: 'asset', normal_balance: 'debit' },
    { code: '1400', name: 'Security Deposits', type: 'asset', normal_balance: 'debit' },
    { code: '1500', name: 'Computer Equipment', type: 'asset', normal_balance: 'debit' },
    { code: '1510', name: 'Accumulated Depreciation - Equipment', type: 'contra_asset', normal_balance: 'credit' },
    { code: '1600', name: 'Software Licenses', type: 'asset', normal_balance: 'debit' },
    { code: '1700', name: 'Deferred Tax Assets', type: 'asset', normal_balance: 'debit' },
    
    // Liabilities (2000s)
    { code: '2000', name: 'Accounts Payable', type: 'liability', normal_balance: 'credit' },
    { code: '2100', name: 'Credit Card Payable', type: 'liability', normal_balance: 'credit' },
    { code: '2200', name: 'Payroll Liabilities', type: 'liability', normal_balance: 'credit' },
    { code: '2300', name: 'Sales Tax Payable', type: 'liability', normal_balance: 'credit' },
    { code: '2400', name: 'Deferred Revenue', type: 'liability', normal_balance: 'credit' },
    { code: '2500', name: 'Accrued Expenses', type: 'liability', normal_balance: 'credit' },
    { code: '2600', name: 'Income Tax Payable', type: 'liability', normal_balance: 'credit' },
    
    // Equity (3000s)
    { code: '3000', name: 'Common Stock', type: 'equity', normal_balance: 'credit' },
    { code: '3100', name: 'Additional Paid-in Capital', type: 'equity', normal_balance: 'credit' },
    { code: '3200', name: 'Retained Earnings', type: 'equity', normal_balance: 'credit' },
    { code: '3300', name: 'Current Year Earnings', type: 'equity', normal_balance: 'credit' },
    
    // Revenue (4000s)
    { code: '4000', name: 'Subscription Revenue', type: 'income', normal_balance: 'credit' },
    { code: '4010', name: 'Professional Services Revenue', type: 'income', normal_balance: 'credit' },
    { code: '4020', name: 'API Usage Revenue', type: 'income', normal_balance: 'credit' },
    { code: '4100', name: 'Setup Fee Revenue', type: 'income', normal_balance: 'credit' },
    { code: '4200', name: 'Training Revenue', type: 'income', normal_balance: 'credit' },
    { code: '4900', name: 'Other Revenue', type: 'income', normal_balance: 'credit' },
    
    // Cost of Revenue (5000s)
    { code: '5000', name: 'Infrastructure Costs', type: 'expense', normal_balance: 'debit' },
    { code: '5100', name: 'Third-party Service Costs', type: 'expense', normal_balance: 'debit' },
    { code: '5200', name: 'Payment Processing Fees', type: 'expense', normal_balance: 'debit' },
    { code: '5300', name: 'Customer Support Costs', type: 'expense', normal_balance: 'debit' },
    
    // Operating Expenses (6000s)
    { code: '6000', name: 'Salaries and Wages', type: 'expense', normal_balance: 'debit' },
    { code: '6100', name: 'Payroll Taxes', type: 'expense', normal_balance: 'debit' },
    { code: '6200', name: 'Employee Benefits', type: 'expense', normal_balance: 'debit' },
    { code: '6300', name: 'Contractor Expenses', type: 'expense', normal_balance: 'debit' },
    { code: '6400', name: 'Rent Expense', type: 'expense', normal_balance: 'debit' },
    { code: '6500', name: 'Software Subscriptions', type: 'expense', normal_balance: 'debit' },
    { code: '6600', name: 'Marketing and Advertising', type: 'expense', normal_balance: 'debit' },
    { code: '6700', name: 'Travel and Entertainment', type: 'expense', normal_balance: 'debit' },
    { code: '6800', name: 'Office Supplies', type: 'expense', normal_balance: 'debit' },
    { code: '6900', name: 'Professional Fees', type: 'expense', normal_balance: 'debit' },
    { code: '7000', name: 'Depreciation Expense', type: 'expense', normal_balance: 'debit' },
    { code: '7100', name: 'Insurance Expense', type: 'expense', normal_balance: 'debit' },
    { code: '7200', name: 'Bank Fees', type: 'expense', normal_balance: 'debit' },
    { code: '7900', name: 'Other Operating Expenses', type: 'expense', normal_balance: 'debit' }
  ]
}

/**
 * Generate Agency Chart of Accounts
 */
export function getAgencyChartOfAccounts() {
  return [
    // Assets (1000s)
    { code: '1000', name: 'Cash - Operating Account', type: 'asset', normal_balance: 'debit' },
    { code: '1100', name: 'Accounts Receivable', type: 'asset', normal_balance: 'debit' },
    { code: '1200', name: 'Work in Progress', type: 'asset', normal_balance: 'debit' },
    { code: '1300', name: 'Prepaid Expenses', type: 'asset', normal_balance: 'debit' },
    { code: '1400', name: 'Computer Equipment', type: 'asset', normal_balance: 'debit' },
    { code: '1410', name: 'Accumulated Depreciation', type: 'contra_asset', normal_balance: 'credit' },
    
    // Liabilities (2000s)
    { code: '2000', name: 'Accounts Payable', type: 'liability', normal_balance: 'credit' },
    { code: '2100', name: 'Client Deposits', type: 'liability', normal_balance: 'credit' },
    { code: '2200', name: 'Payroll Liabilities', type: 'liability', normal_balance: 'credit' },
    { code: '2300', name: 'Sales Tax Payable', type: 'liability', normal_balance: 'credit' },
    
    // Equity (3000s)
    { code: '3000', name: 'Owner\'s Equity', type: 'equity', normal_balance: 'credit' },
    { code: '3100', name: 'Retained Earnings', type: 'equity', normal_balance: 'credit' },
    
    // Revenue (4000s)
    { code: '4000', name: 'Design Services Revenue', type: 'income', normal_balance: 'credit' },
    { code: '4100', name: 'Consulting Revenue', type: 'income', normal_balance: 'credit' },
    { code: '4200', name: 'Retainer Revenue', type: 'income', normal_balance: 'credit' },
    { code: '4300', name: 'Project Revenue', type: 'income', normal_balance: 'credit' },
    
    // Expenses (5000s-6000s)
    { code: '5000', name: 'Contractor Costs', type: 'expense', normal_balance: 'debit' },
    { code: '5100', name: 'Software Subscriptions', type: 'expense', normal_balance: 'debit' },
    { code: '5200', name: 'Stock Photography', type: 'expense', normal_balance: 'debit' },
    { code: '6000', name: 'Salaries', type: 'expense', normal_balance: 'debit' },
    { code: '6100', name: 'Rent', type: 'expense', normal_balance: 'debit' },
    { code: '6200', name: 'Marketing', type: 'expense', normal_balance: 'debit' },
    { code: '6300', name: 'Office Expenses', type: 'expense', normal_balance: 'debit' }
  ]
}

/**
 * Generate realistic invoices for testing
 */
export async function generateInvoices(
  orgId: string,
  customerId: string,
  count: number = 5,
  startDate: Date = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
) {
  const invoices = []
  const currentDate = new Date()
  
  for (let i = 0; i < count; i++) {
    const issueDate = new Date(
      startDate.getTime() + 
      (currentDate.getTime() - startDate.getTime()) * (i / count)
    )
    
    const dueDate = new Date(issueDate)
    dueDate.setDate(dueDate.getDate() + 30) // Net 30
    
    const amount = Math.floor(Math.random() * 10000 + 1000) // $1,000 - $11,000
    const isPaid = dueDate < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Paid if due > 7 days ago
    
    invoices.push({
      organization_id: orgId,
      customer_id: customerId,
      invoice_number: `INV-${issueDate.getFullYear()}-${String(i + 1).padStart(4, '0')}`,
      issue_date: issueDate.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      currency_code: 'USD',
      subtotal: amount,
      tax_amount: amount * 0.08, // 8% tax
      total_amount: amount * 1.08,
      paid_amount: isPaid ? amount * 1.08 : 0,
      balance_due: isPaid ? 0 : amount * 1.08,
      status: isPaid ? 'paid' : dueDate < currentDate ? 'overdue' : 'sent',
      paid_at: isPaid ? new Date(dueDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString() : null,
      notes: `Monthly subscription and services for ${issueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    })
  }
  
  return invoices
}

/**
 * Generate realistic bills for testing
 */
export async function generateBills(
  orgId: string,
  vendorId: string,
  count: number = 5,
  startDate: Date = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
) {
  const bills = []
  const currentDate = new Date()
  
  for (let i = 0; i < count; i++) {
    const billDate = new Date(
      startDate.getTime() + 
      (currentDate.getTime() - startDate.getTime()) * (i / count)
    )
    
    const dueDate = new Date(billDate)
    dueDate.setDate(dueDate.getDate() + 30)
    
    const amount = Math.floor(Math.random() * 5000 + 500) // $500 - $5,500
    const isPaid = dueDate < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    bills.push({
      organization_id: orgId,
      vendor_id: vendorId,
      bill_number: `BILL-${billDate.getFullYear()}-${String(i + 1).padStart(4, '0')}`,
      vendor_invoice_number: `VI-${Math.floor(Math.random() * 100000)}`,
      bill_date: billDate.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      currency_code: 'USD',
      subtotal: amount,
      tax_amount: 0, // B2B no tax
      total_amount: amount,
      paid_amount: isPaid ? amount : 0,
      balance_due: isPaid ? 0 : amount,
      status: isPaid ? 'paid' : dueDate < currentDate ? 'overdue' : 'approved',
      paid_at: isPaid ? new Date(dueDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString() : null
    })
  }
  
  return bills
}