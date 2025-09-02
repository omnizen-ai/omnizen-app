/**
 * Test: Products and Services Catalog
 * Tests creating and managing product/service catalog
 */

import { supabaseAdmin } from '../utils/db-client'
import { createTestOrganization } from '../utils/auth-context'
import { runTestSuite, assertEqual, assertTrue, assertFalse } from '../utils/test-assertions'
import { cleanupBySlug } from '../utils/cleanup'

async function testSaaSProductCatalog() {
  const { org } = await createTestOrganization(
    'Anchorblock Technology Limited',
    'anchorblock-products',
    'product@anchorblock.ai',
    'professional'
  )
  
  // Create SaaS subscription products
  const subscriptions = [
    {
      name: 'Starter Plan - Monthly',
      sku: 'STARTER-M',
      category: 'Subscription',
      sale_price: 29,
      is_service: true,
      is_recurring: true,
      billing_cycle: 'monthly',
      features: ['5 users', '10GB storage', 'Basic support']
    },
    {
      name: 'Growth Plan - Monthly',
      sku: 'GROWTH-M',
      category: 'Subscription',
      sale_price: 99,
      is_service: true,
      is_recurring: true,
      billing_cycle: 'monthly',
      features: ['25 users', '100GB storage', 'Priority support', 'API access']
    },
    {
      name: 'Professional Plan - Monthly',
      sku: 'PRO-M',
      category: 'Subscription',
      sale_price: 299,
      is_service: true,
      is_recurring: true,
      billing_cycle: 'monthly',
      features: ['Unlimited users', '1TB storage', '24/7 support', 'API access', 'Custom integrations']
    },
    {
      name: 'Enterprise Plan - Annual',
      sku: 'ENT-A',
      category: 'Subscription',
      sale_price: 12000,
      is_service: true,
      is_recurring: true,
      billing_cycle: 'annual',
      features: ['Everything in Pro', 'Dedicated support', 'SLA', 'White-label', 'On-premise option']
    }
  ]
  
  const createdProducts = []
  
  for (const sub of subscriptions) {
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert({
        organization_id: org.id,
        name: sub.name,
        sku: sub.sku,
        category: sub.category,
        sale_price: sub.sale_price,
        currency_code: 'USD',
        is_service: sub.is_service,
        is_active: true,
        is_taxable: true,
        custom_fields: {
          is_recurring: sub.is_recurring,
          billing_cycle: sub.billing_cycle,
          features: sub.features,
          mrr_value: sub.billing_cycle === 'monthly' ? sub.sale_price : sub.sale_price / 12
        }
      })
      .select()
      .single()
    
    assertTrue(!error, `Product ${sub.name} should be created`)
    assertEqual(product.sku, sub.sku, 'SKU should match')
    assertTrue(product.is_service, 'Should be marked as service')
    createdProducts.push(product)
  }
  
  // Add usage-based products
  const usageProducts = [
    {
      name: 'API Calls - Per 1000',
      sku: 'API-1K',
      category: 'Usage',
      unit_price: 0.10,
      unit_of_measure: '1000 calls'
    },
    {
      name: 'Storage Overage - Per GB',
      sku: 'STORAGE-GB',
      category: 'Usage',
      unit_price: 0.05,
      unit_of_measure: 'GB/month'
    },
    {
      name: 'Additional User - Monthly',
      sku: 'USER-ADD',
      category: 'Add-on',
      unit_price: 10,
      unit_of_measure: 'user/month'
    }
  ]
  
  for (const usage of usageProducts) {
    const { data: product } = await supabaseAdmin
      .from('products')
      .insert({
        organization_id: org.id,
        name: usage.name,
        sku: usage.sku,
        category: usage.category,
        sale_price: usage.unit_price,
        unit_of_measure: usage.unit_of_measure,
        is_service: true,
        custom_fields: {
          billing_type: 'usage_based',
          measurement_unit: usage.unit_of_measure
        }
      })
      .select()
      .single()
    
    createdProducts.push(product)
  }
  
  return { org, products: createdProducts }
}

