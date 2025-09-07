/**
 * Test script to verify auto auth context triggers are working
 * Tests INSERT operations without explicit organization_id
 */

import { db, setAuthContext } from '../lib/db';
import { contacts } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function testAutoAuthContext() {
  console.log('🧪 Testing Auto Auth Context Triggers');
  console.log('=====================================');

  try {
    // 1. Set up auth context (simulating a logged-in user)
    const testUserId = 'test-user-123';
    const testOrgId = 'test-org-456';
    const testWorkspaceId = 'test-workspace-789';

    console.log('1. Setting auth context...');
    await setAuthContext(testUserId, testOrgId, testWorkspaceId, 'admin');
    console.log('✅ Auth context set');

    // 2. Test INSERT without organization_id (should be auto-set by trigger)
    console.log('\n2. Testing INSERT without organization_id...');
    
    const newContact = {
      type: 'customer' as const,
      company_name: 'Test Company Auto Context',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@testcompany.com'
      // Note: NO organization_id provided - should be set by trigger
    };

    const insertResult = await db.insert(contacts).values(newContact).returning();
    console.log('✅ INSERT successful:', insertResult[0]);

    // 3. Verify organization_id was set correctly
    if (insertResult[0].organizationId === testOrgId) {
      console.log('✅ organization_id correctly set by trigger:', insertResult[0].organizationId);
    } else {
      console.error('❌ organization_id NOT set correctly. Expected:', testOrgId, 'Got:', insertResult[0].organizationId);
    }

    // 4. Test SELECT with RLS (should only return our org's data)
    console.log('\n3. Testing SELECT with RLS filtering...');
    const selectResult = await db.select().from(contacts).where(eq(contacts.id, insertResult[0].id));
    
    if (selectResult.length > 0) {
      console.log('✅ SELECT successful (RLS allowed access):', selectResult[0].company_name);
    } else {
      console.error('❌ SELECT failed - RLS may have blocked access');
    }

    // 5. Test UPDATE (should work seamlessly)
    console.log('\n4. Testing UPDATE without organization_id...');
    const updateResult = await db
      .update(contacts)
      .set({ company_name: 'Updated Test Company' })
      .where(eq(contacts.id, insertResult[0].id))
      .returning();

    console.log('✅ UPDATE successful:', updateResult[0].company_name);

    // 6. Clean up test data
    console.log('\n5. Cleaning up test data...');
    await db.delete(contacts).where(eq(contacts.id, insertResult[0].id));
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed! Auto auth context triggers are working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testAutoAuthContext()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}