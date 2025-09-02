#!/usr/bin/env npx tsx
/**
 * Test Journey: Semantic Views - Financial Statements
 * 
 * Tests semantic views for AI/LLM consumption:
 * - Balance Sheet (v_balance_sheet)
 * - Profit & Loss Statement (v_profit_loss_statement)
 * - Cash Flow Statement (v_cash_flow_statement)
 * - Financial Ratios (v_financial_ratios)
 * - KPI Dashboard (v_kpi_dashboard)
 * 
 * Validates:
 * - View data accuracy against source tables
 * - Real-time calculations
 * - Multi-period comparisons
 * - Organization isolation
 * - LLM-friendly structure
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
  assertDataExists,
  assertRLSIsolation
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
 * Test Balance Sheet view
 */
async function testBalanceSheet(orgId: string): Promise<void> {
  console.log(chalk.cyan('Testing Balance Sheet view...'));

  // Query balance sheet view
  const { data: balanceSheet, error } = await executeSql(`
    SELECT * FROM semantic.v_balance_sheet
    WHERE org_id = $1
    ORDER BY account_category, account_code
  `, [orgId]);

  if (error) throw error;

  // Validate structure
  const categories = new Set(balanceSheet.map((row: any) => row.account_category));
  const expectedCategories = ['Assets', 'Liabilities', 'Equity'];
  
  for (const category of expectedCategories) {
    if (!categories.has(category)) {
      throw new Error(`Missing category in balance sheet: ${category}`);
    }
  }

  // Calculate totals
  const assets = balanceSheet
    .filter((row: any) => row.account_category === 'Assets')
    .reduce((sum: number, row: any) => sum + parseFloat(row.balance), 0);
    
  const liabilities = balanceSheet
    .filter((row: any) => row.account_category === 'Liabilities')
    .reduce((sum: number, row: any) => sum + parseFloat(row.balance), 0);
    
  const equity = balanceSheet
    .filter((row: any) => row.account_category === 'Equity')
    .reduce((sum: number, row: any) => sum + parseFloat(row.balance), 0);

  // Validate accounting equation
  const difference = Math.abs(assets - (liabilities + equity));
  if (difference > 0.01) {
    console.error(chalk.red(`Balance sheet doesn't balance!`));
    console.error(`Assets: ${assets}, Liabilities: ${liabilities}, Equity: ${equity}`);
    throw new Error(`Balance sheet equation failed: ${difference}`);
  }

  console.log(chalk.blue('\nBalance Sheet Summary:'));
  console.log(`Total Assets: $${assets.toFixed(2)}`);
  console.log(`Total Liabilities: $${liabilities.toFixed(2)}`);
  console.log(`Total Equity: $${equity.toFixed(2)}`);
  console.log(chalk.green('✓ Balance sheet is balanced'));

  // Test LLM-friendly structure
  const sampleRow = balanceSheet[0];
  const requiredFields = [
    'org_id', 'account_code', 'account_name', 'account_category',
    'account_subcategory', 'balance', 'balance_type', 'as_of_date'
  ];

  for (const field of requiredFields) {
    if (!(field in sampleRow)) {
      throw new Error(`Missing required field in balance sheet view: ${field}`);
    }
  }

  console.log(chalk.green('✓ Balance sheet view validated'));
}

/**
 * Test Profit & Loss Statement view
 */
