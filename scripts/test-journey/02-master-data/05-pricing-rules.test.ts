/**
 * Test: Pricing Rules and Discounts
 * Tests complex pricing rules, discounts, and promotions
 */

import { supabaseAdmin } from '../utils/db-client'
import { createTestOrganization } from '../utils/auth-context'
import { runTestSuite, assertEqual, assertTrue } from '../utils/test-assertions'
import { cleanupBySlug } from '../utils/cleanup'

async function testCustomerSpecificPricing() {
  const { org } = await createTestOrganization(
    'Anchorblock Technology Limited',
    'anchorblock-pricing',
    'sales@anchorblock.ai',
    'professional'
  )
  
  // Create product with base price
  const { data: product } = await supabaseAdmin
    .from('products')
    .insert({
      organization_id: org.id,
      name: 'Professional Plan',
      sku: 'PRO-PLAN',
      sale_price: 299, // Base price
      is_service: true
    })
    .select()
    .single()
  
  // Create customers with different pricing tiers
  const customers = [
    {
      name: 'Enterprise Customer',
      tier: 'enterprise',
      discount_percentage: 20,
      negotiated_price: 239.20
    },
    {
      name: 'Partner Company',
      tier: 'partner',
      discount_percentage: 30,
      negotiated_price: 209.30
    },
    {
      name: 'Standard Customer',
      tier: 'standard',
      discount_percentage: 0,
      negotiated_price: 299
    },
    {
      name: 'Non-Profit Org',
      tier: 'non_profit',
      discount_percentage: 50,
      negotiated_price: 149.50
    }
  ]
  
  for (const cust of customers) {
    const { data: customer } = await supabaseAdmin
      .from('contacts')
      .insert({
        organization_id: org.id,
        type: 'customer',
        company_name: cust.name,
        display_name: cust.name,
        custom_fields: {
          pricing_tier: cust.tier,
          discount_percentage: cust.discount_percentage,
          price_overrides: {
            [product.id]: {
              base_price: product.sale_price,
              discount_percentage: cust.discount_percentage,
              final_price: cust.negotiated_price
            }
          }
        }
      })
      .select()
      .single()
    
    // Calculate price for customer
    const finalPrice = product.sale_price * (1 - cust.discount_percentage / 100)
    assertEqual(
      Math.round(finalPrice * 100) / 100,
      cust.negotiated_price,
      `Price for ${cust.tier} should be $${cust.negotiated_price}`
    )
  }
}

async function testVolumePricing() {
  const { org } = await createTestOrganization(
    'Volume Pricing Test',
    'volume-pricing',
    'sales@volume.ai',
    'professional'
  )
  
  // Create product with volume discounts
  const { data: product } = await supabaseAdmin
    .from('products')
    .insert({
      organization_id: org.id,
      name: 'User Licenses',
      sku: 'USER-LIC',
      sale_price: 50, // Per user price
      unit_of_measure: 'user',
      custom_fields: {
        pricing_model: 'volume_discount',
        volume_breaks: [
          { min_quantity: 1, max_quantity: 10, price_per_unit: 50, discount: 0 },
          { min_quantity: 11, max_quantity: 50, price_per_unit: 45, discount: 10 },
          { min_quantity: 51, max_quantity: 100, price_per_unit: 40, discount: 20 },
          { min_quantity: 101, max_quantity: 500, price_per_unit: 35, discount: 30 },
          { min_quantity: 501, max_quantity: null, price_per_unit: 30, discount: 40 }
        ]
      }
    })
    .select()
    .single()
  
  // Test pricing for different quantities
  const testCases = [
    { quantity: 5, expected_unit_price: 50, total: 250 },
    { quantity: 25, expected_unit_price: 45, total: 1125 },
    { quantity: 75, expected_unit_price: 40, total: 3000 },
    { quantity: 200, expected_unit_price: 35, total: 7000 },
    { quantity: 1000, expected_unit_price: 30, total: 30000 }
  ]
  
  for (const test of testCases) {
    const volumeBreak = product.custom_fields.volume_breaks.find(
      b => test.quantity >= b.min_quantity && 
           (b.max_quantity === null || test.quantity <= b.max_quantity)
    )
    
    assertEqual(
      volumeBreak.price_per_unit,
      test.expected_unit_price,
      `Unit price for ${test.quantity} should be $${test.expected_unit_price}`
    )
    
    const total = test.quantity * volumeBreak.price_per_unit
    assertEqual(total, test.total, `Total for ${test.quantity} units should be $${test.total}`)
  }
}

