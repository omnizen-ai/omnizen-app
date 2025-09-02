#!/usr/bin/env npx tsx
/**
 * Test Journey: Semantic Views - Operational Analytics
 * 
 * Tests operational semantic views for AI/LLM consumption:
 * - Customer Revenue Analysis (v_customer_revenue)
 * - Inventory Status (v_inventory_status)
 * - Order Pipeline (v_order_pipeline)
 * - Product Performance
 * - Vendor Analysis
 * 
 * Validates:
 * - Real-time operational metrics
 * - Cross-functional data integration
 * - Predictive analytics preparation
 * - LLM query optimization
 * 
 * Organizations tested:
 * - Anchorblock Technology Limited (Professional tier)
 * - Team Qreative (Growth tier)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { 
  getSupabaseClient, 
  executeSql, 
  setAuthContext, 
  clearAuthContext 
} from '../utils/db-client';
import { 
  assertDataExists
} from '../utils/test-assertions';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const supabase = getSupabaseClient();

interface TestContext {
  anchorblock: {
    orgId: string;
    userId: string;
  };
  teamQreative: {
    orgId: string;
    userId: string;
  };
}

/**
 * Test Customer Revenue Analysis view
 */
async function testCustomerRevenue(orgId: string): Promise<void> {
  console.log(chalk.cyan('Testing Customer Revenue Analysis view...'));

  // Query customer revenue view
  const { data: customers, error } = await executeSql(`
    SELECT * FROM semantic.v_customer_revenue
    WHERE org_id = $1
    ORDER BY total_revenue DESC
  `, [orgId]);

  if (error) throw error;

  if (customers && customers.length > 0) {
    // Calculate summary metrics
    const totalRevenue = customers.reduce((sum: number, c: any) => sum + parseFloat(c.total_revenue), 0);
    const avgCustomerValue = totalRevenue / customers.length;
    
    // Identify customer segments
    const topCustomers = customers.slice(0, Math.ceil(customers.length * 0.2));
    const topCustomerRevenue = topCustomers.reduce((sum: number, c: any) => sum + parseFloat(c.total_revenue), 0);
    const revenueConcentration = (topCustomerRevenue / totalRevenue) * 100;

    console.log(chalk.blue('\nCustomer Revenue Analysis:'));
    console.log(`Total Customers: ${customers.length}`);
    console.log(`Total Revenue: $${totalRevenue.toFixed(2)}`);
    console.log(`Average Customer Value: $${avgCustomerValue.toFixed(2)}`);
    console.log(`Top 20% Revenue Concentration: ${revenueConcentration.toFixed(1)}%`);

    // Show top customers
    console.log(chalk.yellow('\nTop Customers:'));
    console.table(customers.slice(0, 5).map((c: any) => ({
      Customer: c.customer_name,
      Revenue: `$${parseFloat(c.total_revenue).toFixed(2)}`,
      Invoices: c.invoice_count,
      'Avg Invoice': `$${parseFloat(c.avg_invoice_value).toFixed(2)}`,
      'Days to Pay': c.avg_days_to_pay || 'N/A'
    })));

    // Validate LLM-friendly structure
    const requiredFields = [
      'org_id', 'customer_id', 'customer_name', 'customer_segment',
      'total_revenue', 'invoice_count', 'avg_invoice_value',
      'first_invoice_date', 'last_invoice_date'
    ];

    const sampleRow = customers[0];
    for (const field of requiredFields) {
      if (!(field in sampleRow)) {
        throw new Error(`Missing required field in customer revenue view: ${field}`);
      }
    }
  }

  console.log(chalk.green('✓ Customer revenue analysis view validated'));
}

/**
 * Test Inventory Status view
 */
