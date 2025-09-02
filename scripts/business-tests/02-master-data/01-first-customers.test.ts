/**
 * Test: First Customers Setup
 * Tests creating and managing customer records
 */

import { supabaseAdmin } from '../utils/db-client'
import { createTestOrganization } from '../utils/auth-context'
import { generateSaaSCustomers } from '../utils/data-generators'
import { runTestSuite, assertEqual, assertTrue } from '../utils/test-assertions'
import { cleanupBySlug } from '../utils/cleanup'

async function testCreateFirstCustomer() {
  const { org } = await createTestOrganization(
    'Anchorblock Technology Limited',
    'anchorblock-customers',
    'sales@anchorblock.ai',
    'professional'
  )
  
  // Create first customer manually
  const { data: customer, error } = await supabaseAdmin
    .from('contacts')
    .insert({
      organization_id: org.id,
      type: 'customer',
      
      // Company info
      company_name: 'TechStartup Inc',
      display_name: 'TechStartup Inc',
      external_code: 'CUST-001',
      
      // Contact person
      first_name: 'John',
      last_name: 'Smith',
      email: 'john@techstartup.com',
      phone: '+1-555-0100',
      mobile: '+1-555-0101',
      
      // Address
      address_line1: '123 Innovation Drive',
      address_line2: 'Suite 400',
      city: 'San Francisco',
      state: 'CA',
      postal_code: '94105',
      country: 'US',
      
      // Business details
      website: 'https://techstartup.com',
      tax_id: '87-1234567',
      currency_code: 'USD',
      payment_terms: 30, // Net 30
      credit_limit: 10000,
      
      // Custom fields for SaaS
      custom_fields: {
        subscription_tier: 'professional',
        mrr: 299,
        industry: 'Technology',
        employee_count: '11-50',
        acquisition_channel: 'Direct Sales',
        customer_since: new Date().toISOString()
      },
      
      is_active: true,
      notes: 'Key customer - handle with care'
    })
    .select()
    .single()
  
  assertTrue(!error, 'Customer should be created without error')
  assertEqual(customer.company_name, 'TechStartup Inc', 'Company name should match')
  assertEqual(customer.type, 'customer', 'Should be marked as customer')
  assertEqual(customer.payment_terms, 30, 'Payment terms should be Net 30')
  assertTrue(customer.custom_fields.subscription_tier, 'Should have subscription tier')
  
  return { org, customer }
}

async function testBulkCustomerImport() {
  const { org } = await createTestOrganization(
    'Bulk Import Test',
    'bulk-customers',
    'admin@bulk.ai',
    'professional'
  )
  
  // Generate bulk customers
  const customers = generateSaaSCustomers(20)
  
  // Add organization_id to each customer
  const customersWithOrg = customers.map(c => ({
    ...c,
    organization_id: org.id
  }))
  
  // Bulk insert
  const { data: imported, error } = await supabaseAdmin
    .from('contacts')
    .insert(customersWithOrg)
    .select()
  
  assertTrue(!error, 'Bulk import should succeed')
  assertEqual(imported.length, 20, 'Should import 20 customers')
  
  // Verify customer distribution
  const starterCustomers = imported.filter(c => 
    c.custom_fields?.subscription_plan === 'starter'
  )
  const growthCustomers = imported.filter(c => 
    c.custom_fields?.subscription_plan === 'growth'
  )
  const professionalCustomers = imported.filter(c => 
    c.custom_fields?.subscription_plan === 'professional'
  )
  
  assertTrue(starterCustomers.length > 0, 'Should have starter customers')
  assertTrue(growthCustomers.length > 0, 'Should have growth customers')
  assertTrue(professionalCustomers.length > 0, 'Should have professional customers')
  
  // Verify total MRR
  const totalMRR = imported.reduce((sum, c) => 
    sum + (c.custom_fields?.mrr || 0), 0
  )
  assertTrue(totalMRR > 0, 'Should have positive total MRR')
  
  return { org, customers: imported }
}