async function testPromotionalPricing() {
  const { org } = await createTestOrganization(
    'Promotional Pricing Test',
    'promo-pricing',
    'marketing@promo.ai',
    'growth'
  )
  
  // Create products
  const { data: product } = await supabaseAdmin
    .from('products')
    .insert({
      organization_id: org.id,
      name: 'Premium Service',
      sku: 'PREM-SVC',
      sale_price: 999,
      is_service: true
    })
    .select()
    .single()
  
  // Create promotional campaigns
  const promotions = [
    {
      code: 'NEWYEAR2024',
      type: 'percentage',
      value: 25,
      valid_from: '2024-01-01',
      valid_to: '2024-01-31',
      usage_limit: 100,
      usage_count: 0,
      minimum_purchase: 500
    },
    {
      code: 'FLAT100',
      type: 'fixed_amount',
      value: 100,
      valid_from: '2024-01-01',
      valid_to: '2024-12-31',
      usage_limit: 50,
      usage_count: 0,
      minimum_purchase: 300
    },
    {
      code: 'FIRSTTIME',
      type: 'percentage',
      value: 15,
      valid_from: '2024-01-01',
      valid_to: '2024-12-31',
      usage_limit: 1,
      usage_count: 0,
      first_time_only: true
    },
    {
      code: 'BUNDLE50',
      type: 'percentage',
      value: 50,
      valid_from: '2024-01-01',
      valid_to: '2024-01-31',
      applicable_products: [product.id],
      minimum_quantity: 2
    }
  ]
  
  for (const promo of promotions) {
    await supabaseAdmin
      .from('promotional_codes')
      .insert({
        organization_id: org.id,
        ...promo,
        is_active: true
      })
  }
  
  // Test promotion calculations
  const basePrice = 999
  
  // Test percentage discount
  const percentageDiscount = basePrice * 0.25
  const priceAfterPercentage = basePrice - percentageDiscount
  assertEqual(priceAfterPercentage, 749.25, 'NEWYEAR2024 should give 25% off')
  
  // Test fixed amount discount
  const priceAfterFixed = basePrice - 100
  assertEqual(priceAfterFixed, 899, 'FLAT100 should deduct $100')
  
  // Test first-time customer discount
  const firstTimeDiscount = basePrice * 0.15
  const priceAfterFirstTime = basePrice - firstTimeDiscount
  assertEqual(priceAfterFirstTime, 849.15, 'FIRSTTIME should give 15% off')
}

async function testContractPricing() {
  const { org } = await createTestOrganization(
    'Contract Pricing Test',
    'contract-pricing',
    'sales@contract.ai',
    'enterprise'
  )
  
  // Create customer with contract
  const { data: customer } = await supabaseAdmin
    .from('contacts')
    .insert({
      organization_id: org.id,
      type: 'customer',
      company_name: 'Big Enterprise Corp',
      display_name: 'Big Enterprise Corp',
      custom_fields: {
        has_contract: true,
        contract_number: 'CNT-2024-001',
        contract_start: '2024-01-01',
        contract_end: '2024-12-31',
        contract_value: 120000,
        contract_terms: {
          payment_schedule: 'monthly',
          monthly_payment: 10000,
          included_services: ['Professional Plan', 'Support', 'Training'],
          overage_rates: {
            additional_users: 25,
            api_calls_per_1000: 0.05
          }
        }
      }
    })
    .select()
    .single()
  
  // Create contract pricing rules
  const contractProducts = [
    {
      name: 'Professional Plan - Contract',
      sku: 'PRO-CONTRACT',
      standard_price: 2999,
      contract_price: 0, // Included in contract
      included_quantity: 1
    },
    {
      name: 'Support Hours - Contract',
      sku: 'SUPPORT-CONTRACT',
      standard_price: 150,
      contract_price: 0, // 40 hours included
      included_quantity: 40
    },
    {
      name: 'Additional User - Contract',
      sku: 'USER-CONTRACT',
      standard_price: 50,
      contract_price: 25, // Discounted overage rate
      included_quantity: 100
    }
  ]
  
  for (const prod of contractProducts) {
    await supabaseAdmin
      .from('products')
      .insert({
        organization_id: org.id,
        name: prod.name,
        sku: prod.sku,
        sale_price: prod.standard_price,
        is_service: true,
        custom_fields: {
          contract_pricing: {
            customer_id: customer.id,
            contract_price: prod.contract_price,
            included_quantity: prod.included_quantity,
            applies_to_contract: 'CNT-2024-001'
          }
        }
      })
  }
  
  // Verify contract value
  assertEqual(
    customer.custom_fields.contract_value,
    120000,
    'Annual contract value should be $120,000'
  )
  
  assertEqual(
    customer.custom_fields.contract_terms.monthly_payment,
    10000,
    'Monthly payment should be $10,000'
  )
}