async function testAgencyServiceCatalog() {
  const { org } = await createTestOrganization(
    'Team Qreative',
    'teamqreative-products',
    'services@teamqreative.ai',
    'growth'
  )
  
  // Create agency service packages
  const services = [
    {
      name: 'Brand Identity Package',
      sku: 'BRAND-PKG',
      category: 'Branding',
      price: 5000,
      duration_days: 30,
      deliverables: ['Logo design', 'Brand guidelines', 'Color palette', 'Typography']
    },
    {
      name: 'Website Design & Development',
      sku: 'WEB-FULL',
      category: 'Web Development',
      price: 15000,
      duration_days: 60,
      deliverables: ['UI/UX design', 'Responsive development', 'CMS setup', 'SEO optimization']
    },
    {
      name: 'Social Media Package - Monthly',
      sku: 'SOCIAL-M',
      category: 'Marketing',
      price: 2000,
      duration_days: 30,
      deliverables: ['Content calendar', '20 posts', 'Community management', 'Monthly report']
    },
    {
      name: 'Marketing Retainer - Monthly',
      sku: 'RETAINER-M',
      category: 'Retainer',
      price: 5000,
      duration_days: 30,
      deliverables: ['40 hours/month', 'Priority support', 'Strategy consulting']
    },
    {
      name: 'Hourly Consulting',
      sku: 'HOURLY',
      category: 'Consulting',
      price: 150,
      duration_days: 0,
      deliverables: ['Billed in 15-minute increments']
    }
  ]
  
  for (const service of services) {
    const { data: product } = await supabaseAdmin
      .from('products')
      .insert({
        organization_id: org.id,
        name: service.name,
        sku: service.sku,
        category: service.category,
        sale_price: service.price,
        is_service: true,
        is_active: true,
        custom_fields: {
          project_duration_days: service.duration_days,
          deliverables: service.deliverables,
          requires_contract: service.price > 5000,
          billing_milestone: service.category === 'Retainer' ? 'monthly' : 'project'
        }
      })
      .select()
      .single()
    
    assertTrue(product.is_service, 'All agency products should be services')
  }
}

async function testPhysicalProducts() {
  const { org } = await createTestOrganization(
    'Hardware Store',
    'hardware-products',
    'inventory@hardware.ai',
    'professional'
  )
  
  // Create physical products with inventory tracking
  const products = [
    {
      name: 'Laptop - MacBook Pro 14"',
      sku: 'MBP-14',
      category: 'Hardware',
      cost: 2000,
      sale_price: 2499,
      weight: 1.6,
      dimensions: '31.26 x 22.12 x 1.55 cm'
    },
    {
      name: 'Wireless Mouse',
      sku: 'MOUSE-01',
      category: 'Accessories',
      cost: 25,
      sale_price: 49.99,
      weight: 0.1,
      dimensions: '10 x 6 x 4 cm'
    },
    {
      name: 'USB-C Cable',
      sku: 'CABLE-USBC',
      category: 'Accessories',
      cost: 5,
      sale_price: 19.99,
      weight: 0.05,
      dimensions: '200 cm length'
    }
  ]
  
  for (const prod of products) {
    const { data: product } = await supabaseAdmin
      .from('products')
      .insert({
        organization_id: org.id,
        name: prod.name,
        sku: prod.sku,
        category: prod.category,
        purchase_price: prod.cost,
        sale_price: prod.sale_price,
        is_service: false,
        is_tracked_inventory: true,
        quantity_on_hand: 0, // Will be set via inventory
        reorder_point: 5,
        reorder_quantity: 10,
        custom_fields: {
          weight_kg: prod.weight,
          dimensions: prod.dimensions,
          margin_percentage: ((prod.sale_price - prod.cost) / prod.sale_price * 100).toFixed(2),
          requires_shipping: true
        }
      })
      .select()
      .single()
    
    assertFalse(product.is_service, 'Physical products should not be services')
    assertTrue(product.is_tracked_inventory, 'Should track inventory')
    
    // Create warehouse location
    const { data: warehouse } = await supabaseAdmin
      .from('warehouses')
      .select()
      .eq('organization_id', org.id)
      .single()
      .catch(() => {
        // Create warehouse if doesn't exist
        return supabaseAdmin
          .from('warehouses')
          .insert({
            organization_id: org.id,
            name: 'Main Warehouse',
            code: 'MAIN',
            type: 'physical'
          })
          .select()
          .single()
      })
    
    if (warehouse?.data) {
      // Create inventory level
      await supabaseAdmin
        .from('inventory_levels')
        .insert({
          organization_id: org.id,
          product_id: product.id,
          warehouse_id: warehouse.data.id,
          quantity_on_hand: 10,
          quantity_available: 10,
          quantity_reserved: 0,
          average_cost: prod.cost
        })
    }
  }
}

