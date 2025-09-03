#!/usr/bin/env npx tsx

/**
 * Test database tools with correct column names
 */

import { createDatabaseTools } from '../lib/tools/database-tools';

const testContext = {
  userId: 'test-user-id',
  orgId: '11111111-1111-1111-1111-111111111111', // Test org
  workspaceId: undefined,
  role: 'admin'
};

async function runTests() {
  console.log('\n========================================');
  console.log('Testing Database Tools with Correct Schema');
  console.log('========================================\n');
  
  const tools = createDatabaseTools(testContext);
  
  // Test 1: Simple SELECT with correct columns
  console.log('Test 1: List all customers');
  const test1 = await tools.dbRead.execute({
    query: `SELECT id, company_name, display_name, email 
            FROM contacts 
            WHERE organization_id = '${testContext.orgId}' 
            AND type IN ('customer', 'customer_vendor')
            LIMIT 5`
  });
  console.log('Result:', test1.success ? `Found ${test1.rowCount} customers` : `Error: ${test1.error}`);
  
  // Test 2: Invoice with JOIN (correct column names)
  console.log('\nTest 2: Get invoices with customer names');
  const test2 = await tools.dbRead.execute({
    query: `SELECT 
              i.invoice_number,
              i.issue_date,
              i.due_date,
              COALESCE(c.company_name, c.display_name) AS customer_name,
              i.total_amount,
              i.paid_amount,
              (i.total_amount - i.paid_amount) AS balance_due
            FROM invoices i
            JOIN contacts c ON i.customer_id = c.id
            WHERE i.organization_id = '${testContext.orgId}'
            LIMIT 5`
  });
  console.log('Result:', test2.success ? `Found ${test2.rowCount} invoices` : `Error: ${test2.error}`);
  
  // Test 3: Avoid ambiguous columns
  console.log('\nTest 3: Products with correct column names');
  const test3 = await tools.dbRead.execute({
    query: `SELECT 
              p.name AS product_name,
              p.sku,
              p.sale_price,
              p.quantity_on_hand
            FROM products p
            WHERE p.organization_id = '${testContext.orgId}'
            AND p.is_active = true
            LIMIT 5`
  });
  console.log('Result:', test3.success ? `Found ${test3.rowCount} products` : `Error: ${test3.error}`);
  
  // Test 4: Schema info
  console.log('\nTest 4: Get schema for invoices table');
  const test4 = await tools.schemaInfo.execute({
    tables: ['invoices'],
    includeRelationships: true
  });
  console.log('Result:', test4.success ? 'Schema retrieved successfully' : `Error: ${test4.error}`);
  if (test4.success && test4.schema) {
    const invoiceSchema = test4.schema.tables?.find((t: any) => t.name === 'invoices');
    if (invoiceSchema) {
      console.log('Invoice columns:', invoiceSchema.columns.map((c: any) => c.name).slice(0, 5).join(', '), '...');
    }
  }
  
  // Test 5: Check semantic views
  console.log('\nTest 5: List semantic views');
  const test5 = await tools.viewsList.execute({});
  console.log('Result:', test5.success ? `Found ${test5.views?.length || 0} views` : `Error: ${test5.error}`);
  
  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================');
  
  const results = [test1, test2, test3, test4, test5];
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFailed tests:');
    results.forEach((r, i) => {
      if (!r.success) {
        console.log(`  Test ${i + 1}: ${r.error}`);
      }
    });
  }
  
  console.log('\n✨ Key findings:');
  console.log('- invoices.customer_id (NOT contact_id)');
  console.log('- invoices.issue_date (NOT invoice_date)');
  console.log('- products.name (NOT product_name), sale_price (NOT unit_price)');
  console.log('- contacts.company_name/display_name (NOT just name), type (NOT contact_type)');
  console.log('- Use COALESCE(company_name, display_name) for customer/vendor names');
  console.log('- Use table prefixes in JOINs to avoid ambiguity');
  console.log('- Always include organization_id in WHERE clause');
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});