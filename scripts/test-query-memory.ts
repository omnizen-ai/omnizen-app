#!/usr/bin/env npx tsx

/**
 * Test Redis query memory functionality
 */

import { 
  normalizeIntent,
  extractTables, 
  detectDomain,
  storeSuccessfulQuery,
  getRelevantExamples,
  formatExamplesForPrompt
} from '../lib/ai/query-memory';

async function testQueryMemory() {
  console.log('\n========================================');
  console.log('Testing Query Memory System');
  console.log('========================================\n');
  
  // Test 1: Intent normalization
  console.log('Test 1: Intent Normalization');
  const intents = [
    'Show me all invoices for Acme Corp',
    'List unpaid invoices', 
    'Get total revenue this month',
    'Show inventory levels'
  ];
  
  for (const query of intents) {
    const normalized = normalizeIntent(query);
    console.log(`  "${query}"`);
    console.log(`  → ${normalized}\n`);
  }
  
  // Test 2: Table extraction
  console.log('\nTest 2: Table Extraction');
  const queries = [
    'SELECT * FROM invoices WHERE status = ?',
    'SELECT i.*, c.company_name FROM invoices i JOIN contacts c ON i.customer_id = c.id',
    'SELECT p.name FROM products p JOIN inventory_levels il ON p.id = il.product_id',
  ];
  
  for (const sql of queries) {
    const tables = extractTables(sql);
    const domain = detectDomain(tables);
    console.log(`  SQL: ${sql.substring(0, 50)}...`);
    console.log(`  Tables: ${tables.join(', ')}`);
    console.log(`  Domain: ${domain}\n`);
  }
  
  // Test 3: Store some queries
  console.log('\nTest 3: Storing Queries');
  
  await storeSuccessfulQuery(
    'Show all invoices for TechCorp',
    `SELECT i.*, COALESCE(c.company_name, c.display_name) as customer_name 
     FROM invoices i 
     JOIN contacts c ON i.customer_id = c.id 
     WHERE i.organization_id = '11111111-1111-1111-1111-111111111111' 
     AND c.company_name ILIKE '%TechCorp%'`,
    true
  );
  console.log('  ✓ Stored invoice lookup query');
  
  await storeSuccessfulQuery(
    'Get total revenue this month',
    `SELECT SUM(total_amount) as revenue 
     FROM invoices 
     WHERE organization_id = '11111111-1111-1111-1111-111111111111'
     AND status = 'paid' 
     AND issue_date >= date_trunc('month', CURRENT_DATE)`,
    true
  );
  console.log('  ✓ Stored revenue aggregation query');
  
  await storeSuccessfulQuery(
    'List products with low stock',
    `SELECT p.name, p.sku, il.quantity_on_hand, p.reorder_point
     FROM products p
     JOIN inventory_levels il ON p.id = il.product_id
     WHERE p.organization_id = '11111111-1111-1111-1111-111111111111'
     AND il.quantity_on_hand < p.reorder_point`,
    true
  );
  console.log('  ✓ Stored inventory query');
  
  // Test 4: Retrieve examples
  console.log('\nTest 4: Retrieving Examples');
  
  const testQueries = [
    'Show me invoices for a customer',
    'Calculate monthly revenue',
    'Check inventory status'
  ];
  
  for (const query of testQueries) {
    console.log(`\n  Query: "${query}"`);
    const examples = await getRelevantExamples(query, 2);
    console.log(`  Found ${examples.length} examples`);
    
    if (examples.length > 0) {
      for (const ex of examples) {
        console.log(`    - ${ex.intent} (${ex.domain}): "${ex.naturalQuery.substring(0, 40)}..."`);
      }
    }
  }
  
  // Test 5: Format for prompt
  console.log('\nTest 5: Prompt Formatting');
  const examplesForPrompt = await getRelevantExamples('Show invoices for customer', 2);
  const formatted = formatExamplesForPrompt(examplesForPrompt);
  
  if (formatted) {
    console.log('Formatted prompt addition:');
    console.log('---');
    console.log(formatted);
    console.log('---');
  }
  
  console.log('\n========================================');
  console.log('Query Memory Test Complete');
  console.log('========================================\n');
  
  // Keep process alive for 1 second to allow Redis to close properly
  await new Promise(resolve => setTimeout(resolve, 1000));
  process.exit(0);
}

testQueryMemory().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});