async function testProductVariants() {
  const { org } = await createTestOrganization(
    'Variant Test Org',
    'variant-products',
    'product@variant.ai',
    'professional'
  )
  
  // Create parent product
  const { data: parentProduct } = await supabaseAdmin
    .from('products')
    .insert({
      organization_id: org.id,
      name: 'T-Shirt',
      sku: 'TSHIRT',
      category: 'Apparel',
      is_parent: true,
      has_variants: true,
      sale_price: 29.99
    })
    .select()
    .single()
  
  // Create variants
  const variants = [
    { color: 'Red', size: 'S', sku_suffix: 'RED-S' },
    { color: 'Red', size: 'M', sku_suffix: 'RED-M' },
    { color: 'Red', size: 'L', sku_suffix: 'RED-L' },
    { color: 'Blue', size: 'S', sku_suffix: 'BLUE-S' },
    { color: 'Blue', size: 'M', sku_suffix: 'BLUE-M' },
    { color: 'Blue', size: 'L', sku_suffix: 'BLUE-L' },
    { color: 'Black', size: 'S', sku_suffix: 'BLACK-S' },
    { color: 'Black', size: 'M', sku_suffix: 'BLACK-M' },
    { color: 'Black', size: 'L', sku_suffix: 'BLACK-L' }
  ]
  
  for (const variant of variants) {
    await supabaseAdmin
      .from('products')
      .insert({
        organization_id: org.id,
        parent_product_id: parentProduct.id,
        name: `T-Shirt - ${variant.color} ${variant.size}`,
        sku: `TSHIRT-${variant.sku_suffix}`,
        category: 'Apparel',
        sale_price: 29.99,
        is_variant: true,
        custom_fields: {
          variant_attributes: {
            color: variant.color,
            size: variant.size
          }
        }
      })
  }
  
  // Query all variants
  const { data: allVariants } = await supabaseAdmin
    .from('products')
    .select()
    .eq('parent_product_id', parentProduct.id)
  
  assertEqual(allVariants.length, 9, 'Should have 9 variants (3 colors x 3 sizes)')
}

async function testProductBundles() {
  const { org } = await createTestOrganization(
    'Bundle Test Org',
    'bundle-products',
    'product@bundle.ai',
    'professional'
  )
  
  // Create individual products
  const products = []
  const individualProducts = [
    { name: 'Software License', sku: 'LIC-001', price: 99 },
    { name: 'Training Session', sku: 'TRAIN-001', price: 500 },
    { name: 'Support Package', sku: 'SUPPORT-001', price: 200 }
  ]
  
  for (const prod of individualProducts) {
    const { data: product } = await supabaseAdmin
      .from('products')
      .insert({
        organization_id: org.id,
        name: prod.name,
        sku: prod.sku,
        sale_price: prod.price,
        is_service: true
      })
      .select()
      .single()
    
    products.push(product)
  }
  
  // Create bundle
  const bundlePrice = 699 // Discounted from 799
  const { data: bundle } = await supabaseAdmin
    .from('products')
    .insert({
      organization_id: org.id,
      name: 'Complete Onboarding Package',
      sku: 'BUNDLE-ONBOARD',
      category: 'Bundle',
      sale_price: bundlePrice,
      is_bundle: true,
      is_service: true,
      custom_fields: {
        bundle_items: products.map(p => ({
          product_id: p.id,
          product_name: p.name,
          quantity: 1,
          regular_price: p.sale_price
        })),
        bundle_savings: 100,
        bundle_discount_percentage: 12.5
      }
    })
    .select()
    .single()
  
  assertTrue(bundle.is_bundle, 'Should be marked as bundle')
  assertEqual(bundle.custom_fields.bundle_items.length, 3, 'Bundle should have 3 items')
  assertEqual(bundle.custom_fields.bundle_savings, 100, 'Should save $100')
}