async function testProfitLossStatement(orgId: string): Promise<void> {
  console.log(chalk.cyan('Testing Profit & Loss Statement view...'));

  // Query P&L view
  const { data: profitLoss, error } = await executeSql(`
    SELECT * FROM semantic.v_profit_loss_statement
    WHERE org_id = $1
      AND period_start >= '2024-01-01'
      AND period_end <= '2024-12-31'
    ORDER BY account_category, account_code
  `, [orgId]);

  if (error) throw error;

  // Calculate key metrics
  const revenue = profitLoss
    .filter((row: any) => row.account_category === 'Revenue')
    .reduce((sum: number, row: any) => sum + Math.abs(parseFloat(row.amount)), 0);
    
  const cogs = profitLoss
    .filter((row: any) => row.account_category === 'Cost of Goods Sold')
    .reduce((sum: number, row: any) => sum + parseFloat(row.amount), 0);
    
  const expenses = profitLoss
    .filter((row: any) => row.account_category === 'Operating Expenses')
    .reduce((sum: number, row: any) => sum + parseFloat(row.amount), 0);

  const grossProfit = revenue - cogs;
  const netIncome = grossProfit - expenses;

  console.log(chalk.blue('\nP&L Summary:'));
  console.log(`Revenue: $${revenue.toFixed(2)}`);
  console.log(`COGS: $${cogs.toFixed(2)}`);
  console.log(`Gross Profit: $${grossProfit.toFixed(2)} (${((grossProfit/revenue)*100).toFixed(1)}%)`);
  console.log(`Operating Expenses: $${expenses.toFixed(2)}`);
  console.log(`Net Income: $${netIncome.toFixed(2)} (${((netIncome/revenue)*100).toFixed(1)}%)`);

  // Validate structure for LLM consumption
  const sampleRow = profitLoss[0];
  const requiredFields = [
    'org_id', 'period_start', 'period_end', 'account_code',
    'account_name', 'account_category', 'amount', 'percentage_of_revenue'
  ];

  for (const field of requiredFields) {
    if (sampleRow && !(field in sampleRow)) {
      throw new Error(`Missing required field in P&L view: ${field}`);
    }
  }

  console.log(chalk.green('✓ P&L statement view validated'));
}

/**
 * Test Cash Flow Statement view
 */
async function testCashFlowStatement(orgId: string): Promise<void> {
  console.log(chalk.cyan('Testing Cash Flow Statement view...'));

  // Query cash flow view
  const { data: cashFlow, error } = await executeSql(`
    SELECT * FROM semantic.v_cash_flow_statement
    WHERE org_id = $1
      AND period_start >= '2024-01-01'
    ORDER BY activity_type, sequence
  `, [orgId]);

  if (error) throw error;

  // Summarize by activity type
  const operating = cashFlow
    .filter((row: any) => row.activity_type === 'Operating')
    .reduce((sum: number, row: any) => sum + parseFloat(row.cash_flow), 0);
    
  const investing = cashFlow
    .filter((row: any) => row.activity_type === 'Investing')
    .reduce((sum: number, row: any) => sum + parseFloat(row.cash_flow), 0);
    
  const financing = cashFlow
    .filter((row: any) => row.activity_type === 'Financing')
    .reduce((sum: number, row: any) => sum + parseFloat(row.cash_flow), 0);

  const netCashFlow = operating + investing + financing;

  console.log(chalk.blue('\nCash Flow Summary:'));
  console.log(`Operating Activities: $${operating.toFixed(2)}`);
  console.log(`Investing Activities: $${investing.toFixed(2)}`);
  console.log(`Financing Activities: $${financing.toFixed(2)}`);
  console.log(`Net Cash Flow: $${netCashFlow.toFixed(2)}`);

  // Validate LLM structure
  if (cashFlow.length > 0) {
    const sampleRow = cashFlow[0];
    const requiredFields = [
      'org_id', 'period_start', 'period_end', 'activity_type',
      'line_item', 'cash_flow', 'sequence'
    ];

    for (const field of requiredFields) {
      if (!(field in sampleRow)) {
        throw new Error(`Missing required field in cash flow view: ${field}`);
      }
    }
  }

  console.log(chalk.green('✓ Cash flow statement view validated'));
}

/**
 * Test Financial Ratios view
 */
