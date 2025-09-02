/**
 * Test: Company Profile Setup
 * Tests updating organization settings, tax info, and business details
 */

import { supabaseAdmin } from '../utils/db-client'
import { runTestSuite, assertEqual, assertTrue } from '../utils/test-assertions'
import { cleanupBySlug } from '../utils/cleanup'

async function setupTestOrg() {
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .insert({
      name: 'Anchorblock Technology Limited',
      slug: 'anchorblock-profile',
      plan_tier: 'professional'
    })
    .select()
    .single()
  
  return org
}

async function testCompanyDetails() {
  const org = await setupTestOrg()
  
  // Update company details
  const { data: updated, error } = await supabaseAdmin
    .from('organizations')
    .update({
      // Business information
      name: 'Anchorblock Technology Limited',
      
      // Tax and legal
      country_code: 'US',
      
      // Financial settings
      currency: 'USD',
      fiscal_year_start: 1, // January
      
      // Timezone
      timezone: 'America/New_York',
      
      // Custom settings in feature_flags
      feature_flags: {
        ...org.feature_flags,
        multi_currency: true,
        advanced_reporting: true
      }
    })
    .eq('id', org.id)
    .select()
    .single()
  
  assertTrue(updated, 'Company details should be updated')
  assertEqual(updated.country_code, 'US', 'Country code should be US')
  assertEqual(updated.currency, 'USD', 'Currency should be USD')
  assertEqual(updated.fiscal_year_start, 1, 'Fiscal year should start in January')
  assertTrue(updated.feature_flags.multi_currency, 'Multi-currency should be enabled')
  
  return updated
}

async function testBillingInformation() {
  const org = await setupTestOrg()
  
  // Set up Stripe customer (in production, this would come from Stripe API)
  const { data: updated } = await supabaseAdmin
    .from('organizations')
    .update({
      stripe_customer_id: 'cus_test_anchorblock',
      stripe_subscription_id: 'sub_test_professional'
    })
    .eq('id', org.id)
    .select()
    .single()
  
  assertTrue(updated.stripe_customer_id, 'Stripe customer ID should be set')
  assertTrue(updated.stripe_subscription_id, 'Stripe subscription ID should be set')
  
  return updated
}

async function testTimezoneSettings() {
  const org = await setupTestOrg()
  
  const timezones = [
    'America/New_York',
    'America/Los_Angeles', 
    'Europe/London',
    'Asia/Tokyo',
    'Australia/Sydney'
  ]
  
  for (const tz of timezones) {
    const { data: updated } = await supabaseAdmin
      .from('organizations')
      .update({ timezone: tz })
      .eq('id', org.id)
      .select()
      .single()
    
    assertEqual(updated.timezone, tz, `Timezone should be ${tz}`)
  }
}

async function testFiscalYearSettings() {
  const org = await setupTestOrg()
  
  // Test different fiscal year starts
  const fiscalYears = [
    { month: 1, name: 'January' },
    { month: 4, name: 'April' },
    { month: 7, name: 'July' },
    { month: 10, name: 'October' }
  ]
  
  for (const fy of fiscalYears) {
    const { data: updated } = await supabaseAdmin
      .from('organizations')
      .update({ fiscal_year_start: fy.month })
      .eq('id', org.id)
      .select()
      .single()
    
    assertEqual(
      updated.fiscal_year_start, 
      fy.month, 
      `Fiscal year should start in ${fy.name}`
    )
  }
}

