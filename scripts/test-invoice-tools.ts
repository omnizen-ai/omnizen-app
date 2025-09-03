#!/usr/bin/env npx tsx
import { createDatabaseTools } from '@/lib/tools/database-tools';

async function testInvoiceOperations() {
  console.log('🧪 Testing Invoice Operations with Database Tools\n');

  // Simulate user context from the chat route
  const userContext = {
    userId: 'test-user-123',
    orgId: '11111111-1111-1111-1111-111111111111', // Our test org
    workspaceId: undefined,
    role: 'admin',
  };

  const tools = createDatabaseTools(userContext);

  // Test 1: Query invoice using dbRead tool
  console.log('📖 Test 1: Querying invoice with dbRead tool...');
  try {
    const readResult = await tools.dbRead.execute({
      query: `
        SELECT 
          i.invoice_number,
          i.total_amount,
          i.status,
          c.display_name as customer_name
        FROM invoices i
        JOIN contacts c ON i.customer_id = c.id
        WHERE i.invoice_number = 'INV-001'
      `,
      explain: false,
    });
    
    if (readResult.success) {
      console.log('✅ Query successful!');
      console.log('   Data:', readResult.data);
      console.log('   Execution time:', readResult.executionTime, 'ms');
    } else {
      console.log('❌ Query failed:', readResult.error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }

  // Test 2: Get schema information
  console.log('\n📊 Test 2: Getting invoice schema...');
  try {
    const schemaResult = await tools.schemaInfo.execute({
      tables: ['invoices', 'contacts'],
      intent: 'update invoice',
      includeRelationships: true,
    });
    
    if (schemaResult.success && schemaResult.schema) {
      console.log('✅ Schema retrieved!');
      console.log(`   Found ${schemaResult.schema.length} tables`);
      schemaResult.schema.forEach((table: any) => {
        console.log(`   - ${table.tableName}: ${table.columns?.length || 0} columns`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }

  // Test 3: Update invoice (with preview first)
  console.log('\n✏️ Test 3: Updating invoice amount...');
  
  // First, preview what would be affected
  const updateQuery = `
    UPDATE invoices 
    SET 
      total_amount = 2000.00,
      balance_due = 2000.00,
      subtotal = 2000.00,
      status = 'sent',
      updated_at = NOW()
    WHERE invoice_number = 'INV-001'
  `;

  try {
    // Preview the update
    console.log('   Preview mode...');
    const previewResult = await tools.dbWrite.execute({
      query: updateQuery,
      preview: true,
      confirm: false,
    });
    
    if (previewResult.preview) {
      console.log('   Preview result:', previewResult);
    }

    // Now execute the actual update
    console.log('   Executing update...');
    const updateResult = await tools.dbWrite.execute({
      query: updateQuery,
      preview: false,
      confirm: true,
    });
    
    if (updateResult.success) {
      console.log('✅ Update successful!');
      console.log('   Rows affected:', updateResult.rowsAffected);
      console.log('   Execution time:', updateResult.executionTime, 'ms');
    } else {
      console.log('❌ Update failed:', updateResult.error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }

  // Test 4: Verify the update
  console.log('\n🔍 Test 4: Verifying update...');
  try {
    const verifyResult = await tools.dbRead.execute({
      query: `
        SELECT 
          invoice_number,
          total_amount,
          status,
          updated_at
        FROM invoices
        WHERE invoice_number = 'INV-001'
      `,
      explain: false,
    });
    
    if (verifyResult.success) {
      console.log('✅ Verification query successful!');
      console.log('   Updated data:', verifyResult.data);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }

  // Test 5: Test dangerous operation blocking
  console.log('\n🛡️ Test 5: Testing safety - attempting DROP TABLE...');
  try {
    const dangerousResult = await tools.dbWrite.execute({
      query: 'DROP TABLE invoices',
      preview: false,
      confirm: true,
    });
    
    if (!dangerousResult.success && dangerousResult.error?.includes('Forbidden')) {
      console.log('✅ Dangerous operation correctly blocked!');
      console.log('   Error:', dangerousResult.error);
    } else {
      console.log('❌ WARNING: Dangerous operation was not blocked!');
    }
  } catch (error) {
    console.error('✅ Operation blocked:', error);
  }

  // Test 6: Test SQL injection prevention
  console.log('\n🛡️ Test 6: Testing SQL injection prevention...');
  try {
    const injectionResult = await tools.dbRead.execute({
      query: "SELECT * FROM invoices WHERE invoice_number = 'INV-001'; DROP TABLE invoices; --",
      explain: false,
    });
    
    if (!injectionResult.success) {
      console.log('✅ SQL injection attempt blocked!');
      console.log('   Error:', injectionResult.error);
    } else {
      console.log('❌ WARNING: SQL injection was not blocked!');
    }
  } catch (error) {
    console.error('✅ Injection blocked:', error);
  }

  console.log('\n✨ All tests completed!');
  process.exit(0);
}

testInvoiceOperations().catch(console.error);