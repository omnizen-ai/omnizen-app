/**
 * Authentication Context Utilities
 * Helpers for managing auth context in tests
 */

import { supabaseAdmin } from './db-client'

export interface AuthContext {
  orgId: string
  userId: string
  workspaceId?: string
  role: 'owner' | 'admin' | 'user' | 'viewer'
  email: string
}

/**
 * Create a test user with authentication setup
 */
export async function createTestUser(
  email: string,
  name: string,
  orgId: string,
  role: 'owner' | 'admin' | 'user' | 'viewer' = 'user'
) {
  // 1. Create user in users table
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .insert({
      email,
      name,
      role,
      email_verified: new Date().toISOString()
    })
    .select()
    .single()

  if (userError) throw userError

  // 2. Create organization member record
  const { error: memberError } = await supabaseAdmin
    .from('organization_members')
    .insert({
      organization_id: orgId,
      user_id: user.id,
      role,
      joined_at: new Date().toISOString()
    })

  if (memberError) throw memberError

  // 3. Create a session for the user
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('sessions')
    .insert({
      user_id: user.id,
      session_token: `test-session-${user.id}`,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    })
    .select()
    .single()

  if (sessionError) throw sessionError

  // 4. Create Supabase user record for RLS
  const { data: supabaseUser, error: supabaseUserError } = await supabaseAdmin
    .from('supabase_users')
    .insert({
      id: crypto.randomUUID(),
      nextauth_user_id: user.id
    })
    .select()
    .single()

  if (supabaseUserError) throw supabaseUserError

  return {
    user,
    session,
    supabaseUser,
    authContext: {
      orgId,
      userId: user.id,
      role,
      email
    } as AuthContext
  }
}

/**
 * Create a test organization with owner
 */
export async function createTestOrganization(
  name: string,
  slug: string,
  ownerEmail: string,
  planTier: 'starter' | 'growth' | 'professional' | 'enterprise' = 'growth'
) {
  // 1. Create organization
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .insert({
      name,
      slug,
      plan_tier: planTier,
      feature_flags: {
        invoicing: true,
        basic_accounting: planTier !== 'starter',
        full_accounting: ['professional', 'enterprise'].includes(planTier),
        inventory: ['professional', 'enterprise'].includes(planTier),
        ai_automation: ['professional', 'enterprise'].includes(planTier),
        custom_workflows: planTier === 'enterprise',
        api_access: ['growth', 'professional', 'enterprise'].includes(planTier),
        white_label: planTier === 'enterprise',
      },
      max_users: planTier === 'starter' ? 5 : planTier === 'growth' ? 10 : planTier === 'professional' ? 25 : 100,
      max_ai_agents: planTier === 'starter' ? 2 : planTier === 'growth' ? 5 : planTier === 'professional' ? 10 : 50,
      max_workspaces: planTier === 'starter' ? 1 : planTier === 'growth' ? 3 : planTier === 'professional' ? 10 : 50,
      currency: 'USD',
      timezone: 'America/New_York',
      fiscal_year_start: 1
    })
    .select()
    .single()

  if (orgError) throw orgError

  // 2. Create owner user
  const ownerName = ownerEmail.split('@')[0].replace(/[._-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  const { authContext } = await createTestUser(
    ownerEmail,
    ownerName,
    org.id,
    'owner'
  )

  // 3. Create default workspace if multi-workspace enabled
  if (org.max_workspaces > 1) {
    const { data: workspace, error: wsError } = await supabaseAdmin
      .from('workspaces')
      .insert({
        organization_id: org.id,
        name: 'Headquarters',
        slug: 'hq',
        is_default: true
      })
      .select()
      .single()

    if (wsError) throw wsError

    return { org, authContext: { ...authContext, workspaceId: workspace.id } }
  }

  return { org, authContext }
}

/**
 * Switch organization context for a user
 */
export async function switchOrganization(
  userId: string,
  newOrgId: string
) {
  // Verify user is a member of the new organization
  const { data: member, error } = await supabaseAdmin
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', newOrgId)
    .single()

  if (error || !member) {
    throw new Error(`User ${userId} is not a member of organization ${newOrgId}`)
  }

  // Update session with new org context
  const { error: updateError } = await supabaseAdmin
    .from('sessions')
    .update({ 
      updated_at: new Date().toISOString(),
      // In a real app, you'd update JWT claims here
    })
    .eq('user_id', userId)

  if (updateError) throw updateError

  return {
    orgId: newOrgId,
    userId,
    role: member.role
  }
}

/**
 * Create auth context for testing RLS
 */
export async function withAuthContext<T>(
  context: AuthContext,
  callback: () => Promise<T>
): Promise<T> {
  try {
    // Set the auth context
    await setAuthContextForRLS(context)
    
    // Execute the callback with the context set
    const result = await callback()
    
    return result
  } finally {
    // Clear the context
    await clearAuthContextForRLS()
  }
}

/**
 * Set auth context for RLS testing
 */
async function setAuthContextForRLS(context: AuthContext) {
  // This would typically set JWT claims or session context
  // For testing, we'll use Supabase's built-in auth helpers
  const { error } = await supabaseAdmin.rpc('set_auth_context', {
    p_org_id: context.orgId,
    p_user_id: context.userId,
    p_workspace_id: context.workspaceId || null,
    p_role: context.role
  })

  if (error) {
    console.warn('Could not set auth context via RPC, using SQL fallback')
    // Fallback to SQL if RPC doesn't exist yet
    const sql = `
      SELECT set_config('request.jwt.claims', 
        json_build_object(
          'org_id', $1,
          'sub', $2,
          'workspace_id', $3,
          'role', $4
        )::text, 
        false
      );
    `
    await supabaseAdmin.rpc('exec_sql', {
      query: sql,
      params: [context.orgId, context.userId, context.workspaceId, context.role]
    })
  }
}

/**
 * Clear auth context after RLS testing
 */
async function clearAuthContextForRLS() {
  const sql = `SELECT set_config('request.jwt.claims', '', false);`
  await supabaseAdmin.rpc('exec_sql', { query: sql, params: [] }).catch(() => {
    // Ignore errors when clearing context
  })
}