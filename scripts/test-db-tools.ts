#!/usr/bin/env npx tsx
import { createDatabaseTools } from '@/lib/tools/database-tools';
import { db } from '@/lib/db';

async function testDatabaseTools() {
  console.log('Testing Database Tools Integration...\n');

  // Test user context
  const testContext = {
    userId: 'test-user-123',
    orgId: 'test-org-456',
    workspaceId: 'test-workspace-789',
    role: 'admin',
  };

  const tools = createDatabaseTools(testContext);
  console.log('✅ Database tools created successfully');
  console.log('Available tools:', Object.keys(tools));

  // Test 1: Schema Info Tool
  console.log('\n📊 Testing Schema Info Tool...');
  try {
    const schemaResult = await tools.schemaInfo.execute({
      tables: ['customers', 'invoices'],
      includeRelationships: true,
    });
    console.log('✅ Schema info retrieved:', schemaResult.success ? 'Success' : 'Failed');
    if (schemaResult.success && schemaResult.schema) {
      console.log(`  - Found ${schemaResult.schema.length} tables`);
    }
  } catch (error) {
    console.error('❌ Schema info failed:', error);
  }

  // Test 2: Views List Tool
  console.log('\n📋 Testing Views List Tool...');
  try {
    const viewsResult = await tools.viewsList.execute({
      domain: 'finance',
    });
    console.log('✅ Views list retrieved:', viewsResult.success ? 'Success' : 'Failed');
    if (viewsResult.success && viewsResult.views) {
      console.log(`  - Found ${viewsResult.views.length} views`);
    }
  } catch (error) {
    console.error('❌ Views list failed:', error);
  }

  // Test 3: DB Read Tool (safe query)
  console.log('\n📖 Testing DB Read Tool...');
  try {
    const readResult = await tools.dbRead.execute({
      query: 'SELECT COUNT(*) as total FROM organizations',
      explain: false,
    });
    console.log('✅ Read query executed:', readResult.success ? 'Success' : 'Failed');
    if (readResult.success) {
      console.log(`  - Rows returned: ${readResult.rowCount}`);
      console.log(`  - Execution time: ${readResult.executionTime}ms`);
    }
  } catch (error) {
    console.error('❌ Read query failed:', error);
  }

  // Test 4: Query Explain Tool
  console.log('\n🔍 Testing Explain Query Tool...');
  try {
    const explainResult = await tools.explainQuery.execute({
      query: 'SELECT * FROM customers WHERE name LIKE \'%test%\'',
      analyze: false,
    });
    console.log('✅ Query explained:', explainResult.success ? 'Success' : 'Failed');
  } catch (error) {
    console.error('❌ Query explain failed:', error);
  }

  // Test 5: SQL Validation (dangerous query)
  console.log('\n🛡️ Testing SQL Safety Validation...');
  try {
    const dangerousResult = await tools.dbWrite.execute({
      query: 'DROP TABLE customers',
      preview: true,
      confirm: false,
    });
    console.log('Result:', dangerousResult);
    if (!dangerousResult.success && dangerousResult.error?.includes('Forbidden')) {
      console.log('✅ Dangerous operation correctly blocked');
    } else {
      console.log('❌ Dangerous operation was not blocked!');
    }
  } catch (error) {
    console.error('✅ Dangerous operation blocked with error:', error);
  }

  console.log('\n✨ Database tools testing complete!');
  process.exit(0);
}

testDatabaseTools().catch(console.error);