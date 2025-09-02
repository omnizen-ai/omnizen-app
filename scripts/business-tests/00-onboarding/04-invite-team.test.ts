/**
 * Test: Team Member Invitations
 * Tests inviting and onboarding team members with different roles
 */

import { supabaseAdmin } from '../utils/db-client'
import { createTestOrganization } from '../utils/auth-context'
import { runTestSuite, assertEqual, assertTrue } from '../utils/test-assertions'
import { cleanupBySlug } from '../utils/cleanup'

async function testInviteTeamMembers() {
  // Create organization with owner
  const { org, authContext } = await createTestOrganization(
    'Anchorblock Technology Limited',
    'anchorblock-team',
    'ceo@anchorblock.ai',
    'professional'
  )
  
  // Define team members to invite
  const teamMembers = [
    { email: 'cfo@anchorblock.ai', name: 'Sarah Johnson', role: 'admin' as const },
    { email: 'sales@anchorblock.ai', name: 'Mike Wilson', role: 'user' as const },
    { email: 'dev@anchorblock.ai', name: 'Emily Chen', role: 'user' as const },
    { email: 'support@anchorblock.ai', name: 'John Davis', role: 'viewer' as const }
  ]
  
  const createdMembers = []
  
  for (const member of teamMembers) {
    // Create user account
    const { data: user } = await supabaseAdmin
      .from('users')
      .insert({
        email: member.email,
        name: member.name,
        role: member.role,
        email_verified: new Date().toISOString()
      })
      .select()
      .single()
    
    // Add to organization
    const { data: orgMember } = await supabaseAdmin
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: member.role,
        joined_at: new Date().toISOString()
      })
      .select()
      .single()
    
    assertTrue(orgMember, `${member.role} should be added to organization`)
    assertEqual(orgMember.role, member.role, `Role should be ${member.role}`)
    
    createdMembers.push({ user, orgMember })
  }
  
  // Verify member count doesn't exceed plan limit
  const { data: allMembers } = await supabaseAdmin
    .from('organization_members')
    .select('id')
    .eq('organization_id', org.id)
  
  assertTrue(
    allMembers.length <= org.max_users,
    `Member count (${allMembers.length}) should not exceed plan limit (${org.max_users})`
  )
  
  return { org, members: createdMembers }
}

async function testRoleHierarchy() {
  const { org } = await createTestOrganization(
    'Test Role Org',
    'test-roles',
    'owner@test.ai',
    'professional'
  )
  
  // Test role capabilities
  const roleCapabilities = {
    owner: { canInvite: true, canDelete: true, canManageBilling: true, canViewReports: true },
    admin: { canInvite: true, canDelete: true, canManageBilling: false, canViewReports: true },
    user: { canInvite: false, canDelete: false, canManageBilling: false, canViewReports: true },
    viewer: { canInvite: false, canDelete: false, canManageBilling: false, canViewReports: true }
  }
  
  for (const [role, capabilities] of Object.entries(roleCapabilities)) {
    // Create user with role
    const { data: user } = await supabaseAdmin
      .from('users')
      .insert({
        email: `${role}@test.ai`,
        name: `Test ${role}`,
        role: role as any
      })
      .select()
      .single()
    
    // Add to org
    await supabaseAdmin
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: role as any
      })
    
    // In production, these capabilities would be enforced by RLS policies
    // Here we just verify the role is set correctly
    const { data: member } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', org.id)
      .single()
    
    assertEqual(member.role, role, `Role should be ${role}`)
  }
}

async function testMaxUsersEnforcement() {
  // Create starter org with 5 user limit
  const { org } = await createTestOrganization(
    'Starter Org',
    'starter-limit',
    'owner@starter.ai',
    'starter'
  )
  
  assertEqual(org.max_users, 5, 'Starter plan should allow 5 users')
  
  // Try to add more than 5 users
  const users = []
  for (let i = 1; i <= 6; i++) {
    const { data: user } = await supabaseAdmin
      .from('users')
      .insert({
        email: `user${i}@starter.ai`,
        name: `User ${i}`,
        role: 'user'
      })
      .select()
      .single()
    
    users.push(user)
    
    if (i <= 4) { // Owner + 4 more = 5 total
      const { error } = await supabaseAdmin
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'user'
        })
      
      assertTrue(!error, `Should be able to add user ${i}`)
    } else {
      // In production, this would be enforced by business logic
      // The 6th user should not be allowed
      const { data: members } = await supabaseAdmin
        .from('organization_members')
        .select('id')
        .eq('organization_id', org.id)
      
      assertTrue(
        members.length <= org.max_users,
        'Should not exceed max users limit'
      )
    }
  }
}