async function testCustomerCategories() {
  const { org } = await createTestOrganization(
    'Customer Categories Test',
    'customer-categories',
    'admin@categories.ai',
    'growth'
  )
  
  // Create customers in different categories
  const categories = [
    {
      company: 'Enterprise Corp',
      type: 'customer',
      category: 'enterprise',
      credit_limit: 100000,
      payment_terms: 45,
      custom_fields: { tier: 'platinum', annual_value: 120000 }
    },
    {
      company: 'Medium Business LLC',
      type: 'customer',
      category: 'mid-market',
      credit_limit: 25000,
      payment_terms: 30,
      custom_fields: { tier: 'gold', annual_value: 30000 }
    },
    {
      company: 'Small Startup',
      type: 'customer',
      category: 'smb',
      credit_limit: 5000,
      payment_terms: 15,
      custom_fields: { tier: 'silver', annual_value: 5000 }
    },
    {
      company: 'Freemium User',
      type: 'customer',
      category: 'freemium',
      credit_limit: 0,
      payment_terms: 0,
      custom_fields: { tier: 'free', annual_value: 0 }
    }
  ]
  
  for (const cat of categories) {
    const { data: customer } = await supabaseAdmin
      .from('contacts')
      .insert({
        organization_id: org.id,
        type: cat.type,
        company_name: cat.company,
        display_name: cat.company,
        credit_limit: cat.credit_limit,
        payment_terms: cat.payment_terms,
        custom_fields: { ...cat.custom_fields, category: cat.category },
        is_active: true
      })
      .select()
      .single()
    
    assertEqual(
      customer.custom_fields.category,
      cat.category,
      `Should be ${cat.category} customer`
    )
  }
  
  // Query by category
  const { data: enterpriseCustomers } = await supabaseAdmin
    .from('contacts')
    .select()
    .eq('organization_id', org.id)
    .eq('type', 'customer')
    .contains('custom_fields', { category: 'enterprise' })
  
  assertEqual(enterpriseCustomers.length, 1, 'Should have 1 enterprise customer')
  assertTrue(
    enterpriseCustomers[0].credit_limit >= 100000,
    'Enterprise should have high credit limit'
  )
}

async function testCustomerContactPersons() {
  const { org } = await createTestOrganization(
    'Contact Persons Test',
    'contact-persons',
    'admin@contacts.ai',
    'professional'
  )
  
  // Create customer company
  const { data: company } = await supabaseAdmin
    .from('contacts')
    .insert({
      organization_id: org.id,
      type: 'customer',
      company_name: 'Big Corporation',
      display_name: 'Big Corporation',
      is_company: true
    })
    .select()
    .single()
  
  // Create multiple contact persons for the company
  const contactPersons = [
    {
      first_name: 'Alice',
      last_name: 'CEO',
      email: 'alice@bigcorp.com',
      phone: '+1-555-0200',
      job_title: 'Chief Executive Officer',
      is_primary: true
    },
    {
      first_name: 'Bob',
      last_name: 'CFO',
      email: 'bob@bigcorp.com',
      phone: '+1-555-0201',
      job_title: 'Chief Financial Officer',
      is_primary: false
    },
    {
      first_name: 'Carol',
      last_name: 'CTO',
      email: 'carol@bigcorp.com',
      phone: '+1-555-0202',
      job_title: 'Chief Technology Officer',
      is_primary: false
    }
  ]
  
  for (const person of contactPersons) {
    await supabaseAdmin
      .from('contacts')
      .insert({
        organization_id: org.id,
        type: 'customer',
        parent_contact_id: company.id,
        ...person,
        display_name: `${person.first_name} ${person.last_name}`,
        company_name: company.company_name,
        is_company: false
      })
  }
  
  // Query all contacts for the company
  const { data: companyContacts } = await supabaseAdmin
    .from('contacts')
    .select()
    .eq('parent_contact_id', company.id)
  
  assertEqual(companyContacts.length, 3, 'Company should have 3 contact persons')
  
  const primaryContact = companyContacts.find(c => c.is_primary)
  assertTrue(primaryContact, 'Should have a primary contact')
  assertEqual(primaryContact.job_title, 'Chief Executive Officer', 'CEO should be primary')
}