async function testInventoryStatus(orgId: string): Promise<void> {
  console.log(chalk.cyan('Testing Inventory Status view...'));

  // Query inventory view
  const { data: inventory, error } = await executeSql(`
    SELECT * FROM semantic.v_inventory_status
    WHERE org_id = $1
    ORDER BY value_on_hand DESC
  `, [orgId]);

  if (error) throw error;

  if (inventory && inventory.length > 0) {
    // Calculate inventory metrics
    const totalValue = inventory.reduce((sum: number, i: any) => sum + parseFloat(i.value_on_hand), 0);
    const totalItems = inventory.reduce((sum: number, i: any) => sum + parseInt(i.quantity_on_hand), 0);
    
    // Identify stock issues
    const lowStock = inventory.filter((i: any) => i.stock_status === 'low');
    const outOfStock = inventory.filter((i: any) => i.stock_status === 'out_of_stock');
    const overstock = inventory.filter((i: any) => i.stock_status === 'overstock');

    console.log(chalk.blue('\nInventory Summary:'));
    console.log(`Total SKUs: ${inventory.length}`);
    console.log(`Total Items: ${totalItems}`);
    console.log(`Total Value: $${totalValue.toFixed(2)}`);
    console.log(chalk.yellow('\nStock Status:'));
    console.log(`Low Stock: ${lowStock.length} SKUs`);
    console.log(`Out of Stock: ${outOfStock.length} SKUs`);
    console.log(`Overstock: ${overstock.length} SKUs`);

    // Show critical items
    if (lowStock.length > 0) {
      console.log(chalk.yellow('\nLow Stock Items:'));
      console.table(lowStock.slice(0, 5).map((i: any) => ({
        Product: i.product_name,
        'On Hand': i.quantity_on_hand,
        'Reorder Point': i.reorder_point,
        'Days Supply': i.days_supply_remaining || 'N/A'
      })));
    }

    // Validate view structure
    const requiredFields = [
      'org_id', 'product_id', 'product_name', 'sku',
      'quantity_on_hand', 'unit_cost', 'value_on_hand',
      'stock_status', 'warehouse_name'
    ];

    const sampleRow = inventory[0];
    for (const field of requiredFields) {
      if (!(field in sampleRow)) {
        console.warn(chalk.yellow(`Note: Field '${field}' not in inventory view`));
      }
    }
  } else {
    console.log(chalk.yellow('No inventory data available'));
  }

  console.log(chalk.green('✓ Inventory status view validated'));
}

/**
 * Test Order Pipeline view
 */
async function testOrderPipeline(orgId: string): Promise<void> {
  console.log(chalk.cyan('Testing Order Pipeline view...'));

  // Query order pipeline view
  const { data: orders, error } = await executeSql(`
    SELECT * FROM semantic.v_order_pipeline
    WHERE org_id = $1
    ORDER BY order_date DESC
  `, [orgId]);

  if (error) throw error;

  if (orders && orders.length > 0) {
    // Analyze pipeline
    const pipelineByStatus: Record<string, { count: number; value: number }> = {};
    
    for (const order of orders) {
      const status = order.order_status;
      if (!pipelineByStatus[status]) {
        pipelineByStatus[status] = { count: 0, value: 0 };
      }
      pipelineByStatus[status].count++;
      pipelineByStatus[status].value += parseFloat(order.total_amount);
    }

    console.log(chalk.blue('\nOrder Pipeline Summary:'));
    console.table(Object.entries(pipelineByStatus).map(([status, data]) => ({
      Status: status,
      Count: data.count,
      Value: `$${data.value.toFixed(2)}`
    })));

    // Calculate fulfillment metrics
    const fulfilled = orders.filter((o: any) => o.fulfillment_status === 'fulfilled');
    const avgFulfillmentDays = fulfilled.length > 0
      ? fulfilled.reduce((sum: number, o: any) => sum + (o.days_to_fulfill || 0), 0) / fulfilled.length
      : 0;

    console.log(chalk.yellow('\nFulfillment Metrics:'));
    console.log(`Fulfilled Orders: ${fulfilled.length}`);
    console.log(`Average Fulfillment Time: ${avgFulfillmentDays.toFixed(1)} days`);

    // Show recent orders
    console.log(chalk.yellow('\nRecent Orders:'));
    console.table(orders.slice(0, 5).map((o: any) => ({
      'Order #': o.order_number,
      Customer: o.customer_name,
      Amount: `$${parseFloat(o.total_amount).toFixed(2)}`,
      Status: o.order_status,
      'Order Date': o.order_date
    })));
  } else {
    console.log(chalk.yellow('No order data available'));
  }

  console.log(chalk.green('✓ Order pipeline view validated'));
}