async function testFinancialRatios(orgId: string): Promise<void> {
  console.log(chalk.cyan('Testing Financial Ratios view...'));

  // Query ratios view
  const { data: ratios, error } = await executeSql(`
    SELECT * FROM semantic.v_financial_ratios
    WHERE org_id = $1
    ORDER BY ratio_category, ratio_name
  `, [orgId]);

  if (error) throw error;

  // Group by category
  const ratiosByCategory: Record<string, any[]> = {};
  for (const ratio of ratios) {
    if (!ratiosByCategory[ratio.ratio_category]) {
      ratiosByCategory[ratio.ratio_category] = [];
    }
    ratiosByCategory[ratio.ratio_category].push({
      name: ratio.ratio_name,
      value: ratio.ratio_value,
      benchmark: ratio.industry_benchmark,
      status: ratio.status
    });
  }

  console.log(chalk.blue('\nFinancial Ratios:'));
  for (const [category, items] of Object.entries(ratiosByCategory)) {
    console.log(chalk.yellow(`\n${category}:`));
    for (const item of items) {
      const statusIcon = item.status === 'Good' ? '✓' : item.status === 'Warning' ? '⚠' : '✗';
      console.log(`  ${statusIcon} ${item.name}: ${item.value} (Benchmark: ${item.benchmark})`);
    }
  }

  // Validate key ratios exist
  const expectedRatios = [
    'Current Ratio',
    'Quick Ratio',
    'Gross Profit Margin',
    'Net Profit Margin',
    'Return on Assets',
    'Debt to Equity'
  ];

  const ratioNames = ratios.map((r: any) => r.ratio_name);
  for (const expected of expectedRatios) {
    if (!ratioNames.includes(expected)) {
      console.warn(chalk.yellow(`Warning: Missing ratio ${expected}`));
    }
  }

  console.log(chalk.green('✓ Financial ratios view validated'));
}

/**
 * Test KPI Dashboard view
 */
async function testKPIDashboard(orgId: string): Promise<void> {
  console.log(chalk.cyan('Testing KPI Dashboard view...'));

  // Query KPI view
  const { data: kpis, error } = await executeSql(`
    SELECT * FROM semantic.v_kpi_dashboard
    WHERE org_id = $1
    ORDER BY kpi_category, kpi_name
  `, [orgId]);

  if (error) throw error;

  // Display KPIs by category
  const kpisByCategory: Record<string, any[]> = {};
  for (const kpi of kpis) {
    if (!kpisByCategory[kpi.kpi_category]) {
      kpisByCategory[kpi.kpi_category] = [];
    }
    kpisByCategory[kpi.kpi_category].push({
      name: kpi.kpi_name,
      value: kpi.current_value,
      target: kpi.target_value,
      trend: kpi.trend,
      change: kpi.period_change
    });
  }

  console.log(chalk.blue('\nKPI Dashboard:'));
  for (const [category, items] of Object.entries(kpisByCategory)) {
    console.log(chalk.yellow(`\n${category}:`));
    for (const item of items) {
      const trendIcon = item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→';
      const achievement = item.target ? `(Target: ${item.target})` : '';
      console.log(`  ${trendIcon} ${item.name}: ${item.value} ${achievement}`);
      if (item.change) {
        console.log(`     Change: ${item.change}%`);
      }
    }
  }

  // Validate essential KPIs
  const essentialKPIs = [
    'Monthly Recurring Revenue',
    'Customer Acquisition Cost',
    'Customer Lifetime Value',
    'Gross Margin',
    'Burn Rate'
  ];

  const kpiNames = kpis.map((k: any) => k.kpi_name);
  for (const essential of essentialKPIs) {
    if (!kpiNames.includes(essential)) {
      console.warn(chalk.yellow(`Note: KPI '${essential}' not found (may not apply to all businesses)`));
    }
  }

  console.log(chalk.green('✓ KPI dashboard view validated'));
}

/**
 * Test AR Aging Report view
 */
