/**
 * Test script to verify that setAuthContext works correctly from the application
 */

import { db, setAuthContext } from '../lib/db';
import { sql } from 'drizzle-orm';

async function testAppAuthContext() {
  console.log('🧪 Testing Application Auth Context');
  console.log('====================================');

  try {
    // 1. Test setting auth context through application function
    console.log('1. Setting auth context via setAuthContext...');
    await setAuthContext(
      'c0b5dc0f-b260-40f3-9de0-b5cd388b1ffa',
      '11111111-1111-1111-1111-111111111111',
      undefined,
      'admin'
    );
    console.log('✅ setAuthContext called');

    // 2. Verify auth context is set by querying the session variables
    console.log('\n2. Verifying auth context...');
    const authCheck = await db.execute(sql`
      SELECT 
        current_setting('auth.user_id', true) as user_id,
        current_setting('auth.org_id', true) as org_id,
        current_setting('auth.role', true) as role,
        auth_user_id() as auth_user_id_func,
        auth_org_id() as auth_org_id_func
    `);
    
    console.log('Session variables:', authCheck[0]);

    // 3. Test INSERT with the current auth context
    console.log('\n3. Testing INSERT with current auth context...');
    const insertResult = await db.execute(sql`
      INSERT INTO invoices (invoice_number, customer_id, issue_date, due_date, currency_code, subtotal, tax_amount, total_amount, balance_due, status) 
      VALUES (
        'INV-APP-TEST-001',
        'd80e0f90-9556-4702-aa3f-68693c495681',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        'BDT',
        15000.00,
        0.00,
        15000.00,
        15000.00,
        'draft'
      )
      RETURNING id, organization_id, invoice_number
    `);

    console.log('✅ INSERT successful:', insertResult[0]);

    // 4. Clean up
    console.log('\n4. Cleaning up...');
    await db.execute(sql`
      DELETE FROM invoices WHERE invoice_number = 'INV-APP-TEST-001'
    `);
    console.log('✅ Cleanup complete');

    console.log('\n🎉 Application auth context test passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testAppAuthContext()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}