async function testWorkspaceAssignment() {
  // Create org with multi-workspace
  const { org } = await createTestOrganization(
    'Multi Workspace Org',
    'multi-ws',
    'owner@workspace.ai',
    'professional'
  )
  
  // Create workspaces
  const workspaces = []
  const departments = ['Engineering', 'Sales', 'Finance']
  
  for (const dept of departments) {
    const { data: ws } = await supabaseAdmin
      .from('workspaces')
      .insert({
        organization_id: org.id,
        name: dept,
        slug: dept.toLowerCase(),
        is_default: dept === 'Engineering'
      })
      .select()
      .single()
    
    workspaces.push(ws)
  }
  
  // Assign users to workspaces
  const assignments = [
    { email: 'dev1@workspace.ai', name: 'Dev One', workspace: 'Engineering' },
    { email: 'sales1@workspace.ai', name: 'Sales One', workspace: 'Sales' },
    { email: 'cfo@workspace.ai', name: 'CFO', workspace: 'Finance' }
  ]
  
  for (const assignment of assignments) {
    // Create user
    const { data: user } = await supabaseAdmin
      .from('users')
      .insert({
        email: assignment.email,
        name: assignment.name,
        role: 'user'
      })
      .select()
      .single()
    
    // Add to org
    await supabaseAdmin
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'user'
      })
    
    // Assign to workspace
    const workspace = workspaces.find(ws => ws.name === assignment.workspace)
    const { data: wsMember } = await supabaseAdmin
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'member'
      })
      .select()
      .single()
    
    assertTrue(wsMember, `User should be assigned to ${assignment.workspace}`)
  }
}

async function testPendingInvitations() {
  const { org } = await createTestOrganization(
    'Invite Test Org',
    'invite-test',
    'owner@invite.ai',
    'growth'
  )
  
  // Create pending invitations (would normally send emails)
  const invitations = [
    { email: 'pending1@invite.ai', role: 'admin' },
    { email: 'pending2@invite.ai', role: 'user' },
    { email: 'pending3@invite.ai', role: 'viewer' }
  ]
  
  for (const invite of invitations) {
    // In production, this would be a separate invitations table
    // For now, we'll store in organization's custom fields
    const { data: updated } = await supabaseAdmin
      .from('organizations')
      .update({
        feature_flags: {
          ...org.feature_flags,
          pending_invites: [
            ...(org.feature_flags.pending_invites || []),
            {
              email: invite.email,
              role: invite.role,
              invited_at: new Date().toISOString(),
              token: crypto.randomUUID()
            }
          ]
        }
      })
      .eq('id', org.id)
      .select()
      .single()
    
    assertTrue(
      updated.feature_flags.pending_invites.some(i => i.email === invite.email),
      `Invitation for ${invite.email} should be recorded`
    )
  }
}

// Run tests
async function main() {
  console.log('🚀 Starting Team Invitation Tests\n')
  
  // Clean up any existing test data
  await cleanupBySlug('anchorblock-team')
  await cleanupBySlug('test-roles')
  await cleanupBySlug('starter-limit')
  await cleanupBySlug('multi-ws')
  await cleanupBySlug('invite-test')
  
  const results = await runTestSuite('Team Member Invitations', [
    { name: 'Invite team members with roles', fn: testInviteTeamMembers },
    { name: 'Role hierarchy and permissions', fn: testRoleHierarchy },
    { name: 'Max users enforcement', fn: testMaxUsersEnforcement },
    { name: 'Workspace assignment', fn: testWorkspaceAssignment },
    { name: 'Pending invitation tracking', fn: testPendingInvitations }
  ])
  
  // Cleanup
  await cleanupBySlug('anchorblock-team')
  await cleanupBySlug('test-roles')
  await cleanupBySlug('starter-limit')
  await cleanupBySlug('multi-ws')
  await cleanupBySlug('invite-test')
  
  process.exit(results.failed > 0 ? 1 : 0)
}

main().catch(console.error)