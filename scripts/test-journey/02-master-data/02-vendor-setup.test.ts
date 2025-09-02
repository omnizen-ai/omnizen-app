/**
 * Test: Vendor Setup
 * Tests creating and managing vendor/supplier records
 */

import { supabaseAdmin } from '../utils/db-client'
import { createTestOrganization } from '../utils/auth-context'
import { generateVendors } from '../utils/data-generators'
import { runTestSuite, assertEqual, assertTrue } from '../utils/test-assertions'
import { cleanupBySlug } from '../utils/cleanup'

async function testCreateFirstVendor() {
  const { org } = await createTestOrganization(
    'Anchorblock Technology Limited',
    'anchorblock-vendors',
    'finance@anchorblock.ai',
    'professional'
  )
  
  // Create first vendor (AWS)
  const { data: vendor, error } = await supabaseAdmin
    .from('contacts')
    .insert({
      organization_id: org.id,
      type: 'vendor',
      
      // Company info
      company_name: 'Amazon Web Services, Inc.',
      display_name: 'AWS',
      external_code: 'VEND-AWS',
      
      // Contact info
      email: 'billing@aws.amazon.com',
      phone: '+1-206-266-1000',
      website: 'https://aws.amazon.com',
      
      // Address
      address_line1: '410 Terry Avenue North',
      city: 'Seattle',
      state: 'WA',
      postal_code: '98109',
      country: 'US',
      
      // Payment details
      currency_code: 'USD',
      payment_terms: 30,
      tax_id: '91-1956928',
      
      // Banking info for payments
      custom_fields: {
        vendor_category: 'Infrastructure',
        payment_method: 'ACH',
        account_number: '****1234',
        routing_number: '026009593',
        monthly_spend_avg: 8000,
        contract_start: '2024-01-01',
        contract_end: '2024-12-31',
        auto_pay_enabled: true,
        preferred_payment_day: 1 // 1st of month
      },
      
      // Account mapping
      default_expense_account_id: null, // Will be set after COA
      
      is_active: true,
      notes: 'Primary cloud infrastructure provider'
    })
    .select()
    .single()
  
  assertTrue(!error, 'Vendor should be created without error')
  assertEqual(vendor.company_name, 'Amazon Web Services, Inc.', 'Company name should match')
  assertEqual(vendor.type, 'vendor', 'Should be marked as vendor')
  assertTrue(vendor.custom_fields.auto_pay_enabled, 'Auto-pay should be enabled')
  
  return { org, vendor }
}

async function testVendorCategories() {
  const { org } = await createTestOrganization(
    'Vendor Categories Test',
    'vendor-categories',
    'admin@vendorcat.ai',
    'professional'
  )
  
  // Create vendors in different categories
  const vendorCategories = [
    {
      name: 'AWS',
      category: 'Infrastructure',
      critical: true,
      monthly_spend: 8000,
      payment_method: 'ACH'
    },
    {
      name: 'Google Workspace',
      category: 'Software',
      critical: true,
      monthly_spend: 500,
      payment_method: 'Credit Card'
    },
    {
      name: 'Office Supplies Co',
      category: 'Supplies',
      critical: false,
      monthly_spend: 200,
      payment_method: 'Check'
    },
    {
      name: 'Contractor LLC',
      category: 'Professional Services',
      critical: false,
      monthly_spend: 5000,
      payment_method: 'Wire Transfer'
    },
    {
      name: 'Insurance Corp',
      category: 'Insurance',
      critical: true,
      monthly_spend: 1500,
      payment_method: 'ACH'
    }
  ]
  
  const vendors = []
  
  for (const v of vendorCategories) {
    const { data: vendor } = await supabaseAdmin
      .from('contacts')
      .insert({
        organization_id: org.id,
        type: 'vendor',
        company_name: v.name,
        display_name: v.name,
        payment_terms: 30,
        custom_fields: {
          vendor_category: v.category,
          is_critical: v.critical,
          monthly_spend_avg: v.monthly_spend,
          payment_method: v.payment_method
        }
      })
      .select()
      .single()
    
    vendors.push(vendor)
  }
  
  // Verify critical vendors
  const criticalVendors = vendors.filter(v => v.custom_fields.is_critical)
  assertEqual(criticalVendors.length, 3, 'Should have 3 critical vendors')
  
  // Calculate total monthly spend
  const totalMonthlySpend = vendors.reduce(
    (sum, v) => sum + (v.custom_fields.monthly_spend_avg || 0),
    0
  )
  assertEqual(totalMonthlySpend, 15200, 'Total monthly vendor spend should be $15,200')
  
  // Group by category
  const infrastructureVendors = vendors.filter(
    v => v.custom_fields.vendor_category === 'Infrastructure'
  )
  assertEqual(infrastructureVendors.length, 1, 'Should have 1 infrastructure vendor')
}