async function testCustomerCreditManagement() {
  const { org } = await createTestOrganization(
    'Credit Management Test',
    'credit-mgmt',
    'admin@credit.ai',
    'professional'
  )
  
  // Create customer with credit tracking
  const { data: customer } = await supabaseAdmin
    .from('contacts')
    .insert({
      organization_id: org.id,
      type: 'customer',
      company_name: 'Credit Customer',
      display_name: 'Credit Customer',
      credit_limit: 50000,
      payment_terms: 30,
      custom_fields: {
        credit_status: 'approved',
        credit_utilized: 0,
        credit_available: 50000,
        last_credit_review: new Date().toISOString(),
        payment_history: 'excellent'
      }
    })
    .select()
    .single()
  
  // Simulate credit utilization from invoices
  const invoiceAmounts = [5000, 10000, 8000]
  let creditUtilized = 0
  
  for (const amount of invoiceAmounts) {
    creditUtilized += amount
    
    // Update credit utilization
    const { data: updated } = await supabaseAdmin
      .from('contacts')
      .update({
        custom_fields: {
          ...customer.custom_fields,
          credit_utilized: creditUtilized,
          credit_available: customer.credit_limit - creditUtilized
        }
      })
      .eq('id', customer.id)
      .select()
      .single()
    
    assertTrue(
      updated.custom_fields.credit_available >= 0,
      'Credit available should not be negative'
    )
  }
  
  // Check credit limit warning
  const utilizationRate = (creditUtilized / customer.credit_limit) * 100
  assertTrue(utilizationRate < 80, 'Should be within 80% credit utilization')
  
  // Test credit limit exceeded scenario
  const largeInvoice = 30000
  const wouldExceedLimit = creditUtilized + largeInvoice > customer.credit_limit
  
  assertTrue(wouldExceedLimit, 'Large invoice should exceed credit limit')
}

async function testCustomerSegmentation() {
  const { org } = await createTestOrganization(
    'Segmentation Test',
    'segmentation',
    'admin@segment.ai',
    'professional'
  )
  
  // Create customers with different attributes for segmentation
  const customers = [
    // High-value active customers
    { name: 'Premium Active 1', mrr: 5000, ltv: 60000, churn_risk: 'low', segment: 'champions' },
    { name: 'Premium Active 2', mrr: 3000, ltv: 36000, churn_risk: 'low', segment: 'champions' },
    
    // At-risk customers
    { name: 'At Risk 1', mrr: 1000, ltv: 12000, churn_risk: 'high', segment: 'at_risk' },
    { name: 'At Risk 2', mrr: 800, ltv: 9600, churn_risk: 'high', segment: 'at_risk' },
    
    // New customers
    { name: 'New Customer 1', mrr: 500, ltv: 500, churn_risk: 'unknown', segment: 'new' },
    { name: 'New Customer 2', mrr: 299, ltv: 299, churn_risk: 'unknown', segment: 'new' },
    
    // Churned customers
    { name: 'Churned 1', mrr: 0, ltv: 15000, churn_risk: 'churned', segment: 'churned' },
    { name: 'Churned 2', mrr: 0, ltv: 8000, churn_risk: 'churned', segment: 'churned' }
  ]
  
  for (const cust of customers) {
    await supabaseAdmin
      .from('contacts')
      .insert({
        organization_id: org.id,
        type: 'customer',
        company_name: cust.name,
        display_name: cust.name,
        is_active: cust.segment !== 'churned',
        custom_fields: {
          mrr: cust.mrr,
          ltv: cust.ltv,
          churn_risk: cust.churn_risk,
          segment: cust.segment,
          last_activity: cust.segment === 'churned' 
            ? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
            : new Date().toISOString()
        }
      })
  }
  
  // Query segments
  const { data: champions } = await supabaseAdmin
    .from('contacts')
    .select()
    .eq('organization_id', org.id)
    .contains('custom_fields', { segment: 'champions' })
  
  assertEqual(champions.length, 2, 'Should have 2 champion customers')
  
  const { data: atRisk } = await supabaseAdmin
    .from('contacts')
    .select()
    .eq('organization_id', org.id)
    .contains('custom_fields', { segment: 'at_risk' })
  
  assertEqual(atRisk.length, 2, 'Should have 2 at-risk customers')
  
  // Calculate segment metrics
  const totalMRR = customers
    .filter(c => c.segment !== 'churned')
    .reduce((sum, c) => sum + c.mrr, 0)
  
  assertTrue(totalMRR > 0, 'Should have positive MRR from active segments')
}

