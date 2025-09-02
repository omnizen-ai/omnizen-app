/**
 * Database Client Configuration
 * Provides Supabase client setup for test scripts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'path'

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') })

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for test scripts')
}

// Create Supabase client with service role key (bypasses RLS for setup)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Create Supabase client for testing RLS (uses anon key)
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Execute raw SQL query
 */
export async function executeSql(sql: string, params?: any[]) {
  const { data, error } = await supabaseAdmin.rpc('exec_sql', {
    query: sql,
    params: params || []
  })
  
  if (error) {
    console.error('SQL Error:', error)
    throw error
  }
  
  return data
}

/**
 * Set authentication context for RLS testing
 */
export async function setAuthContext(
  orgId: string,
  userId: string,
  workspaceId?: string,
  role: string = 'user'
) {
  // Set the auth context using the auth functions
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
  
  return executeSql(sql, [orgId, userId, workspaceId, role])
}

/**
 * Clear authentication context
 */
export async function clearAuthContext() {
  const sql = `
    SELECT set_config('request.jwt.claims', '', false);
  `
  return executeSql(sql)
}

/**
 * Test database connection
 */
export async function testConnection() {
  try {
    const { data, error } = await supabaseAdmin
      .from('organizations')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Connection test failed:', error)
      return false
    }
    
    console.log('✅ Database connection successful')
    return true
  } catch (err) {
    console.error('Connection test error:', err)
    return false
  }
}

export default supabaseAdmin