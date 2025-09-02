/**
 * Database Cleanup Utilities
 * Functions to reset test data and maintain clean state
 */

import { supabaseAdmin } from './db-client'

/**
 * Delete an organization and all related data
 */
export async function deleteOrganization(orgId: string) {
  console.log(`🗑️  Deleting organization ${orgId}...`)
  
  // Order matters due to foreign key constraints
  const tables = [
    // AI tables
    'ai_agent_executions',
    'ai_agent_conversations',
    'ai_agent_permissions',
    'ai_agents',
    'semantic_query_templates',
    'semantic_catalog',
    
    // Transaction tables
    'payment_allocations',
    'payments',
    'invoice_lines',
    'invoices',
    'bill_lines',
    'bills',
    'journal_lines',
    'journal_entries',
    
    // Order tables
    'order_fulfillments',
    'sales_order_lines',
    'sales_orders',
    'purchase_receipts',
    'purchase_order_lines',
    'purchase_orders',
    
    // Inventory tables
    'inventory_adjustment_lines',
    'inventory_adjustments',
    'stock_moves',
    'inventory_levels',
    
    // Banking tables
    'bank_reconciliations',
    'bank_transactions',
    'bank_rules',
    'bank_accounts',
    
    // Master data
    'products',
    'contacts',
    'warehouses',
    'tax_codes',
    'chart_accounts',
    
    // Workspace and members
    'workspace_members',
    'workspaces',
    'organization_members',
    
    // Finally, the organization itself
    'organizations'
  ]
  
  for (const table of tables) {
    try {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('organization_id', orgId)
      
      if (error && !error.message.includes('column "organization_id" does not exist')) {
        console.warn(`  ⚠️  Failed to clean ${table}: ${error.message}`)
      }
    } catch (err) {
      // Some tables might not have organization_id
      continue
    }
  }
  
  console.log(`✅ Organization ${orgId} deleted`)
}

/**
 * Delete test users
 */
export async function deleteTestUsers(emailPattern: string = '%@anchorblock.ai') {
  console.log(`🗑️  Deleting test users matching ${emailPattern}...`)
  
  // Delete from sessions first
  await supabaseAdmin
    .from('sessions')
    .delete()
    .in('user_id', 
      supabaseAdmin
        .from('users')
        .select('id')
        .like('email', emailPattern)
    )
  
  // Delete from supabase_users
  await supabaseAdmin
    .from('supabase_users')
    .delete()
    .in('nextauth_user_id',
      supabaseAdmin
        .from('users')
        .select('id')
        .like('email', emailPattern)
    )
  
  // Delete users
  const { error } = await supabaseAdmin
    .from('users')
    .delete()
    .like('email', emailPattern)
  
  if (error) {
    console.warn(`  ⚠️  Failed to delete users: ${error.message}`)
  } else {
    console.log(`✅ Test users deleted`)
  }
}

/**
 * Reset specific tables to clean state
 */
export async function resetTables(tables: string[]) {
  console.log(`🔄 Resetting ${tables.length} tables...`)
  
  for (const table of tables) {
    const { error } = await supabaseAdmin
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete everything except system records
    
    if (error) {
      console.warn(`  ⚠️  Failed to reset ${table}: ${error.message}`)
    } else {
      console.log(`  ✅ Reset ${table}`)
    }
  }
}

/**
 * Clean up test data by organization slug
 */
export async function cleanupBySlug(slug: string) {
  console.log(`🧹 Cleaning up organization with slug: ${slug}`)
  
  // Find the organization
  const { data: org, error } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single()
  
  if (error || !org) {
    console.log(`  ℹ️  Organization ${slug} not found`)
    return
  }
  
  await deleteOrganization(org.id)
}

/**
 * Full cleanup of all test data
 */
export async function fullCleanup() {
  console.log('\n🧹 Starting full test data cleanup...\n')
  
  // Delete known test organizations
  const testSlugs = ['anchorblock', 'teamqreative', 'test-org']
  
  for (const slug of testSlugs) {
    await cleanupBySlug(slug)
  }
  
  // Delete test users
  await deleteTestUsers('%@anchorblock.ai')
  await deleteTestUsers('%@teamqreative.ai')
  await deleteTestUsers('%test%')
  
  console.log('\n✅ Full cleanup complete\n')
}

/**
 * Verify database is in clean state
 */
export async function verifyCleanState(orgSlug: string): Promise<boolean> {
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single()
  
  if (org) {
    console.warn(`⚠️  Organization ${orgSlug} still exists`)
    return false
  }
  
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id')
    .like('email', `%@${orgSlug}.%`)
  
  if (users && users.length > 0) {
    console.warn(`⚠️  Found ${users.length} users for ${orgSlug}`)
    return false
  }
  
  console.log(`✅ Database is clean for ${orgSlug}`)
  return true
}

/**
 * Create a database snapshot for rollback
 */
export async function createSnapshot(name: string) {
  console.log(`📸 Creating snapshot: ${name}`)
  
  // This would typically use pg_dump or similar
  // For now, we'll just track the current state
  
  const tables = [
    'organizations',
    'users',
    'workspaces',
    'contacts',
    'products',
    'invoices',
    'bills'
  ]
  
  const snapshot: Record<string, any[]> = {}
  
  for (const table of tables) {
    const { data } = await supabaseAdmin
      .from(table)
      .select()
    
    snapshot[table] = data || []
  }
  
  // Store snapshot (in production, this would go to a file or backup table)
  return snapshot
}

/**
 * Restore from snapshot
 */
export async function restoreSnapshot(snapshot: Record<string, any[]>) {
  console.log(`🔄 Restoring from snapshot...`)
  
  // Clear current data
  for (const table of Object.keys(snapshot)) {
    await supabaseAdmin
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
  }
  
  // Restore snapshot data
  for (const [table, data] of Object.entries(snapshot)) {
    if (data.length > 0) {
      await supabaseAdmin
        .from(table)
        .insert(data)
    }
  }
  
  console.log(`✅ Snapshot restored`)
}