async function testProductCategories() {
  const { org } = await createTestOrganization(
    'Category Test Org',
    'category-products',
    'product@category.ai',
    'growth'
  )
  
  // Define category hierarchy
  const categories = {
    'Software': ['Licenses', 'Subscriptions', 'Add-ons'],
    'Services': ['Consulting', 'Training', 'Support'],
    'Hardware': ['Computers', 'Accessories', 'Networking']
  }
  
  // Create products in each category
  for (const [mainCategory, subCategories] of Object.entries(categories)) {
    for (const subCategory of subCategories) {
      await supabaseAdmin
        .from('products')
        .insert({
          organization_id: org.id,
          name: `${subCategory} Product`,
          sku: `${mainCategory.toUpperCase()}-${subCategory.toUpperCase()}`,
          category: mainCategory,
          sale_price: Math.floor(Math.random() * 1000) + 100,
          custom_fields: {
            main_category: mainCategory,
            sub_category: subCategory,
            category_path: `${mainCategory} > ${subCategory}`
          }
        })
    }
  }
  
  // Query products by category
  const { data: softwareProducts } = await supabaseAdmin
    .from('products')
    .select()
    .eq('organization_id', org.id)
    .eq('category', 'Software')
  
  assertEqual(softwareProducts.length, 3, 'Should have 3 software products')
  
  // Query by subcategory
  const { data: consultingServices } = await supabaseAdmin
    .from('products')
    .select()
    .eq('organization_id', org.id)
    .contains('custom_fields', { sub_category: 'Consulting' })
  
  assertEqual(consultingServices.length, 1, 'Should have 1 consulting service')
}

async function testProductPricingTiers() {
  const { org } = await createTestOrganization(
    'Pricing Tier Test',
    'pricing-tiers',
    'product@pricing.ai',
    'professional'
  )
  
  // Create product with volume pricing
  const { data: product } = await supabaseAdmin
    .from('products')
    .insert({
      organization_id: org.id,
      name: 'API Usage Credits',
      sku: 'API-CREDITS',
      category: 'Usage',
      sale_price: 0.01, // Base price per credit
      is_service: true,
      custom_fields: {
        pricing_model: 'volume',
        pricing_tiers: [
          { min: 0, max: 10000, price_per_unit: 0.01 },
          { min: 10001, max: 100000, price_per_unit: 0.008 },
          { min: 100001, max: 1000000, price_per_unit: 0.006 },
          { min: 1000001, max: null, price_per_unit: 0.004 }
        ]
      }
    })
    .select()
    .single()
  
  // Calculate pricing for different volumes
  const volumes = [5000, 50000, 500000, 2000000]
  const expectedPrices = [50, 400, 3000, 8000]
  
  for (let i = 0; i < volumes.length; i++) {
    const tier = product.custom_fields.pricing_tiers.find(
      t => volumes[i] >= t.min && (t.max === null || volumes[i] <= t.max)
    )
    
    const calculatedPrice = volumes[i] * tier.price_per_unit
    assertEqual(
      calculatedPrice,
      expectedPrices[i],
      `Price for ${volumes[i]} units should be $${expectedPrices[i]}`
    )
  }
}

// Run tests
async function main() {
  console.log('🚀 Starting Products and Services Tests\n')
  
  // Clean up any existing test data
  const slugsToClean = [
    'anchorblock-products',
    'teamqreative-products',
    'hardware-products',
    'variant-products',
    'bundle-products',
    'category-products',
    'pricing-tiers'
  ]
  
  for (const slug of slugsToClean) {
    await cleanupBySlug(slug)
  }
  
  const results = await runTestSuite('Products and Services Catalog', [
    { name: 'SaaS product catalog', fn: testSaaSProductCatalog },
    { name: 'Agency service catalog', fn: testAgencyServiceCatalog },
    { name: 'Physical products with inventory', fn: testPhysicalProducts },
    { name: 'Product variants', fn: testProductVariants },
    { name: 'Product bundles', fn: testProductBundles },
    { name: 'Product categories', fn: testProductCategories },
    { name: 'Product pricing tiers', fn: testProductPricingTiers }
  ])
  
  // Cleanup
  for (const slug of slugsToClean) {
    await cleanupBySlug(slug)
  }
  
  process.exit(results.failed > 0 ? 1 : 0)
}

main().catch(console.error)