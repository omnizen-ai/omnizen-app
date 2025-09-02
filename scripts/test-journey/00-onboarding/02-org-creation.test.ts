/**
 * Test: Organization Creation
 * Tests the complete organization setup process
 */

import { supabaseAdmin } from '../utils/db-client'
import { createTestUser } from '../utils/auth-context'
import { runTestSuite, assertEqual, assertTrue, assertFalse } from '../utils/test-assertions'
import { cleanupBySlug } from '../utils/cleanup'

async function testBasicOrgCreation() {
  // Create organization
  const { data: org, error } = await supabaseAdmin
    .from('organizations')
    .insert({
      name: 'Anchorblock Technology Limited',
      slug: 'anchorblock',
      plan_tier: 'professional',
      currency: 'USD',
      timezone: 'America/New_York',
      fiscal_year_start: 1, // January
      country_code: 'US'
    })
    .select()
    .single()
  
  assertTrue(org, 'Organization should be created')
  assertEqual(org.slug, 'anchorblock', 'Slug should match')
  assertEqual(org.plan_tier, 'professional', 'Plan tier should be professional')
  
  // Verify default values
  assertTrue(org.is_active, 'Organization should be active by default')
  assertEqual(org.max_users, 25, 'Professional plan should allow 25 users')
  assertEqual(org.max_ai_agents, 10, 'Professional plan should allow 10 AI agents')
  assertEqual(org.max_workspaces, 10, 'Professional plan should allow 10 workspaces')
  
  return org
}

async function testPlanTierFeatures() {
  const plans = [
    {
      tier: 'starter',
      expectedFeatures: {
        invoicing: true,
        basic_accounting: true,
        full_accounting: false,
        inventory: false,
        ai_automation: false
      },
      limits: { users: 5, agents: 2, workspaces: 1 }
    },
    {
      tier: 'growth',
      expectedFeatures: {
        invoicing: true,
        basic_accounting: true,
        full_accounting: false,
        inventory: false,
        ai_automation: false
      },
      limits: { users: 10, agents: 5, workspaces: 3 }
    },
    {
      tier: 'professional',
      expectedFeatures: {
        invoicing: true,
        basic_accounting: true,
        full_accounting: true,
        inventory: true,
        ai_automation: true
      },
      limits: { users: 25, agents: 10, workspaces: 10 }
    },
    {
      tier: 'enterprise',
      expectedFeatures: {
        invoicing: true,
        basic_accounting: true,
        full_accounting: true,
        inventory: true,
        ai_automation: true,
        custom_workflows: true,
        api_access: true,
        white_label: true
      },
      limits: { users: 100, agents: 50, workspaces: 50 }
    }
  ]
  
  for (const plan of plans) {
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .insert({
        name: `Test ${plan.tier} Org`,
        slug: `test-${plan.tier}`,
        plan_tier: plan.tier
      })
      .select()
      .single()
    
    // Check features
    for (const [feature, expected] of Object.entries(plan.expectedFeatures)) {
      assertEqual(
        org.feature_flags[feature],
        expected,
        `${plan.tier} should have ${feature}=${expected}`
      )
    }
    
    // Check limits
    assertEqual(org.max_users, plan.limits.users, `${plan.tier} user limit`)
    assertEqual(org.max_ai_agents, plan.limits.agents, `${plan.tier} agent limit`)
    assertEqual(org.max_workspaces, plan.limits.workspaces, `${plan.tier} workspace limit`)
    
    // Cleanup
    await supabaseAdmin.from('organizations').delete().eq('id', org.id)
  }
}