async function testMultiCurrencySetup() {
  const org = await setupTestOrg()
  
  // Enable multi-currency in feature flags
  const { data: updated } = await supabaseAdmin
    .from('organizations')
    .update({
      feature_flags: {
        ...org.feature_flags,
        multi_currency: true
      }
    })
    .eq('id', org.id)
    .select()
    .single()
  
  assertTrue(updated.feature_flags.multi_currency, 'Multi-currency should be enabled')
  
  // Create exchange rates table entries (if supported)
  const exchangeRates = [
    { from_currency: 'USD', to_currency: 'EUR', rate: 0.85 },
    { from_currency: 'USD', to_currency: 'GBP', rate: 0.73 },
    { from_currency: 'USD', to_currency: 'JPY', rate: 110.0 }
  ]
  
  for (const rate of exchangeRates) {
    const { data: exRate } = await supabaseAdmin
      .from('exchange_rates')
      .insert({
        organization_id: org.id,
        from_currency_code: rate.from_currency,
        to_currency_code: rate.to_currency,
        exchange_rate: rate.rate,
        effective_date: new Date().toISOString()
      })
      .select()
      .single()
    
    assertTrue(exRate, `Exchange rate ${rate.from_currency} to ${rate.to_currency} should be created`)
  }
}

async function testDataRetentionPolicy() {
  const org = await setupTestOrg()
  
  // Test different retention periods based on plan
  const retentionByPlan = {
    starter: 90,      // 3 months
    growth: 365,      // 1 year
    professional: 730, // 2 years
    enterprise: 2555  // 7 years
  }
  
  const { data: updated } = await supabaseAdmin
    .from('organizations')
    .update({
      data_retention_days: retentionByPlan[org.plan_tier]
    })
    .eq('id', org.id)
    .select()
    .single()
  
  assertEqual(
    updated.data_retention_days,
    retentionByPlan[org.plan_tier],
    `Data retention should be ${retentionByPlan[org.plan_tier]} days for ${org.plan_tier}`
  )
}

async function testCompanyLogo() {
  const org = await setupTestOrg()
  
  // In production, this would upload to storage
  // For testing, we'll just store a URL reference
  const logoUrl = 'https://storage.example.com/logos/anchorblock.png'
  
  const { data: updated } = await supabaseAdmin
    .from('organizations')
    .update({
      feature_flags: {
        ...org.feature_flags,
        logo_url: logoUrl
      }
    })
    .eq('id', org.id)
    .select()
    .single()
  
  assertEqual(updated.feature_flags.logo_url, logoUrl, 'Logo URL should be set')
}

async function testIndustrySpecificSettings() {
  const org = await setupTestOrg()
  
  // SaaS-specific settings
  const saasSettings = {
    industry: 'technology',
    business_model: 'subscription',
    revenue_recognition: 'monthly',
    default_payment_terms: 30,
    auto_invoice: true,
    recurring_billing: true
  }
  
  const { data: updated } = await supabaseAdmin
    .from('organizations')
    .update({
      feature_flags: {
        ...org.feature_flags,
        industry_settings: saasSettings
      }
    })
    .eq('id', org.id)
    .select()
    .single()
  
  assertTrue(updated.feature_flags.industry_settings, 'Industry settings should be saved')
  assertEqual(
    updated.feature_flags.industry_settings.industry,
    'technology',
    'Industry should be technology'
  )
  assertTrue(
    updated.feature_flags.industry_settings.recurring_billing,
    'Recurring billing should be enabled for SaaS'
  )
}

// Run tests
async function main() {
  console.log('🚀 Starting Company Profile Tests\n')
  
  // Clean up any existing test data
  await cleanupBySlug('anchorblock-profile')
  
  const results = await runTestSuite('Company Profile Setup', [
    { name: 'Update company details', fn: testCompanyDetails },
    { name: 'Set billing information', fn: testBillingInformation },
    { name: 'Configure timezone settings', fn: testTimezoneSettings },
    { name: 'Set fiscal year', fn: testFiscalYearSettings },
    { name: 'Enable multi-currency', fn: testMultiCurrencySetup },
    { name: 'Configure data retention', fn: testDataRetentionPolicy },
    { name: 'Upload company logo', fn: testCompanyLogo },
    { name: 'Industry-specific settings', fn: testIndustrySpecificSettings }
  ])
  
  // Cleanup
  await cleanupBySlug('anchorblock-profile')
  
  process.exit(results.failed > 0 ? 1 : 0)
}

main().catch(console.error)