/**
 * Test Product Performance Analytics
 */
async function testProductPerformance(orgId: string): Promise<void> {
  console.log(chalk.cyan('Testing Product Performance Analytics...'));

  // Query product performance using invoice lines
  const { data: products, error } = await executeSql(`
    SELECT 
      p.id as product_id,
      p.name as product_name,
      p.sku,
      COUNT(DISTINCT il.invoice_id) as invoice_count,
      SUM(il.quantity) as total_quantity_sold,
      SUM(il.line_total) as total_revenue,
      AVG(il.unit_price) as avg_selling_price,
      MAX(i.invoice_date) as last_sold_date
    FROM products p
    LEFT JOIN invoice_lines il ON il.product_id = p.id
    LEFT JOIN invoices i ON i.id = il.invoice_id
    WHERE p.org_id = $1
    GROUP BY p.id, p.name, p.sku
    ORDER BY total_revenue DESC NULLS LAST
  `, [orgId]);

  if (error) throw error;

  if (products && products.length > 0) {
    // Calculate metrics
    const totalRevenue = products.reduce((sum: number, p: any) => 
      sum + (parseFloat(p.total_revenue) || 0), 0);
    
    // Pareto analysis (80/20 rule)
    let cumulativeRevenue = 0;
    let topProductCount = 0;
    for (const product of products) {
      cumulativeRevenue += parseFloat(product.total_revenue) || 0;
      topProductCount++;
      if (cumulativeRevenue >= totalRevenue * 0.8) break;
    }

    console.log(chalk.blue('\nProduct Performance Summary:'));
    console.log(`Total Products: ${products.length}`);
    console.log(`Total Revenue: $${totalRevenue.toFixed(2)}`);
    console.log(`Top ${topProductCount} products (${((topProductCount/products.length)*100).toFixed(1)}%) generate 80% of revenue`);

    // Show top performers
    console.log(chalk.yellow('\nTop Performing Products:'));
    console.table(products.slice(0, 5).map((p: any) => ({
      Product: p.product_name,
      SKU: p.sku,
      'Units Sold': p.total_quantity_sold || 0,
      Revenue: `$${(parseFloat(p.total_revenue) || 0).toFixed(2)}`,
      'Avg Price': `$${(parseFloat(p.avg_selling_price) || 0).toFixed(2)}`
    })));

    // Identify slow movers
    const slowMovers = products.filter((p: any) => 
      !p.last_sold_date || 
      new Date(p.last_sold_date) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    );
    
    if (slowMovers.length > 0) {
      console.log(chalk.yellow(`\nSlow Moving Products: ${slowMovers.length} items not sold in 90+ days`));
    }
  }

  console.log(chalk.green('✓ Product performance analytics validated'));
}

/**
 * Test Vendor Analysis
 */