async function testBundlePricing() {
  const { org } = await createTestOrganization(
    'Bundle Pricing Test',
    'bundle-pricing',
    'sales@bundle.ai',
    'professional'
  )
  
  // Create individual products
  const products = []
  const individualItems = [
    { name: 'Product A', sku: 'PROD-A', price: 100 },
    { name: 'Product B', sku: 'PROD-B', price: 150 },
    { name: 'Product C', sku: 'PROD-C', price: 200 }
  ]
  
  for (const item of individualItems) {
    const { data: product } = await supabaseAdmin
      .from('products')
      .insert({
        organization_id: org.id,
        name: item.name,
        sku: item.sku,
        sale_price: item.price
      })
      .select()
      .single()
    
    products.push(product)
  }
  
  // Create bundles with different pricing strategies
  const bundles = [
    {
      name: 'Basic Bundle (A+B)',
      sku: 'BUNDLE-AB',
      items: [products[0], products[1]],
      pricing_strategy: 'fixed_discount',
      discount_amount: 30,
      bundle_price: 220 // 250 - 30
    },
    {
      name: 'Premium Bundle (A+B+C)',
      sku: 'BUNDLE-ABC',
      items: products,
      pricing_strategy: 'percentage_discount',
      discount_percentage: 20,
      bundle_price: 360 // 450 * 0.8
    },
    {
      name: 'BOGO Bundle',
      sku: 'BUNDLE-BOGO',
      items: [products[0], products[0]], // Buy one get one
      pricing_strategy: 'bogo',
      bundle_price: 100 // Price of one
    }
  ]
  
  for (const bundle of bundles) {
    const individualTotal = bundle.items.reduce((sum, item) => sum + item.sale_price, 0)
    
    const { data: bundleProduct } = await supabaseAdmin
      .from('products')
      .insert({
        organization_id: org.id,
        name: bundle.name,
        sku: bundle.sku,
        sale_price: bundle.bundle_price,
        is_bundle: true,
        custom_fields: {
          bundle_items: bundle.items.map(i => i.id),
          pricing_strategy: bundle.pricing_strategy,
          individual_total: individualTotal,
          bundle_savings: individualTotal - bundle.bundle_price,
          savings_percentage: ((individualTotal - bundle.bundle_price) / individualTotal * 100).toFixed(2)
        }
      })
      .select()
      .single()
    
    assertEqual(
      bundleProduct.sale_price,
      bundle.bundle_price,
      `${bundle.name} should be priced at $${bundle.bundle_price}`
    )
  }
}

async function testDynamicPricing() {
  const { org } = await createTestOrganization(
    'Dynamic Pricing Test',
    'dynamic-pricing',
    'sales@dynamic.ai',
    'enterprise'
  )
  
  // Create product with dynamic pricing rules
  const { data: product } = await supabaseAdmin
    .from('products')
    .insert({
      organization_id: org.id,
      name: 'Dynamic Service',
      sku: 'DYN-SVC',
      sale_price: 100, // Base price
      is_service: true,
      custom_fields: {
        pricing_model: 'dynamic',
        pricing_factors: {
          time_based: {
            peak_hours: { start: 9, end: 17, multiplier: 1.5 },
            off_peak: { multiplier: 0.8 },
            weekend: { multiplier: 0.9 }
          },
          demand_based: {
            high_demand_threshold: 80, // 80% capacity
            high_demand_multiplier: 1.3,
            low_demand_threshold: 30, // 30% capacity
            low_demand_multiplier: 0.7
          },
          seasonal: {
            Q4_multiplier: 1.2, // Holiday season
            Q1_multiplier: 0.9  // Slow season
          }
        }
      }
    })
    .select()
    .single()
  
  // Test different pricing scenarios
  const scenarios = [
    {
      description: 'Peak hours weekday',
      base: 100,
      multipliers: [1.5],
      expected: 150
    },
    {
      description: 'Off-peak weekend',
      base: 100,
      multipliers: [0.8, 0.9],
      expected: 72
    },
    {
      description: 'High demand Q4',
      base: 100,
      multipliers: [1.3, 1.2],
      expected: 156
    },
    {
      description: 'Low demand Q1',
      base: 100,
      multipliers: [0.7, 0.9],
      expected: 63
    }
  ]
  
  for (const scenario of scenarios) {
    const finalPrice = scenario.multipliers.reduce(
      (price, multiplier) => price * multiplier,
      scenario.base
    )
    
    assertEqual(
      finalPrice,
      scenario.expected,
      `${scenario.description} should result in $${scenario.expected}`
    )
  }
}

