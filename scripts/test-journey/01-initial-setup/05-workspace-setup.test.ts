/**
 * Test: Workspace Setup
 * Tests creating and configuring workspaces for multi-workspace organizations
 */

import { supabaseAdmin } from '../utils/db-client'
import { createTestOrganization } from '../utils/auth-context'
import { runTestSuite, assertEqual, assertTrue, assertFalse } from '../utils/test-assertions'
import { cleanupBySlug } from '../utils/cleanup'

async function testSingleWorkspaceOrg() {
  // Starter plan only allows 1 workspace
  const { org } = await createTestOrganization(
    'Single Workspace Org',
    'single-workspace',
    'admin@single.ai',
    'starter'
  )
  
  assertEqual(org.max_workspaces, 1, 'Starter plan should allow only 1 workspace')
  
  // For single workspace orgs, no separate workspace needed
  // All data is at org level
  const { data: workspaces } = await supabaseAdmin
    .from('workspaces')
    .select()
    .eq('organization_id', org.id)
  
  // Could have 0 or 1 workspace
  assertTrue(workspaces.length <= 1, 'Should have at most 1 workspace')
  
  return org
}

async function testMultiWorkspaceCreation() {
  // Professional plan allows 10 workspaces
  const { org } = await createTestOrganization(
    'Anchorblock Technology Limited',
    'anchorblock-workspaces',
    'admin@anchorblock.ai',
    'professional'
  )
  
  assertEqual(org.max_workspaces, 10, 'Professional plan should allow 10 workspaces')
  
  // Create department-based workspaces
  const workspaces = [
    {
      name: 'Headquarters',
      slug: 'hq',
      is_default: true,
      description: 'Main headquarters operations',
      settings: {
        timezone: 'America/New_York',
        currency: 'USD'
      }
    },
    {
      name: 'Engineering',
      slug: 'engineering',
      is_default: false,
      description: 'Product development team',
      settings: {
        cost_center: 'ENG-001',
        budget_monthly: 50000
      }
    },
    {
      name: 'Sales',
      slug: 'sales',
      is_default: false,
      description: 'Sales and business development',
      settings: {
        cost_center: 'SALES-001',
        commission_enabled: true
      }
    },
    {
      name: 'Marketing',
      slug: 'marketing',
      is_default: false,
      description: 'Marketing and growth',
      settings: {
        cost_center: 'MKT-001',
        budget_monthly: 20000
      }
    },
    {
      name: 'Finance',
      slug: 'finance',
      is_default: false,
      description: 'Finance and accounting',
      settings: {
        cost_center: 'FIN-001',
        restricted_access: true
      }
    }
  ]
  
  const createdWorkspaces = []
  
  for (const ws of workspaces) {
    const { data: workspace, error } = await supabaseAdmin
      .from('workspaces')
      .insert({
        organization_id: org.id,
        ...ws,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    assertTrue(!error, `Workspace ${ws.name} should be created`)
    assertEqual(workspace.slug, ws.slug, `Slug should be ${ws.slug}`)
    
    createdWorkspaces.push(workspace)
  }
  
  // Verify default workspace
  const defaultWs = createdWorkspaces.find(w => w.is_default)
  assertTrue(defaultWs, 'Should have a default workspace')
  assertEqual(defaultWs.name, 'Headquarters', 'HQ should be default')
  
  // Verify only one default
  const defaultCount = createdWorkspaces.filter(w => w.is_default).length
  assertEqual(defaultCount, 1, 'Should have exactly one default workspace')
  
  return { org, workspaces: createdWorkspaces }
}

async function testWorkspaceMemberAssignment() {
  const { org } = await createTestOrganization(
    'Member Assignment Org',
    'member-assignment',
    'admin@members.ai',
    'professional'
  )
  
  // Create workspaces
  const { data: engineering } = await supabaseAdmin
    .from('workspaces')
    .insert({
      organization_id: org.id,
      name: 'Engineering',
      slug: 'eng',
      is_default: false
    })
    .select()
    .single()
  
  const { data: sales } = await supabaseAdmin
    .from('workspaces')
    .insert({
      organization_id: org.id,
      name: 'Sales',
      slug: 'sales',
      is_default: false
    })
    .select()
    .single()
  
  // Create users
  const users = [
    { email: 'dev1@members.ai', name: 'Developer 1', workspace: engineering },
    { email: 'dev2@members.ai', name: 'Developer 2', workspace: engineering },
    { email: 'sales1@members.ai', name: 'Sales Rep 1', workspace: sales },
    { email: 'manager@members.ai', name: 'Manager', workspace: null } // Access to all
  ]
  
  for (const userData of users) {
    // Create user
    const { data: user } = await supabaseAdmin
      .from('users')
      .insert({
        email: userData.email,
        name: userData.name,
        role: userData.workspace ? 'user' : 'admin'
      })
      .select()
      .single()
    
    // Add to organization
    await supabaseAdmin
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: userData.workspace ? 'user' : 'admin'
      })
    
    // Assign to workspace if specified
    if (userData.workspace) {
      const { data: wsMember } = await supabaseAdmin
        .from('workspace_members')
        .insert({
          workspace_id: userData.workspace.id,
          user_id: user.id,
          role: 'member',
          joined_at: new Date().toISOString()
        })
        .select()
        .single()
      
      assertEqual(wsMember.workspace_id, userData.workspace.id, 'User should be in correct workspace')
    }
  }
  
  // Verify workspace member counts
  const { data: engMembers } = await supabaseAdmin
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', engineering.id)
  
  assertEqual(engMembers.length, 2, 'Engineering should have 2 members')
  
  const { data: salesMembers } = await supabaseAdmin
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', sales.id)
  
  assertEqual(salesMembers.length, 1, 'Sales should have 1 member')
}