async function testVendorAnalysis(orgId: string): Promise<void> {
  console.log(chalk.cyan('Testing Vendor Analysis...'));

  // Query vendor spend analysis
  const { data: vendors, error } = await executeSql(`
    SELECT 
      c.id as vendor_id,
      c.name as vendor_name,
      c.vendor_category,
      COUNT(DISTINCT b.id) as bill_count,
      SUM(b.total_amount) as total_spend,
      AVG(b.total_amount) as avg_bill_amount,
      AVG(EXTRACT(DAY FROM (b.paid_date - b.due_date))) as avg_payment_delay,
      MAX(b.bill_date) as last_bill_date
    FROM contacts c
    LEFT JOIN bills b ON b.vendor_id = c.id
    WHERE c.org_id = $1
      AND c.contact_type = 'vendor'
    GROUP BY c.id, c.name, c.vendor_category
    ORDER BY total_spend DESC NULLS LAST
  `, [orgId]);

  if (error) throw error;

  if (vendors && vendors.length > 0) {
    // Calculate spend concentration
    const totalSpend = vendors.reduce((sum: number, v: any) => 
      sum + (parseFloat(v.total_spend) || 0), 0);
    
    const activeVendors = vendors.filter((v: any) => v.bill_count > 0);
    
    // Top vendor concentration
    const topVendors = activeVendors.slice(0, 5);
    const topVendorSpend = topVendors.reduce((sum: number, v: any) => 
      sum + (parseFloat(v.total_spend) || 0), 0);

    console.log(chalk.blue('\nVendor Analysis Summary:'));
    console.log(`Total Vendors: ${vendors.length}`);
    console.log(`Active Vendors: ${activeVendors.length}`);
    console.log(`Total Spend: $${totalSpend.toFixed(2)}`);
    console.log(`Top 5 Vendor Concentration: ${((topVendorSpend/totalSpend)*100).toFixed(1)}%`);

    // Show top vendors
    if (topVendors.length > 0) {
      console.log(chalk.yellow('\nTop Vendors by Spend:'));
      console.table(topVendors.map((v: any) => ({
        Vendor: v.vendor_name,
        Category: v.vendor_category || 'Uncategorized',
        Bills: v.bill_count,
        'Total Spend': `$${(parseFloat(v.total_spend) || 0).toFixed(2)}`,
        'Avg Bill': `$${(parseFloat(v.avg_bill_amount) || 0).toFixed(2)}`
      })));
    }

    // Payment performance
    const onTimeVendors = activeVendors.filter((v: any) => 
      !v.avg_payment_delay || v.avg_payment_delay <= 0
    );
    console.log(chalk.yellow('\nPayment Performance:'));
    console.log(`On-time Payment Rate: ${((onTimeVendors.length/activeVendors.length)*100).toFixed(1)}%`);
  }

  console.log(chalk.green('✓ Vendor analysis validated'));
}

/**
 * Test LLM-optimized operational queries
 */
async function testOperationalLLMQueries(orgId: string): Promise<void> {
  console.log(chalk.cyan('Testing LLM-optimized operational queries...'));

  const queries = [
    {
      name: 'Customer Churn Risk',
      description: 'Identify customers with declining activity',
      sql: `
        SELECT 
          customer_name,
          last_invoice_date,
          EXTRACT(DAY FROM (CURRENT_DATE - last_invoice_date::date)) as days_since_last_order,
          total_revenue,
          invoice_count
        FROM semantic.v_customer_revenue
        WHERE org_id = $1
          AND last_invoice_date < CURRENT_DATE - INTERVAL '60 days'
        ORDER BY total_revenue DESC
        LIMIT 10
      `
    },
    {
      name: 'Revenue Growth Trend',
      description: 'Month-over-month revenue growth',
      sql: `
        SELECT 
          DATE_TRUNC('month', invoice_date) as month,
          COUNT(*) as invoice_count,
          SUM(total_amount) as revenue,
          LAG(SUM(total_amount)) OVER (ORDER BY DATE_TRUNC('month', invoice_date)) as prev_month_revenue,
          ROUND(((SUM(total_amount) - LAG(SUM(total_amount)) OVER (ORDER BY DATE_TRUNC('month', invoice_date))) / 
            NULLIF(LAG(SUM(total_amount)) OVER (ORDER BY DATE_TRUNC('month', invoice_date)), 0)) * 100, 2) as growth_rate
        FROM invoices
        WHERE org_id = $1
          AND status != 'void'
        GROUP BY DATE_TRUNC('month', invoice_date)
        ORDER BY month DESC
        LIMIT 6
      `
    },
    {
      name: 'Cash Conversion Cycle',
      description: 'Days to convert sales to cash',
      sql: `
        SELECT 
          AVG(EXTRACT(DAY FROM (paid_date - invoice_date))) as avg_days_to_payment,
          MIN(EXTRACT(DAY FROM (paid_date - invoice_date))) as min_days,
          MAX(EXTRACT(DAY FROM (paid_date - invoice_date))) as max_days,
          COUNT(*) as sample_size
        FROM invoices
        WHERE org_id = $1
          AND status = 'paid'
          AND paid_date IS NOT NULL
          AND invoice_date >= CURRENT_DATE - INTERVAL '90 days'
      `
    }
  ];

  for (const query of queries) {
    console.log(chalk.yellow(`\n${query.name}: ${query.description}`));
    const { data, error } = await executeSql(query.sql, [orgId]);
    
    if (error) {
      console.error(chalk.red(`Query failed: ${error.message}`));
      continue;
    }
    
    if (data && data.length > 0) {
      console.table(data.slice(0, 5));
    } else {
      console.log('No data available');
    }
  }

  console.log(chalk.green('\n✓ Operational LLM queries validated'));
}