async function testVendor1099Tracking() {
  const { org } = await createTestOrganization(
    '1099 Tracking Test',
    'vendor-1099',
    'admin@1099.ai',
    'professional'
  )
  
  // Create 1099 vendors (contractors)
  const contractors = [
    {
      name: 'John Doe Consulting',
      tax_id: '123-45-6789',
      is_1099: true,
      ytd_payments: 15000
    },
    {
      name: 'Jane Smith Services',
      tax_id: '987-65-4321',
      is_1099: true,
      ytd_payments: 8000
    },
    {
      name: 'Tech Freelancer LLC',
      tax_id: '11-1111111',
      is_1099: true,
      ytd_payments: 25000
    },
    {
      name: 'Regular Vendor Inc',
      tax_id: '22-2222222',
      is_1099: false,
      ytd_payments: 10000
    }
  ]
  
  for (const contractor of contractors) {
    const { data: vendor } = await supabaseAdmin
      .from('contacts')
      .insert({
        organization_id: org.id,
        type: 'vendor',
        company_name: contractor.name,
        display_name: contractor.name,
        tax_id: contractor.tax_id,
        custom_fields: {
          is_1099_vendor: contractor.is_1099,
          requires_1099: contractor.is_1099,
          ytd_payments: contractor.ytd_payments,
          w9_on_file: contractor.is_1099,
          w9_received_date: contractor.is_1099 ? '2024-01-15' : null,
          tin_verified: contractor.is_1099
        }
      })
      .select()
      .single()
    
    if (contractor.is_1099) {
      assertTrue(vendor.custom_fields.requires_1099, 'Should require 1099')
      assertTrue(vendor.custom_fields.w9_on_file, 'Should have W9 on file')
    }
  }
  
  // Query 1099 vendors over $600 threshold
  const { data: vendors1099 } = await supabaseAdmin
    .from('contacts')
    .select()
    .eq('organization_id', org.id)
    .eq('type', 'vendor')
    .contains('custom_fields', { is_1099_vendor: true })
  
  const requiring1099 = vendors1099.filter(
    v => v.custom_fields.ytd_payments >= 600
  )
  
  assertEqual(requiring1099.length, 3, 'Should have 3 vendors requiring 1099')
  
  // Calculate total 1099 payments
  const total1099Payments = vendors1099.reduce(
    (sum, v) => sum + (v.custom_fields.ytd_payments || 0),
    0
  )
  assertEqual(total1099Payments, 48000, 'Total 1099 payments should be $48,000')
}

