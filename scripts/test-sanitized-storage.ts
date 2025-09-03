#!/usr/bin/env npx tsx

import { storeSuccessfulQuery, getRelevantExamples } from '../lib/ai/query-memory';
import { createClient } from 'redis';

async function testSanitizedStorage() {
  console.log('Testing Sanitized Query Storage\n');
  console.log('='.repeat(80));
  
  // Test storing queries with sensitive data
  const testCases = [
    {
      natural: "Show invoices for Acme Corporation with email john@acme.com",
      sql: "SELECT * FROM invoices WHERE organization_id = '11111111-1111-1111-1111-111111111111' AND customer_email = 'john@acme.com'"
    },
    {
      natural: "my company is TechCorp Limited, get revenue for customer ID 7c08fc98-a801-407a-98fc-f24b7e352bfb",
      sql: "SELECT SUM(total_amount) FROM invoices WHERE organization_id = '11111111-1111-1111-1111-111111111111' AND customer_id = '7c08fc98-a801-407a-98fc-f24b7e352bfb'"
    }
  ];
  
  console.log('Storing test queries with sensitive data...\n');
  
  for (const test of testCases) {
    console.log('Storing:');
    console.log('Natural:', test.natural);
    console.log('SQL:', test.sql);
    await storeSuccessfulQuery(test.natural, test.sql, true);
    console.log('---');
  }
  
  // Wait a moment for Redis
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\n' + '='.repeat(80));
  console.log('Checking what was actually stored in Redis:\n');
  
  // Connect directly to Redis to see what was stored
  const client = createClient({ 
    url: process.env.REDIS_URL || 'redis://:myredissecret@localhost:6379' 
  });
  
  try {
    await client.connect();
    const keys = await client.keys('query:*');
    
    console.log(`Found ${keys.length} stored queries:\n`);
    
    for (const key of keys) {
      const data = await client.get(key);
      if (data) {
        const query = JSON.parse(data);
        console.log(`Key: ${key}`);
        console.log(`Natural (Sanitized): ${query.naturalQuery}`);
        console.log(`SQL (Sanitized): ${query.sqlQuery.substring(0, 150)}...`);
        console.log(`Tables: ${query.tables.join(', ')}`);
        console.log('---\n');
        
        // Check for sensitive data
        const hasSensitive = 
          query.naturalQuery.includes('@') || 
          query.naturalQuery.includes('Acme') ||
          query.naturalQuery.includes('TechCorp') ||
          query.sqlQuery.includes('11111111-1111-1111-1111-111111111111') ||
          query.sqlQuery.includes('7c08fc98');
          
        if (hasSensitive) {
          console.error('⚠️  WARNING: Sensitive data found in stored query!');
        } else {
          console.log('✅ No sensitive data found in stored query');
        }
        console.log('='.repeat(80) + '\n');
      }
    }
    
    // Test retrieval with a new similar query
    console.log('Testing retrieval with similar query:\n');
    const examples = await getRelevantExamples('show me invoice data', 2);
    console.log(`Retrieved ${examples.length} examples:`);
    
    examples.forEach((ex, i) => {
      console.log(`\nExample ${i + 1}:`);
      console.log(`Natural: ${ex.naturalQuery}`);
      console.log(`SQL: ${ex.sqlQuery.substring(0, 100)}...`);
    });
    
    await client.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

testSanitizedStorage();