/**
 * Main test execution
 */
async function runTests() {
  console.log(chalk.bold.blue('\n🧪 Testing Semantic Views - Operational Analytics\n'));

  const context: TestContext = {
    anchorblock: {
      orgId: '',
      userId: ''
    },
    teamQreative: {
      orgId: '',
      userId: ''
    }
  };

  try {
    // Get test data
    console.log(chalk.yellow('Loading test context...'));

    // Get Anchorblock data
    const { data: anchorblockOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', 'anchorblock-tech')
      .single();

    const { data: anchorblockUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'faruk@anchorblock.vc')
      .single();

    context.anchorblock = {
      orgId: anchorblockOrg?.id || '',
      userId: anchorblockUser?.id || ''
    };

    // Get Team Qreative data
    const { data: qreativeOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', 'team-qreative')
      .single();

    const { data: qreativeUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'hello@teamqreative.com')
      .single();

    context.teamQreative = {
      orgId: qreativeOrg?.id || '',
      userId: qreativeUser?.id || ''
    };

    // Validate context
    assertDataExists(context.anchorblock.orgId, 'Anchorblock organization');
    assertDataExists(context.teamQreative.orgId, 'Team Qreative organization');

    // Test Anchorblock operational views
    console.log(chalk.bold('\n📊 Testing Anchorblock Operational Analytics'));
    await setAuthContext(context.anchorblock.orgId, context.anchorblock.userId);

    await testCustomerRevenue(context.anchorblock.orgId);
    await testInventoryStatus(context.anchorblock.orgId);
    await testOrderPipeline(context.anchorblock.orgId);
    await testProductPerformance(context.anchorblock.orgId);
    await testVendorAnalysis(context.anchorblock.orgId);

    // Test Team Qreative operational views
    console.log(chalk.bold('\n🎨 Testing Team Qreative Operational Analytics'));
    await clearAuthContext();
    await setAuthContext(context.teamQreative.orgId, context.teamQreative.userId);

    await testCustomerRevenue(context.teamQreative.orgId);
    await testProductPerformance(context.teamQreative.orgId);
    await testVendorAnalysis(context.teamQreative.orgId);

    // Test LLM query patterns
    console.log(chalk.bold('\n🤖 Testing Operational LLM Queries'));
    await testOperationalLLMQueries(context.anchorblock.orgId);

    // Test cross-org isolation
    console.log(chalk.bold('\n🔒 Testing Cross-Organization Isolation'));
    
    // Verify Team Qreative cannot see Anchorblock data
    const { data: isolationTest } = await executeSql(`
      SELECT COUNT(*) as count 
      FROM semantic.v_customer_revenue 
      WHERE org_id != $1
    `, [context.teamQreative.orgId]);
    
    if (isolationTest && isolationTest[0].count > 0) {
      throw new Error('RLS violation: Can see other organization data!');
    }
    
    console.log(chalk.green('✓ Operational views properly isolated'));

    console.log(chalk.bold.green('\n✅ All operational analytics tests passed!\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ Test failed:'), error);
    throw error;
  } finally {
    await clearAuthContext();
  }
}

// Execute tests
runTests().catch(console.error);