async function testPreferredVendors() {
  const { org } = await createTestOrganization(
    'Preferred Vendors Test',
    'preferred-vendors',
    'admin@preferred.ai',
    'growth'
  )
  
  // Create products first
  const products = [
    { name: 'Office Supplies', category: 'Supplies' },
    { name: 'Computer Equipment', category: 'Hardware' },
    { name: 'Software Licenses', category: 'Software' }
  ]
  
  const productIds = {}
  for (const prod of products) {
    const { data: product } = await supabaseAdmin
      .from('products')
      .insert({
        organization_id: org.id,
        name: prod.name,
        sku: prod.name.replace(/\s+/g, '-').toUpperCase(),
        category: prod.category,
        is_service: false
      })
      .select()
      .single()
    
    productIds[prod.category] = product.id
  }
  
  // Create preferred vendors for each category
  const preferredVendors = [
    {
      name: 'Staples',
      category: 'Supplies',
      is_preferred: true,
      discount_rate: 10
    },
    {
      name: 'Office Depot',
      category: 'Supplies',
      is_preferred: false,
      discount_rate: 5
    },
    {
      name: 'CDW',
      category: 'Hardware',
      is_preferred: true,
      discount_rate: 15
    },
    {
      name: 'Microsoft',
      category: 'Software',
      is_preferred: true,
      discount_rate: 20
    }
  ]
  
  for (const v of preferredVendors) {
    const { data: vendor } = await supabaseAdmin
      .from('contacts')
      .insert({
        organization_id: org.id,
        type: 'vendor',
        company_name: v.name,
        display_name: v.name,
        custom_fields: {
          vendor_category: v.category,
          is_preferred: v.is_preferred,
          discount_rate: v.discount_rate,
          preferred_for_products: [productIds[v.category]]
        }
      })
      .select()
      .single()
    
    if (v.is_preferred) {
      // Update product with preferred vendor
      await supabaseAdmin
        .from('products')
        .update({ preferred_vendor_id: vendor.id })
        .eq('id', productIds[v.category])
    }
  }
  
  // Verify preferred vendors
  const { data: preferred } = await supabaseAdmin
    .from('contacts')
    .select()
    .eq('organization_id', org.id)
    .contains('custom_fields', { is_preferred: true })
  
  assertEqual(preferred.length, 3, 'Should have 3 preferred vendors')
}

async function testVendorPaymentTerms() {
  const { org } = await createTestOrganization(
    'Payment Terms Test',
    'payment-terms',
    'admin@terms.ai',
    'professional'
  )
  
  // Create vendors with different payment terms
  const paymentTerms = [
    { name: 'Net 30 Vendor', terms: 30, early_discount: null },
    { name: 'Net 60 Vendor', terms: 60, early_discount: null },
    { name: '2/10 Net 30', terms: 30, early_discount: { rate: 2, days: 10 } },
    { name: 'Due on Receipt', terms: 0, early_discount: null },
    { name: 'Net 45', terms: 45, early_discount: null }
  ]
  
  for (const term of paymentTerms) {
    const { data: vendor } = await supabaseAdmin
      .from('contacts')
      .insert({
        organization_id: org.id,
        type: 'vendor',
        company_name: term.name,
        display_name: term.name,
        payment_terms: term.terms,
        custom_fields: {
          early_payment_discount: term.early_discount,
          payment_terms_description: term.name
        }
      })
      .select()
      .single()
    
    assertEqual(vendor.payment_terms, term.terms, `Terms should be ${term.terms} days`)
    
    if (term.early_discount) {
      assertTrue(
        vendor.custom_fields.early_payment_discount,
        'Should have early payment discount'
      )
      assertEqual(
        vendor.custom_fields.early_payment_discount.rate,
        2,
        'Should have 2% discount'
      )
    }
  }
}

async function testVendorCompliance() {
  const { org } = await createTestOrganization(
    'Vendor Compliance Test',
    'vendor-compliance',
    'admin@compliance.ai',
    'enterprise'
  )
  
  // Create vendors with compliance tracking
  const vendors = [
    {
      name: 'Compliant Vendor',
      compliant: true,
      documents: ['W9', 'Insurance', 'Contract', 'NDA']
    },
    {
      name: 'Partial Compliance',
      compliant: false,
      documents: ['W9', 'Contract']
    },
    {
      name: 'Non-Compliant',
      compliant: false,
      documents: []
    }
  ]
  
  for (const v of vendors) {
    const { data: vendor } = await supabaseAdmin
      .from('contacts')
      .insert({
        organization_id: org.id,
        type: 'vendor',
        company_name: v.name,
        display_name: v.name,
        custom_fields: {
          compliance_status: v.compliant ? 'compliant' : 'non_compliant',
          required_documents: ['W9', 'Insurance', 'Contract', 'NDA'],
          received_documents: v.documents,
          insurance_expiry: v.documents.includes('Insurance') 
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            : null,
          contract_expiry: v.documents.includes('Contract')
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            : null,
          last_compliance_review: new Date().toISOString()
        }
      })
      .select()
      .single()
    
    const missingDocs = 4 - v.documents.length
    if (missingDocs > 0) {
      assertTrue(
        vendor.custom_fields.compliance_status === 'non_compliant',
        'Should be non-compliant if missing documents'
      )
    }
  }
  
  // Query non-compliant vendors
  const { data: nonCompliant } = await supabaseAdmin
    .from('contacts')
    .select()
    .eq('organization_id', org.id)
    .contains('custom_fields', { compliance_status: 'non_compliant' })
  
  assertEqual(nonCompliant.length, 2, 'Should have 2 non-compliant vendors')
}