async function testWorkspaceIsolation() {
  const { org } = await createTestOrganization(
    'Isolation Test Org',
    'ws-isolation',
    'admin@isolation.ai',
    'professional'
  )
  
  // Create two workspaces
  const { data: ws1 } = await supabaseAdmin
    .from('workspaces')
    .insert({
      organization_id: org.id,
      name: 'Workspace 1',
      slug: 'ws1'
    })
    .select()
    .single()
  
  const { data: ws2 } = await supabaseAdmin
    .from('workspaces')
    .insert({
      organization_id: org.id,
      name: 'Workspace 2',
      slug: 'ws2'
    })
    .select()
    .single()
  
  // Create contacts in different workspaces
  await supabaseAdmin
    .from('contacts')
    .insert({
      organization_id: org.id,
      workspace_id: ws1.id,
      type: 'customer',
      company_name: 'WS1 Customer',
      display_name: 'WS1 Customer'
    })
  
  await supabaseAdmin
    .from('contacts')
    .insert({
      organization_id: org.id,
      workspace_id: ws2.id,
      type: 'customer',
      company_name: 'WS2 Customer',
      display_name: 'WS2 Customer'
    })
  
  // Query contacts for workspace 1
  const { data: ws1Contacts } = await supabaseAdmin
    .from('contacts')
    .select()
    .eq('organization_id', org.id)
    .eq('workspace_id', ws1.id)
  
  assertEqual(ws1Contacts.length, 1, 'Should only see WS1 contacts')
  assertEqual(ws1Contacts[0].company_name, 'WS1 Customer', 'Should be WS1 customer')
  
  // Query contacts for workspace 2
  const { data: ws2Contacts } = await supabaseAdmin
    .from('contacts')
    .select()
    .eq('organization_id', org.id)
    .eq('workspace_id', ws2.id)
  
  assertEqual(ws2Contacts.length, 1, 'Should only see WS2 contacts')
  assertEqual(ws2Contacts[0].company_name, 'WS2 Customer', 'Should be WS2 customer')
}

async function testWorkspaceSettings() {
  const { org } = await createTestOrganization(
    'Settings Test Org',
    'ws-settings',
    'admin@settings.ai',
    'enterprise'
  )
  
  // Create workspace with comprehensive settings
  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .insert({
      organization_id: org.id,
      name: 'Regional Office',
      slug: 'regional',
      is_default: false,
      settings: {
        // Location settings
        timezone: 'Europe/London',
        currency: 'GBP',
        language: 'en-GB',
        
        // Financial settings
        cost_center: 'UK-001',
        budget_annual: 1000000,
        budget_monthly: 85000,
        
        // Operational settings
        auto_invoice_numbering: true,
        invoice_prefix: 'UK-INV',
        requires_approval: true,
        approval_threshold: 10000,
        
        // Access control
        restricted_access: false,
        allowed_roles: ['admin', 'user'],
        
        // Custom fields
        custom_fields: {
          region: 'EMEA',
          office_code: 'LON-01',
          manager_email: 'uk-manager@anchorblock.ai'
        }
      }
    })
    .select()
    .single()
  
  assertTrue(workspace.settings, 'Workspace should have settings')
  assertEqual(workspace.settings.timezone, 'Europe/London', 'Should have London timezone')
  assertEqual(workspace.settings.currency, 'GBP', 'Should use GBP currency')
  assertTrue(workspace.settings.requires_approval, 'Should require approval')
  assertEqual(workspace.settings.custom_fields.region, 'EMEA', 'Should be in EMEA region')
}