async function testCurrencyPricing() {
  const { org } = await createTestOrganization(
    'Multi-Currency Pricing',
    'currency-pricing',
    'sales@currency.ai',
    'enterprise'
  )
  
  // Create product with multi-currency pricing
  const { data: product } = await supabaseAdmin
    .from('products')
    .insert({
      organization_id: org.id,
      name: 'International Service',
      sku: 'INTL-SVC',
      sale_price: 100, // USD base price
      currency_code: 'USD',
      custom_fields: {
        multi_currency_pricing: {
          USD: 100,
          EUR: 85,    // Adjusted for market
          GBP: 75,    // Adjusted for market
          JPY: 11000, // Adjusted for market
          CAD: 130,   // Adjusted for market
          AUD: 150    // Adjusted for market
        },
        price_includes_tax: {
          USD: false,
          EUR: true,  // VAT included
          GBP: true,  // VAT included
          JPY: true,  // Consumption tax included
          CAD: false,
          AUD: true   // GST included
        }
      }
    })
    .select()
    .single()
  
  // Test currency conversions don't apply - use market pricing
  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']
  
  for (const currency of currencies) {
    const price = product.custom_fields.multi_currency_pricing[currency]
    const includesTax = product.custom_fields.price_includes_tax[currency]
    
    assertTrue(price > 0, `Should have price for ${currency}`)
    
    if (includesTax) {
      // For tax-inclusive prices, calculate net amount
      const taxRate = currency === 'EUR' ? 0.20 : 
                     currency === 'GBP' ? 0.20 :
                     currency === 'JPY' ? 0.10 :
                     currency === 'AUD' ? 0.10 : 0
      
      const netPrice = price / (1 + taxRate)
      assertTrue(netPrice < price, `Net price should be less than gross for ${currency}`)
    }
  }
}

async function testSubscriptionPricing() {
  const { org } = await createTestOrganization(
    'Subscription Pricing Test',
    'subscription-pricing',
    'sales@subscription.ai',
    'professional'
  )
  
  // Create subscription with different billing cycles
  const subscriptions = [
    {
      name: 'Monthly Plan',
      cycle: 'monthly',
      price: 99,
      annual_value: 1188
    },
    {
      name: 'Quarterly Plan',
      cycle: 'quarterly',
      price: 270, // 10% discount
      annual_value: 1080
    },
    {
      name: 'Annual Plan',
      cycle: 'annual',
      price: 990, // ~17% discount
      annual_value: 990
    }
  ]
  
  for (const sub of subscriptions) {
    const { data: product } = await supabaseAdmin
      .from('products')
      .insert({
        organization_id: org.id,
        name: sub.name,
        sku: `SUB-${sub.cycle.toUpperCase()}`,
        sale_price: sub.price,
        is_service: true,
        custom_fields: {
          billing_cycle: sub.cycle,
          annual_value: sub.annual_value,
          monthly_equivalent: sub.annual_value / 12,
          discount_vs_monthly: sub.cycle === 'monthly' ? 0 :
            ((1188 - sub.annual_value) / 1188 * 100).toFixed(2)
        }
      })
      .select()
      .single()
    
    assertEqual(
      product.custom_fields.annual_value,
      sub.annual_value,
      `${sub.name} annual value should be $${sub.annual_value}`
    )
  }
}

// Run tests
async function main() {
  console.log('🚀 Starting Pricing Rules Tests\n')
  
  // Clean up any existing test data
  const slugsToClean = [
    'anchorblock-pricing',
    'volume-pricing',
    'promo-pricing',
    'contract-pricing',
    'bundle-pricing',
    'dynamic-pricing',
    'currency-pricing',
    'subscription-pricing'
  ]
  
  for (const slug of slugsToClean) {
    await cleanupBySlug(slug)
  }
  
  const results = await runTestSuite('Pricing Rules and Discounts', [
    { name: 'Customer-specific pricing', fn: testCustomerSpecificPricing },
    { name: 'Volume-based pricing', fn: testVolumePricing },
    { name: 'Promotional pricing', fn: testPromotionalPricing },
    { name: 'Contract pricing', fn: testContractPricing },
    { name: 'Bundle pricing strategies', fn: testBundlePricing },
    { name: 'Dynamic pricing rules', fn: testDynamicPricing },
    { name: 'Multi-currency pricing', fn: testCurrencyPricing },
    { name: 'Subscription billing cycles', fn: testSubscriptionPricing }
  ])
  
  // Cleanup
  for (const slug of slugsToClean) {
    await cleanupBySlug(slug)
  }
  
  process.exit(results.failed > 0 ? 1 : 0)
}

main().catch(console.error)