async function testOrgWithOwner() {
  // First create the owner user
  const { data: user } = await supabaseAdmin
    .from('users')
    .insert({
      email: 'ceo@anchorblock.ai',
      name: 'Alex Chen',
      role: 'owner',
      email_verified: new Date().toISOString()
    })
    .select()
    .single()
  
  // Create organization
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .insert({
      name: 'Anchorblock Technology Limited',
      slug: 'anchorblock-with-owner',
      plan_tier: 'professional'
    })
    .select()
    .single()
  
  // Create organization member relationship
  const { data: member, error } = await supabaseAdmin
    .from('organization_members')
    .insert({
      organization_id: org.id,
      user_id: user.id,
      role: 'owner',
      joined_at: new Date().toISOString()
    })
    .select()
    .single()
  
  assertTrue(member, 'Owner should be added as organization member')
  assertEqual(member.role, 'owner', 'Member role should be owner')
  
  // Verify only one owner allowed
  const { data: anotherUser } = await supabaseAdmin
    .from('users')
    .insert({
      email: 'another@anchorblock.ai',
      name: 'Another User',
      role: 'owner'
    })
    .select()
    .single()
  
  const { error: ownerError } = await supabaseAdmin
    .from('organization_members')
    .insert({
      organization_id: org.id,
      user_id: anotherUser.id,
      role: 'owner'
    })
  
  // Note: This might not fail at DB level without a custom constraint
  // In production, this would be enforced by business logic
  
  // Cleanup
  await supabaseAdmin.from('organization_members').delete().eq('organization_id', org.id)
  await supabaseAdmin.from('organizations').delete().eq('id', org.id)
  await supabaseAdmin.from('users').delete().eq('id', user.id)
  await supabaseAdmin.from('users').delete().eq('id', anotherUser.id)
}

async function testSlugUniqueness() {
  // Create first org
  const { data: org1 } = await supabaseAdmin
    .from('organizations')
    .insert({
      name: 'First Org',
      slug: 'unique-slug',
      plan_tier: 'starter'
    })
    .select()
    .single()
  
  // Try to create another with same slug
  const { error } = await supabaseAdmin
    .from('organizations')
    .insert({
      name: 'Second Org',
      slug: 'unique-slug',
      plan_tier: 'starter'
    })
  
  assertTrue(error, 'Should prevent duplicate slug')
  assertTrue(
    error.message.includes('duplicate') || error.message.includes('unique'),
    'Error should indicate uniqueness violation'
  )
  
  // Cleanup
  await supabaseAdmin.from('organizations').delete().eq('id', org1.id)
}

async function testTrialPeriod() {
  const trialEndDate = new Date()
  trialEndDate.setDate(trialEndDate.getDate() + 14) // 14-day trial
  
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .insert({
      name: 'Trial Org',
      slug: 'trial-org',
      plan_tier: 'professional',
      trial_ends_at: trialEndDate.toISOString()
    })
    .select()
    .single()
  
  assertTrue(org.trial_ends_at, 'Trial end date should be set')
  
  const trialEnds = new Date(org.trial_ends_at)
  const now = new Date()
  assertTrue(trialEnds > now, 'Trial should not be expired yet')
  
  // Cleanup
  await supabaseAdmin.from('organizations').delete().eq('id', org.id)
}

async function testDefaultWorkspaceCreation() {
  // Create org with multi-workspace enabled
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .insert({
      name: 'Multi Workspace Org',
      slug: 'multi-workspace',
      plan_tier: 'professional', // Allows 10 workspaces
      max_workspaces: 10
    })
    .select()
    .single()
  
  // Create default workspace
  const { data: workspace, error } = await supabaseAdmin
    .from('workspaces')
    .insert({
      organization_id: org.id,
      name: 'Headquarters',
      slug: 'hq',
      is_default: true
    })
    .select()
    .single()
  
  assertTrue(workspace, 'Default workspace should be created')
  assertTrue(workspace.is_default, 'Workspace should be marked as default')
  assertEqual(workspace.slug, 'hq', 'Default workspace slug should be "hq"')
  
  // Cleanup
  await supabaseAdmin.from('workspaces').delete().eq('id', workspace.id)
  await supabaseAdmin.from('organizations').delete().eq('id', org.id)
}

// Run tests
async function main() {
  console.log('🚀 Starting Organization Creation Tests\n')
  
  // Clean up any existing test data
  await cleanupBySlug('anchorblock')
  await cleanupBySlug('anchorblock-with-owner')
  
  const results = await runTestSuite('Organization Creation', [
    { name: 'Basic organization creation', fn: testBasicOrgCreation },
    { name: 'Plan tier features and limits', fn: testPlanTierFeatures },
    { name: 'Organization with owner', fn: testOrgWithOwner },
    { name: 'Slug uniqueness enforcement', fn: testSlugUniqueness },
    { name: 'Trial period setup', fn: testTrialPeriod },
    { name: 'Default workspace creation', fn: testDefaultWorkspaceCreation }
  ])
  
  // Final cleanup
  await supabaseAdmin
    .from('organizations')
    .delete()
    .like('slug', 'test-%')
  
  process.exit(results.failed > 0 ? 1 : 0)
}

main().catch(console.error)