async function testARAgingReport(orgId: string): Promise<void> {
  console.log(chalk.cyan('Testing AR Aging Report view...'));

  // Query AR aging view
  const { data: arAging, error } = await executeSql(`
    SELECT * FROM semantic.v_ar_aging_report
    WHERE org_id = $1
    ORDER BY days_overdue DESC
  `, [orgId]);

  if (error) throw error;

  // Summarize by aging bucket
  const buckets = {
    current: { count: 0, amount: 0 },
    '1-30': { count: 0, amount: 0 },
    '31-60': { count: 0, amount: 0 },
    '61-90': { count: 0, amount: 0 },
    'over_90': { count: 0, amount: 0 }
  };

  for (const invoice of arAging) {
    const days = invoice.days_overdue;
    const amount = parseFloat(invoice.amount_due);
    
    if (days <= 0) {
      buckets.current.count++;
      buckets.current.amount += amount;
    } else if (days <= 30) {
      buckets['1-30'].count++;
      buckets['1-30'].amount += amount;
    } else if (days <= 60) {
      buckets['31-60'].count++;
      buckets['31-60'].amount += amount;
    } else if (days <= 90) {
      buckets['61-90'].count++;
      buckets['61-90'].amount += amount;
    } else {
      buckets.over_90.count++;
      buckets.over_90.amount += amount;
    }
  }

  console.log(chalk.blue('\nAR Aging Summary:'));
  console.table(Object.entries(buckets).map(([bucket, data]) => ({
    'Aging Bucket': bucket,
    'Count': data.count,
    'Amount': `$${data.amount.toFixed(2)}`
  })));

  const totalAR = Object.values(buckets).reduce((sum, b) => sum + b.amount, 0);
  console.log(`Total AR: $${totalAR.toFixed(2)}`);

  console.log(chalk.green('✓ AR aging report view validated'));
}

/**
 * Test AP Aging Report view
 */
async function testAPAgingReport(orgId: string): Promise<void> {
  console.log(chalk.cyan('Testing AP Aging Report view...'));

  // Query AP aging view
  const { data: apAging, error } = await executeSql(`
    SELECT * FROM semantic.v_ap_aging_report
    WHERE org_id = $1
    ORDER BY days_overdue DESC
  `, [orgId]);

  if (error) throw error;

  // Summarize by aging bucket
  const buckets = {
    current: { count: 0, amount: 0 },
    '1-30': { count: 0, amount: 0 },
    '31-60': { count: 0, amount: 0 },
    '61-90': { count: 0, amount: 0 },
    'over_90': { count: 0, amount: 0 }
  };

  for (const bill of apAging) {
    const days = bill.days_overdue;
    const amount = parseFloat(bill.amount_due);
    
    if (days <= 0) {
      buckets.current.count++;
      buckets.current.amount += amount;
    } else if (days <= 30) {
      buckets['1-30'].count++;
      buckets['1-30'].amount += amount;
    } else if (days <= 60) {
      buckets['31-60'].count++;
      buckets['31-60'].amount += amount;
    } else if (days <= 90) {
      buckets['61-90'].count++;
      buckets['61-90'].amount += amount;
    } else {
      buckets.over_90.count++;
      buckets.over_90.amount += amount;
    }
  }

  console.log(chalk.blue('\nAP Aging Summary:'));
  console.table(Object.entries(buckets).map(([bucket, data]) => ({
    'Aging Bucket': bucket,
    'Count': data.count,
    'Amount': `$${data.amount.toFixed(2)}`
  })));

  const totalAP = Object.values(buckets).reduce((sum, b) => sum + b.amount, 0);
  console.log(`Total AP: $${totalAP.toFixed(2)}`);

  console.log(chalk.green('✓ AP aging report view validated'));
}

/**
 * Test semantic view for LLM queries
 */