async function testVendorPerformanceTracking() {
  const { org } = await createTestOrganization(
    'Performance Tracking Test',
    'vendor-performance',
    'admin@performance.ai',
    'professional'
  )
  
  // Create vendors with performance metrics
  const vendors = [
    {
      name: 'Excellent Vendor',
      metrics: {
        on_time_delivery_rate: 98,
        quality_score: 95,
        response_time_hours: 2,
        issue_count: 1,
        total_orders: 100
      }
    },
    {
      name: 'Good Vendor',
      metrics: {
        on_time_delivery_rate: 85,
        quality_score: 80,
        response_time_hours: 8,
        issue_count: 5,
        total_orders: 80
      }
    },
    {
      name: 'Poor Vendor',
      metrics: {
        on_time_delivery_rate: 60,
        quality_score: 65,
        response_time_hours: 24,
        issue_count: 15,
        total_orders: 50
      }
    }
  ]
  
  for (const v of vendors) {
    const { data: vendor } = await supabaseAdmin
      .from('contacts')
      .insert({
        organization_id: org.id,
        type: 'vendor',
        company_name: v.name,
        display_name: v.name,
        custom_fields: {
          performance_metrics: v.metrics,
          performance_rating: 
            v.metrics.on_time_delivery_rate >= 90 ? 'excellent' :
            v.metrics.on_time_delivery_rate >= 80 ? 'good' :
            v.metrics.on_time_delivery_rate >= 70 ? 'acceptable' : 'poor',
          last_performance_review: new Date().toISOString()
        }
      })
      .select()
      .single()
    
    // Verify performance categorization
    if (v.metrics.on_time_delivery_rate >= 90) {
      assertEqual(
        vendor.custom_fields.performance_rating,
        'excellent',
        'Should be rated excellent'
      )
    }
  }
  
  // Query high-performing vendors
  const { data: topVendors } = await supabaseAdmin
    .from('contacts')
    .select()
    .eq('organization_id', org.id)
    .eq('type', 'vendor')
    .or('custom_fields->performance_rating.eq.excellent,custom_fields->performance_rating.eq.good')
  
  assertTrue(topVendors.length >= 2, 'Should have at least 2 high-performing vendors')
}

// Run tests
async function main() {
  console.log('🚀 Starting Vendor Setup Tests\n')
  
  // Clean up any existing test data
  const slugsToClean = [
    'anchorblock-vendors',
    'vendor-categories',
    'vendor-1099',
    'preferred-vendors',
    'payment-terms',
    'vendor-compliance',
    'vendor-performance'
  ]
  
  for (const slug of slugsToClean) {
    await cleanupBySlug(slug)
  }
  
  const results = await runTestSuite('Vendor Setup', [
    { name: 'Create first vendor', fn: testCreateFirstVendor },
    { name: 'Vendor categories', fn: testVendorCategories },
    { name: '1099 vendor tracking', fn: testVendor1099Tracking },
    { name: 'Preferred vendor setup', fn: testPreferredVendors },
    { name: 'Vendor payment terms', fn: testVendorPaymentTerms },
    { name: 'Vendor compliance tracking', fn: testVendorCompliance },
    { name: 'Vendor performance metrics', fn: testVendorPerformanceTracking }
  ])
  
  // Cleanup
  for (const slug of slugsToClean) {
    await cleanupBySlug(slug)
  }
  
  process.exit(results.failed > 0 ? 1 : 0)
}

main().catch(console.error)