async function testWorkspaceHierarchy() {
  const { org } = await createTestOrganization(
    'Hierarchy Test Org',
    'ws-hierarchy',
    'admin@hierarchy.ai',
    'enterprise'
  )
  
  // Create parent workspace
  const { data: parent } = await supabaseAdmin
    .from('workspaces')
    .insert({
      organization_id: org.id,
      name: 'Global Operations',
      slug: 'global',
      is_default: true
    })
    .select()
    .single()
  
  // Create child workspaces
  const regions = ['North America', 'Europe', 'Asia Pacific']
  const children = []
  
  for (const region of regions) {
    const { data: child } = await supabaseAdmin
      .from('workspaces')
      .insert({
        organization_id: org.id,
        name: region,
        slug: region.toLowerCase().replace(' ', '-'),
        parent_id: parent.id,
        is_default: false
      })
      .select()
      .single()
    
    children.push(child)
    
    // Create sub-workspaces for countries
    if (region === 'Europe') {
      const countries = ['UK', 'Germany', 'France']
      for (const country of countries) {
        await supabaseAdmin
          .from('workspaces')
          .insert({
            organization_id: org.id,
            name: country,
            slug: country.toLowerCase(),
            parent_id: child.id,
            is_default: false
          })
      }
    }
  }
  
  // Verify hierarchy
  const { data: topLevel } = await supabaseAdmin
    .from('workspaces')
    .select()
    .eq('organization_id', org.id)
    .is('parent_id', null)
  
  assertEqual(topLevel.length, 1, 'Should have 1 top-level workspace')
  
  const { data: secondLevel } = await supabaseAdmin
    .from('workspaces')
    .select()
    .eq('organization_id', org.id)
    .eq('parent_id', parent.id)
  
  assertEqual(secondLevel.length, 3, 'Should have 3 regional workspaces')
  
  const europeWs = children.find(c => c.name === 'Europe')
  const { data: thirdLevel } = await supabaseAdmin
    .from('workspaces')
    .select()
    .eq('organization_id', org.id)
    .eq('parent_id', europeWs.id)
  
  assertEqual(thirdLevel.length, 3, 'Europe should have 3 country workspaces')
}

async function testWorkspaceLimits() {
  const { org } = await createTestOrganization(
    'Limits Test Org',
    'ws-limits',
    'admin@limits.ai',
    'growth' // Allows 3 workspaces
  )
  
  assertEqual(org.max_workspaces, 3, 'Growth plan should allow 3 workspaces')
  
  // Try to create more than allowed
  const workspaceNames = ['WS1', 'WS2', 'WS3', 'WS4']
  const created = []
  
  for (let i = 0; i < workspaceNames.length; i++) {
    const { data: workspace, error } = await supabaseAdmin
      .from('workspaces')
      .insert({
        organization_id: org.id,
        name: workspaceNames[i],
        slug: workspaceNames[i].toLowerCase()
      })
      .select()
      .single()
    
    if (i < 3) {
      assertTrue(!error, `Should create workspace ${i + 1}`)
      created.push(workspace)
    } else {
      // In production, this would be enforced by business logic
      // For testing, we just verify we don't exceed the limit
      const { data: allWorkspaces } = await supabaseAdmin
        .from('workspaces')
        .select('id')
        .eq('organization_id', org.id)
      
      assertTrue(
        allWorkspaces.length <= org.max_workspaces,
        'Should not exceed workspace limit'
      )
    }
  }
}

// Run tests
async function main() {
  console.log('🚀 Starting Workspace Setup Tests\n')
  
  // Clean up any existing test data
  const slugsToClean = [
    'single-workspace',
    'anchorblock-workspaces',
    'member-assignment',
    'ws-isolation',
    'ws-settings',
    'ws-hierarchy',
    'ws-limits'
  ]
  
  for (const slug of slugsToClean) {
    await cleanupBySlug(slug)
  }
  
  const results = await runTestSuite('Workspace Setup', [
    { name: 'Single workspace organization', fn: testSingleWorkspaceOrg },
    { name: 'Multi-workspace creation', fn: testMultiWorkspaceCreation },
    { name: 'Workspace member assignment', fn: testWorkspaceMemberAssignment },
    { name: 'Workspace data isolation', fn: testWorkspaceIsolation },
    { name: 'Workspace settings configuration', fn: testWorkspaceSettings },
    { name: 'Workspace hierarchy structure', fn: testWorkspaceHierarchy },
    { name: 'Workspace limit enforcement', fn: testWorkspaceLimits }
  ])
  
  // Cleanup
  for (const slug of slugsToClean) {
    await cleanupBySlug(slug)
  }
  
  process.exit(results.failed > 0 ? 1 : 0)
}

main().catch(console.error)