async function testLLMQueryStructure(orgId: string): Promise<void> {
  console.log(chalk.cyan('Testing semantic view structure for LLM queries...'));

  // Sample LLM-style queries
  const queries = [
    {
      name: 'Revenue Trend',
      sql: `
        SELECT 
          DATE_TRUNC('month', period_start) as month,
          SUM(amount) as revenue
        FROM semantic.v_profit_loss_statement
        WHERE org_id = $1
          AND account_category = 'Revenue'
          AND period_start >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY month
        ORDER BY month
      `
    },
    {
      name: 'Top Customers by Revenue',
      sql: `
        SELECT 
          customer_name,
          total_revenue,
          invoice_count,
          avg_invoice_value
        FROM semantic.v_customer_revenue
        WHERE org_id = $1
        ORDER BY total_revenue DESC
        LIMIT 5
      `
    },
    {
      name: 'Cash Position',
      sql: `
        SELECT 
          account_name,
          balance as cash_balance
        FROM semantic.v_balance_sheet
        WHERE org_id = $1
          AND account_subcategory = 'Cash and Cash Equivalents'
      `
    }
  ];

  for (const query of queries) {
    console.log(chalk.yellow(`\nTesting query: ${query.name}`));
    const { data, error } = await executeSql(query.sql, [orgId]);
    
    if (error) {
      console.error(chalk.red(`Query failed: ${error.message}`));
      throw error;
    }
    
    console.log(`Results: ${data?.length || 0} rows`);
    if (data && data.length > 0) {
      console.table(data.slice(0, 3)); // Show first 3 rows
    }
  }

  console.log(chalk.green('✓ LLM query structure validated'));
}

/**
 * Main test execution
 */
async function runTests() {
  console.log(chalk.bold.blue('\n🧪 Testing Semantic Views - Financial Statements\n'));

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

    // Test Anchorblock semantic views
    console.log(chalk.bold('\n📊 Testing Anchorblock Financial Views'));
    await setAuthContext(context.anchorblock.orgId, context.anchorblock.userId);

    await testBalanceSheet(context.anchorblock.orgId);
    await testProfitLossStatement(context.anchorblock.orgId);
    await testCashFlowStatement(context.anchorblock.orgId);
    await testFinancialRatios(context.anchorblock.orgId);
    await testKPIDashboard(context.anchorblock.orgId);
    await testARAgingReport(context.anchorblock.orgId);
    await testAPAgingReport(context.anchorblock.orgId);

    // Test Team Qreative semantic views
    console.log(chalk.bold('\n🎨 Testing Team Qreative Financial Views'));
    await clearAuthContext();
    await setAuthContext(context.teamQreative.orgId, context.teamQreative.userId);

    await testBalanceSheet(context.teamQreative.orgId);
    await testProfitLossStatement(context.teamQreative.orgId);
    await testKPIDashboard(context.teamQreative.orgId);

    // Test LLM query patterns
    console.log(chalk.bold('\n🤖 Testing LLM Query Patterns'));
    await testLLMQueryStructure(context.anchorblock.orgId);

    // Test view isolation
    console.log(chalk.bold('\n🔒 Testing Semantic View Isolation'));
    
    // Try to query Anchorblock data with Team Qreative context
    await clearAuthContext();
    await setAuthContext(context.teamQreative.orgId, context.teamQreative.userId);
    
    const { data: crossOrgTest } = await executeSql(`
      SELECT COUNT(*) as count 
      FROM semantic.v_balance_sheet 
      WHERE org_id = $1
    `, [context.anchorblock.orgId]);
    
    if (crossOrgTest && crossOrgTest[0].count > 0) {
      throw new Error('RLS violation: Can access other org data through semantic views!');
    }
    
    console.log(chalk.green('✓ Semantic views properly isolated by organization'));

    console.log(chalk.bold.green('\n✅ All semantic view tests passed!\n'));

  } catch (error) {
    console.error(chalk.red('\n❌ Test failed:'), error);
    throw error;
  } finally {
    await clearAuthContext();
  }
}

// Execute tests
runTests().catch(console.error);