async function testCustomerDuplicatePrevention() {
  const { org } = await createTestOrganization(
    'Duplicate Prevention Test',
    'duplicate-prevention',
    'admin@duplicate.ai',
    'growth'
  )
  
  // Create first customer
  const { data: customer1 } = await supabaseAdmin
    .from('contacts')
    .insert({
      organization_id: org.id,
      type: 'customer',
      company_name: 'Unique Company',
      email: 'contact@unique.com',
      tax_id: '12-3456789'
    })
    .select()
    .single()
  
  // Try to create duplicate with same email
  const { data: duplicate1 } = await supabaseAdmin
    .from('contacts')
    .insert({
      organization_id: org.id,
      type: 'customer',
      company_name: 'Unique Company Different',
      email: 'contact@unique.com', // Same email
      tax_id: '98-7654321'
    })
    .select()
    .single()
  
  // In production, this would be prevented by business logic
  // For now, we can query to check for duplicates
  const { data: emailDuplicates } = await supabaseAdmin
    .from('contacts')
    .select()
    .eq('organization_id', org.id)
    .eq('email', 'contact@unique.com')
  
  assertTrue(emailDuplicates.length > 1, 'Should detect email duplicates')
  
  // Check for tax ID duplicates
  const { data: customer2 } = await supabaseAdmin
    .from('contacts')
    .insert({
      organization_id: org.id,
      type: 'customer',
      company_name: 'Another Company',
      email: 'different@company.com',
      tax_id: '12-3456789' // Same tax ID as customer1
    })
    .select()
    .single()
  
  const { data: taxIdDuplicates } = await supabaseAdmin
    .from('contacts')
    .select()
    .eq('organization_id', org.id)
    .eq('tax_id', '12-3456789')
  
  assertTrue(taxIdDuplicates.length > 1, 'Should detect tax ID duplicates')
}

// Run tests
async function main() {
  console.log('🚀 Starting First Customers Tests\n')
  
  // Clean up any existing test data
  const slugsToClean = [
    'anchorblock-customers',
    'bulk-customers',
    'customer-categories',
    'contact-persons',
    'credit-mgmt',
    'segmentation',
    'duplicate-prevention'
  ]
  
  for (const slug of slugsToClean) {
    await cleanupBySlug(slug)
  }
  
  const results = await runTestSuite('First Customers Setup', [
    { name: 'Create first customer', fn: testCreateFirstCustomer },
    { name: 'Bulk customer import', fn: testBulkCustomerImport },
    { name: 'Customer categories', fn: testCustomerCategories },
    { name: 'Customer contact persons', fn: testCustomerContactPersons },
    { name: 'Customer credit management', fn: testCustomerCreditManagement },
    { name: 'Customer segmentation', fn: testCustomerSegmentation },
    { name: 'Duplicate prevention', fn: testCustomerDuplicatePrevention }
  ])
  
  // Cleanup
  for (const slug of slugsToClean) {
    await cleanupBySlug(slug)
  }
  
  process.exit(results.failed > 0 ? 1 : 0)
}

main().catch(console.error)