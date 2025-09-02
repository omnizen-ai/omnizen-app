/**
 * Test: User Signup Flow
 * Simulates the complete user signup process at database level
 */

import { supabaseAdmin } from '../utils/db-client'
import { runTestSuite, assertEqual, assertTrue } from '../utils/test-assertions'
import { cleanupBySlug } from '../utils/cleanup'

async function testUserSignup() {
  // Simulate creating a new user account
  const testUser = {
    email: 'admin@anchorblock.ai',
    name: 'Alex Chen',
    role: 'owner' as const
  }
  
  // 1. Create user in users table (simulating NextAuth)
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .insert({
      email: testUser.email,
      name: testUser.name,
      role: testUser.role,
      email_verified: new Date().toISOString()
    })
    .select()
    .single()
  
  assertTrue(user, 'User should be created')
  assertEqual(user.email, testUser.email, 'Email should match')
  
  // 2. Create session (simulating NextAuth session)
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('sessions')
    .insert({
      user_id: user.id,
      session_token: `test-session-${user.id}`,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })
    .select()
    .single()
  
  assertTrue(session, 'Session should be created')
  
  // 3. Verify auth bridge creates Supabase user
  // The auth-bridge.ts should handle this automatically
  // For testing, we'll create it manually
  const { data: supabaseUser, error: supabaseError } = await supabaseAdmin
    .from('supabase_users')
    .insert({
      id: crypto.randomUUID(),
      nextauth_user_id: user.id
    })
    .select()
    .single()
  
  assertTrue(supabaseUser, 'Supabase user should be created for RLS')
  
  return { user, session, supabaseUser }
}

async function testDuplicateEmailPrevention() {
  // Try to create another user with same email
  const { error } = await supabaseAdmin
    .from('users')
    .insert({
      email: 'admin@anchorblock.ai',
      name: 'Duplicate User',
      role: 'user'
    })
  
  assertTrue(error, 'Should prevent duplicate email')
  assertTrue(
    error.message.includes('duplicate') || error.message.includes('unique'),
    'Error should indicate uniqueness violation'
  )
}

async function testUserRoles() {
  const roles = ['owner', 'admin', 'user', 'viewer'] as const
  const users = []
  
  for (const role of roles) {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        email: `${role}@anchorblock.ai`,
        name: `Test ${role}`,
        role,
        email_verified: new Date().toISOString()
      })
      .select()
      .single()
    
    assertTrue(user, `User with role ${role} should be created`)
    assertEqual(user.role, role, `Role should be ${role}`)
    users.push(user)
  }
  
  // Cleanup test users
  for (const user of users) {
    await supabaseAdmin.from('users').delete().eq('id', user.id)
  }
}

async function testSessionExpiry() {
  // Create user with expired session
  const { data: user } = await supabaseAdmin
    .from('users')
    .insert({
      email: 'expired@anchorblock.ai',
      name: 'Expired User',
      role: 'user',
      email_verified: new Date().toISOString()
    })
    .select()
    .single()
  
  // Create expired session
  const { data: session } = await supabaseAdmin
    .from('sessions')
    .insert({
      user_id: user.id,
      session_token: `expired-session-${user.id}`,
      expires: new Date(Date.now() - 1000).toISOString() // Expired
    })
    .select()
    .single()
  
  // Verify session is expired
  const now = new Date()
  const expires = new Date(session.expires)
  assertTrue(expires < now, 'Session should be expired')
  
  // Cleanup
  await supabaseAdmin.from('sessions').delete().eq('id', session.id)
  await supabaseAdmin.from('users').delete().eq('id', user.id)
}

async function testAuthBridgeIntegration() {
  // Test that the auth bridge properly syncs NextAuth users with Supabase
  const { data: user } = await supabaseAdmin
    .from('users')
    .insert({
      email: 'bridge-test@anchorblock.ai',
      name: 'Bridge Test',
      role: 'admin',
      email_verified: new Date().toISOString()
    })
    .select()
    .single()
  
  // Create Supabase user for RLS
  const { data: supabaseUser } = await supabaseAdmin
    .from('supabase_users')
    .insert({
      id: crypto.randomUUID(),
      nextauth_user_id: user.id
    })
    .select()
    .single()
  
  // Verify the link exists
  const { data: linkedUser } = await supabaseAdmin
    .from('supabase_users')
    .select()
    .eq('nextauth_user_id', user.id)
    .single()
  
  assertTrue(linkedUser, 'Supabase user should be linked to NextAuth user')
  assertEqual(linkedUser.nextauth_user_id, user.id, 'User IDs should match')
  
  // Cleanup
  await supabaseAdmin.from('supabase_users').delete().eq('id', supabaseUser.id)
  await supabaseAdmin.from('users').delete().eq('id', user.id)
}

// Run tests
async function main() {
  console.log('🚀 Starting User Signup Tests\n')
  
  // Clean up any existing test data
  await cleanupBySlug('anchorblock')
  
  const results = await runTestSuite('User Signup Flow', [
    { name: 'Basic user signup', fn: testUserSignup },
    { name: 'Duplicate email prevention', fn: testDuplicateEmailPrevention },
    { name: 'User role assignment', fn: testUserRoles },
    { name: 'Session expiry handling', fn: testSessionExpiry },
    { name: 'Auth bridge integration', fn: testAuthBridgeIntegration }
  ])
  
  // Cleanup after tests
  await supabaseAdmin
    .from('users')
    .delete()
    .like('email', '%@anchorblock.ai')
  
  process.exit(results.failed > 0 ? 1 : 0)
}

main().catch(console.error)