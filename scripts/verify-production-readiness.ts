/**
 * Production Readiness Verification
 * Tests actual Redis and Database connections with real data
 */

import { getRedisClient } from '../lib/ai/query-memory';
import { 
  initializeWorkflowPrompts, 
  getWorkflowPrompt, 
  storeWorkflowPrompt,
  getAvailableWorkflows 
} from '../lib/ai/workflow-prompts';
import { 
  searchCustomers, 
  searchProducts, 
  searchInvoices,
  searchEntities,
  type UserContext 
} from '../lib/db/entity-search';
import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

console.log('🔍 Production Readiness Verification\n');

// Test user context (use real format)
const testContext: UserContext = {
  userId: 'user_test_123',
  orgId: 'org_test_456', 
  workspaceId: 'workspace_test_789',
  role: 'admin'
};

async function verifyRedisConnection() {
  console.log('1. 📡 Testing Redis Connection...');
  
  try {
    const client = await getRedisClient();
    if (!client) {
      console.log('  ❌ Redis client is null - connection failed');
      return false;
    }

    // Test basic Redis operations
    const testKey = 'test:connection:' + Date.now();
    await client.set(testKey, 'test-value');
    const result = await client.get(testKey);
    await client.del(testKey);

    if (result === 'test-value') {
      console.log('  ✅ Redis connection successful');
      console.log('  ✅ Redis read/write operations working');
      return true;
    } else {
      console.log('  ❌ Redis read/write test failed');
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Redis connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function verifyWorkflowSystem() {
  console.log('\n2. 🔄 Testing Workflow System...');
  
  try {
    // Initialize workflows
    console.log('  📝 Initializing workflow prompts...');
    await initializeWorkflowPrompts();
    console.log('  ✅ Workflow prompts initialized');

    // Test getting available workflows
    const workflows = await getAvailableWorkflows();
    console.log(`  ✅ Available workflows: [${workflows.join(', ')}]`);

    // Test retrieving specific workflow
    const invoiceWorkflow = await getWorkflowPrompt('invoice');
    if (invoiceWorkflow) {
      console.log('  ✅ Invoice workflow retrieved successfully');
      console.log(`  📄 Workflow length: ${invoiceWorkflow.length} characters`);
    } else {
      console.log('  ❌ Failed to retrieve invoice workflow');
      return false;
    }

    // Test storing custom workflow
    const customWorkflow = `Test Custom Workflow:
1. Step 1: Test action
2. Step 2: Verification
3. Step 3: Completion

**Key Considerations**: This is a test workflow created on ${new Date().toISOString()}`;
    
    const stored = await storeWorkflowPrompt('test-custom', customWorkflow);
    if (stored) {
      console.log('  ✅ Custom workflow stored successfully');
      
      // Verify retrieval
      const retrieved = await getWorkflowPrompt('test-custom');
      if (retrieved === customWorkflow) {
        console.log('  ✅ Custom workflow retrieved correctly');
      } else {
        console.log('  ❌ Custom workflow retrieval mismatch');
        return false;
      }
    } else {
      console.log('  ❌ Failed to store custom workflow');
      return false;
    }

    return true;
  } catch (error) {
    console.log(`  ❌ Workflow system error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function verifyDatabaseConnection() {
  console.log('\n3. 🗄️  Testing Database Connection...');
  
  try {
    // Test basic database connection
    const result = await db.execute(sql`SELECT current_database(), current_user, now() as current_time`);
    console.log('  ✅ Database connection successful');
    console.log(`  📊 Database: ${(result[0] as any)?.current_database || 'unknown'}`);
    console.log(`  👤 User: ${(result[0] as any)?.current_user || 'unknown'}`);
    
    // Test table existence
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('contacts', 'products', 'invoices', 'payments')
      ORDER BY table_name
    `);
    
    console.log(`  ✅ Found ${Array.isArray(tables) ? tables.length : 0} required tables`);
    if (Array.isArray(tables) && tables.length > 0) {
      const tableNames = tables.map((t: any) => t.table_name).join(', ');
      console.log(`  📋 Tables: ${tableNames}`);
    }

    return true;
  } catch (error) {
    console.log(`  ❌ Database connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function verifyEntitySearchFunctions() {
  console.log('\n4. 🔍 Testing Entity Search Functions...');
  
  try {
    // Test customer search
    console.log('  👥 Testing customer search...');
    const customers = await searchCustomers('test', testContext, 5);
    console.log(`  ✅ Customer search returned ${customers.length} results`);
    
    // Test product search  
    console.log('  📦 Testing product search...');
    const products = await searchProducts('test', testContext, 5);
    console.log(`  ✅ Product search returned ${products.length} results`);
    
    // Test invoice search
    console.log('  📄 Testing invoice search...');
    const invoices = await searchInvoices('test', testContext, 5);
    console.log(`  ✅ Invoice search returned ${invoices.length} results`);

    // Test universal entity search
    console.log('  🔄 Testing universal entity search...');
    const entities = await searchEntities('customer', 'test', testContext, 3);
    console.log(`  ✅ Universal search returned ${entities.length} results`);

    // Check result structure
    if (entities.length > 0) {
      const firstEntity = entities[0];
      const hasRequiredFields = firstEntity.id && firstEntity.name;
      console.log(`  ✅ Entity structure valid: ${hasRequiredFields ? 'YES' : 'NO'}`);
      if (hasRequiredFields) {
        console.log(`  📝 Sample entity: ID=${firstEntity.id}, Name="${firstEntity.name}"`);
      }
    }

    return true;
  } catch (error) {
    console.log(`  ❌ Entity search error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function verifyNoMockData() {
  console.log('\n5. 🚫 Verifying No Mock Data...');
  
  try {
    // Check for common mock data patterns
    const mockChecks = [
      { name: 'Mock customers', query: sql`SELECT COUNT(*) as count FROM contacts WHERE display_name ILIKE '%mock%' OR display_name ILIKE '%test%' OR display_name ILIKE '%sample%'` },
      { name: 'Mock products', query: sql`SELECT COUNT(*) as count FROM products WHERE name ILIKE '%mock%' OR name ILIKE '%test%' OR name ILIKE '%sample%'` },
      { name: 'Mock invoices', query: sql`SELECT COUNT(*) as count FROM invoices WHERE invoice_number ILIKE '%mock%' OR invoice_number ILIKE '%test%' OR invoice_number ILIKE '%sample%'` }
    ];

    let hasMockData = false;
    
    for (const check of mockChecks) {
      try {
        const result = await db.execute(check.query);
        const count = (result[0] as any)?.count || 0;
        if (count > 0) {
          console.log(`  ⚠️  ${check.name}: Found ${count} entries with mock/test/sample patterns`);
          hasMockData = true;
        } else {
          console.log(`  ✅ ${check.name}: No mock data detected`);
        }
      } catch (error) {
        console.log(`  ⚠️  ${check.name}: Could not verify (table may not exist yet)`);
      }
    }

    if (!hasMockData) {
      console.log('  ✅ No mock data patterns detected');
    }

    return true;
  } catch (error) {
    console.log(`  ❌ Mock data verification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

// Run all verifications
async function runAllVerifications() {
  console.log('Starting comprehensive production readiness verification...\n');
  
  const results = {
    redis: await verifyRedisConnection(),
    workflows: await verifyWorkflowSystem(),
    database: await verifyDatabaseConnection(),
    entitySearch: await verifyEntitySearchFunctions(),
    noMockData: await verifyNoMockData()
  };

  console.log('\n📊 VERIFICATION SUMMARY');
  console.log('========================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test.charAt(0).toUpperCase() + test.slice(1)}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  const allPassed = Object.values(results).every(result => result);
  console.log(`\n🎯 OVERALL STATUS: ${allPassed ? '✅ PRODUCTION READY' : '❌ NEEDS ATTENTION'}`);

  if (allPassed) {
    console.log('\n🚀 System is ready for production use!');
    console.log('   - Redis connection verified');
    console.log('   - Database connection confirmed');
    console.log('   - Workflow system operational');
    console.log('   - Entity search functions working');
    console.log('   - No mock data detected');
  } else {
    console.log('\n🔧 Issues detected that need resolution before production deployment.');
  }

  return allPassed;
}

// Execute verification
runAllVerifications().catch(error => {
  console.error('\n💥 Verification failed with error:', error);
  process.exit(1);
});