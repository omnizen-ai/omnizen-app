/**
 * Test: Tax Configuration
 * Tests setting up tax codes, rates, and rules
 */

import { supabaseAdmin } from '../utils/db-client'
import { createTestOrganization } from '../utils/auth-context'
import { runTestSuite, assertEqual, assertTrue, assertFalse } from '../utils/test-assertions'
import { cleanupBySlug } from '../utils/cleanup'

async function testBasicTaxCodes() {
  const { org } = await createTestOrganization(
    'Anchorblock Technology Limited',
    'anchorblock-tax',
    'cfo@anchorblock.ai',
    'professional'
  )
  
  // Create common tax codes for US
  const taxCodes = [
    {
      code: 'TAX-EXEMPT',
      name: 'Tax Exempt',
      rate: 0,
      is_exempt: true,
      description: 'No tax applied'
    },
    {
      code: 'CA-STATE',
      name: 'California State Tax',
      rate: 7.25,
      is_exempt: false,
      description: 'California state sales tax'
    },
    {
      code: 'SF-COMBINED',
      name: 'San Francisco Combined Tax',
      rate: 8.625,
      is_exempt: false,
      description: 'CA state + SF local tax'
    },
    {
      code: 'NY-STATE',
      name: 'New York State Tax',
      rate: 4.0,
      is_exempt: false,
      description: 'New York state sales tax'
    },
    {
      code: 'NYC-COMBINED',
      name: 'NYC Combined Tax',
      rate: 8.875,
      is_exempt: false,
      description: 'NY state + NYC local tax'
    }
  ]
  
  const createdCodes = []
  
  for (const tax of taxCodes) {
    const { data: taxCode, error } = await supabaseAdmin
      .from('tax_codes')
      .insert({
        organization_id: org.id,
        ...tax,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    assertTrue(!error, `Tax code ${tax.code} should be created`)
    assertEqual(taxCode.code, tax.code, `Code should be ${tax.code}`)
    assertEqual(taxCode.rate, tax.rate, `Rate should be ${tax.rate}`)
    
    createdCodes.push(taxCode)
  }
  
  // Verify tax exempt code
  const exemptCode = createdCodes.find(c => c.code === 'TAX-EXEMPT')
  assertTrue(exemptCode.is_exempt, 'Tax exempt code should be marked as exempt')
  assertEqual(exemptCode.rate, 0, 'Tax exempt rate should be 0')
  
  return { org, taxCodes: createdCodes }
}

async function testCompoundTaxRules() {
  const { org } = await createTestOrganization(
    'Compound Tax Org',
    'compound-tax',
    'admin@compound.ai',
    'professional'
  )
  
  // Create base tax codes
  const { data: stateTax } = await supabaseAdmin
    .from('tax_codes')
    .insert({
      organization_id: org.id,
      code: 'STATE-TAX',
      name: 'State Tax',
      rate: 6.0,
      is_active: true
    })
    .select()
    .single()
  
  const { data: countyTax } = await supabaseAdmin
    .from('tax_codes')
    .insert({
      organization_id: org.id,
      code: 'COUNTY-TAX',
      name: 'County Tax',
      rate: 1.0,
      is_active: true
    })
    .select()
    .single()
  
  const { data: cityTax } = await supabaseAdmin
    .from('tax_codes')
    .insert({
      organization_id: org.id,
      code: 'CITY-TAX',
      name: 'City Tax',
      rate: 0.5,
      is_active: true
    })
    .select()
    .single()
  
  // Create compound tax code (combines multiple taxes)
  const { data: compoundTax } = await supabaseAdmin
    .from('tax_codes')
    .insert({
      organization_id: org.id,
      code: 'COMBINED-TAX',
      name: 'Combined State/County/City Tax',
      rate: 7.5, // 6.0 + 1.0 + 0.5
      is_compound: true,
      component_tax_ids: [stateTax.id, countyTax.id, cityTax.id],
      is_active: true
    })
    .select()
    .single()
  
  assertEqual(compoundTax.rate, 7.5, 'Compound tax rate should be sum of components')
  assertTrue(compoundTax.is_compound, 'Should be marked as compound tax')
  assertEqual(compoundTax.component_tax_ids.length, 3, 'Should have 3 component taxes')
}

async function testTaxableProducts() {
  const { org } = await createTestOrganization(
    'Taxable Products Org',
    'taxable-products',
    'admin@taxable.ai',
    'growth'
  )
  
  // Create tax code
  const { data: taxCode } = await supabaseAdmin
    .from('tax_codes')
    .insert({
      organization_id: org.id,
      code: 'STANDARD-TAX',
      name: 'Standard Tax',
      rate: 8.0,
      is_active: true
    })
    .select()
    .single()
  
  // Create taxable product
  const { data: taxableProduct } = await supabaseAdmin
    .from('products')
    .insert({
      organization_id: org.id,
      name: 'Taxable Service',
      sku: 'TAX-001',
      is_taxable: true,
      tax_code_id: taxCode.id,
      sale_price: 100.00,
      is_service: true
    })
    .select()
    .single()
  
  // Create non-taxable product
  const { data: nonTaxableProduct } = await supabaseAdmin
    .from('products')
    .insert({
      organization_id: org.id,
      name: 'Non-Taxable Service',
      sku: 'NOTAX-001',
      is_taxable: false,
      tax_code_id: null,
      sale_price: 100.00,
      is_service: true
    })
    .select()
    .single()
  
  assertTrue(taxableProduct.is_taxable, 'Product should be taxable')
  assertEqual(taxableProduct.tax_code_id, taxCode.id, 'Product should have tax code')
  
  assertFalse(nonTaxableProduct.is_taxable, 'Product should not be taxable')
  assertTrue(!nonTaxableProduct.tax_code_id, 'Non-taxable product should not have tax code')
}

async function testTaxByLocation() {
  const { org } = await createTestOrganization(
    'Location Tax Org',
    'location-tax',
    'admin@location.ai',
    'professional'
  )
  
  // Create location-based tax rules
  const locationTaxes = [
    {
      state: 'CA',
      code: 'CA-TAX',
      name: 'California Tax',
      rate: 7.25
    },
    {
      state: 'TX',
      code: 'TX-TAX',
      name: 'Texas Tax',
      rate: 6.25
    },
    {
      state: 'NY',
      code: 'NY-TAX',
      name: 'New York Tax',
      rate: 4.0
    },
    {
      state: 'FL',
      code: 'FL-TAX',
      name: 'Florida Tax',
      rate: 6.0
    },
    {
      state: 'WA',
      code: 'WA-TAX',
      name: 'Washington Tax',
      rate: 6.5
    }
  ]
  
  for (const locTax of locationTaxes) {
    const { data: taxCode } = await supabaseAdmin
      .from('tax_codes')
      .insert({
        organization_id: org.id,
        code: locTax.code,
        name: locTax.name,
        rate: locTax.rate,
        applicable_states: [locTax.state],
        is_active: true
      })
      .select()
      .single()
    
    assertTrue(taxCode.applicable_states.includes(locTax.state), `Tax should apply to ${locTax.state}`)
  }
  
  // Create customer in California
  const { data: caCustomer } = await supabaseAdmin
    .from('contacts')
    .insert({
      organization_id: org.id,
      type: 'customer',
      company_name: 'CA Customer Inc',
      display_name: 'CA Customer Inc',
      state: 'CA',
      country: 'US'
    })
    .select()
    .single()
  
  // Get applicable tax for CA customer
  const { data: caTaxes } = await supabaseAdmin
    .from('tax_codes')
    .select()
    .eq('organization_id', org.id)
    .contains('applicable_states', ['CA'])
  
  assertTrue(caTaxes.length > 0, 'Should find CA tax codes')
  assertEqual(caTaxes[0].rate, 7.25, 'CA tax rate should be 7.25%')
}

async function testTaxExemptCustomers() {
  const { org } = await createTestOrganization(
    'Tax Exempt Org',
    'tax-exempt',
    'admin@exempt.ai',
    'growth'
  )
  
  // Create standard tax code
  const { data: standardTax } = await supabaseAdmin
    .from('tax_codes')
    .insert({
      organization_id: org.id,
      code: 'STANDARD',
      name: 'Standard Tax',
      rate: 8.5,
      is_active: true
    })
    .select()
    .single()
  
  // Create tax-exempt customer (e.g., non-profit)
  const { data: exemptCustomer } = await supabaseAdmin
    .from('contacts')
    .insert({
      organization_id: org.id,
      type: 'customer',
      company_name: 'Non-Profit Org',
      display_name: 'Non-Profit Org',
      is_tax_exempt: true,
      tax_exemption_number: 'EX-123456',
      tax_exemption_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
    })
    .select()
    .single()
  
  // Create regular customer
  const { data: regularCustomer } = await supabaseAdmin
    .from('contacts')
    .insert({
      organization_id: org.id,
      type: 'customer',
      company_name: 'Regular Corp',
      display_name: 'Regular Corp',
      is_tax_exempt: false
    })
    .select()
    .single()
  
  assertTrue(exemptCustomer.is_tax_exempt, 'Customer should be tax exempt')
  assertTrue(exemptCustomer.tax_exemption_number, 'Should have exemption number')
  
  assertFalse(regularCustomer.is_tax_exempt, 'Regular customer should not be tax exempt')
  
  // Verify exemption is still valid
  const expiryDate = new Date(exemptCustomer.tax_exemption_expiry)
  const now = new Date()
  assertTrue(expiryDate > now, 'Tax exemption should not be expired')
}

async function testInternationalTax() {
  const { org } = await createTestOrganization(
    'International Tax Org',
    'intl-tax',
    'admin@international.ai',
    'enterprise'
  )
  
  // Create VAT codes for different countries
  const vatCodes = [
    { country: 'GB', code: 'UK-VAT', name: 'UK VAT', rate: 20.0 },
    { country: 'DE', code: 'DE-VAT', name: 'German VAT', rate: 19.0 },
    { country: 'FR', code: 'FR-VAT', name: 'French VAT', rate: 20.0 },
    { country: 'CA', code: 'CA-GST', name: 'Canadian GST', rate: 5.0 },
    { country: 'AU', code: 'AU-GST', name: 'Australian GST', rate: 10.0 }
  ]
  
  for (const vat of vatCodes) {
    const { data: taxCode } = await supabaseAdmin
      .from('tax_codes')
      .insert({
        organization_id: org.id,
        code: vat.code,
        name: vat.name,
        rate: vat.rate,
        tax_type: 'VAT',
        applicable_countries: [vat.country],
        is_active: true
      })
      .select()
      .single()
    
    assertEqual(taxCode.tax_type, 'VAT', 'Should be VAT type')
    assertTrue(taxCode.applicable_countries.includes(vat.country), `Should apply to ${vat.country}`)
  }
  
  // Test reverse charge mechanism for EU B2B
  const { data: reverseCharge } = await supabaseAdmin
    .from('tax_codes')
    .insert({
      organization_id: org.id,
      code: 'EU-REVERSE',
      name: 'EU Reverse Charge',
      rate: 0,
      tax_type: 'REVERSE_CHARGE',
      description: 'VAT reverse charge for EU B2B transactions',
      is_active: true
    })
    .select()
    .single()
  
  assertEqual(reverseCharge.tax_type, 'REVERSE_CHARGE', 'Should be reverse charge type')
  assertEqual(reverseCharge.rate, 0, 'Reverse charge rate should be 0')
}

// Run tests
async function main() {
  console.log('🚀 Starting Tax Configuration Tests\n')
  
  // Clean up any existing test data
  const slugsToClean = [
    'anchorblock-tax',
    'compound-tax',
    'taxable-products',
    'location-tax',
    'tax-exempt',
    'intl-tax'
  ]
  
  for (const slug of slugsToClean) {
    await cleanupBySlug(slug)
  }
  
  const results = await runTestSuite('Tax Configuration', [
    { name: 'Basic tax codes setup', fn: testBasicTaxCodes },
    { name: 'Compound tax rules', fn: testCompoundTaxRules },
    { name: 'Taxable vs non-taxable products', fn: testTaxableProducts },
    { name: 'Location-based tax rules', fn: testTaxByLocation },
    { name: 'Tax-exempt customers', fn: testTaxExemptCustomers },
    { name: 'International VAT configuration', fn: testInternationalTax }
  ])
  
  // Cleanup
  for (const slug of slugsToClean) {
    await cleanupBySlug(slug)
  }
  
  process.exit(results.failed > 0 ? 1 : 0)
}

main().catch(console.error)