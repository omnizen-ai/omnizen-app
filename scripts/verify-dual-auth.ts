#!/usr/bin/env tsx

/**
 * Script to verify dual authentication setup (NextAuth + Supabase)
 * Run with: npx tsx scripts/verify-dual-auth.ts
 */

import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const CHECKS = {
  environment: '🔐 Environment Variables',
  database: '🗄️  Database Connection',
  rlsFunctions: '🛡️  RLS Functions',
  organizationTables: '🏢 Organization Tables',
  supabaseAuth: '🔑 Supabase Auth',
  policies: '📋 RLS Policies',
  semanticViews: '👁️  Semantic Views',
};

async function checkEnvironmentVariables() {
  console.log(`\nChecking ${CHECKS.environment}...`);
  
  const required = [
    'POSTGRES_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_JWT_SECRET',
    'AUTH_SECRET',
  ];
  
  const missing = [];
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
      console.log(`  ❌ ${key}: Missing`);
    } else {
      const value = process.env[key];
      const masked = value ? `${value.substring(0, 5)}...` : 'undefined';
      console.log(`  ✅ ${key}: ${masked}`);
    }
  }
  
  return missing.length === 0;
}

async function checkDatabaseConnection() {
  console.log(`\nChecking ${CHECKS.database}...`);
  
  try {
    const sql = postgres(process.env.POSTGRES_URL!);
    const result = await sql`SELECT version()`;
    console.log(`  ✅ PostgreSQL connected: ${result[0].version.split(' ')[1]}`);
    
    // Check schemas
    const schemas = await sql`
      SELECT nspname FROM pg_namespace 
      WHERE nspname IN ('public', 'core', 'finance', 'ai', 'semantic')
      ORDER BY nspname
    `;
    
    console.log(`  ✅ Schemas found: ${schemas.map(s => s.nspname).join(', ')}`);
    
    await sql.end();
    return true;
  } catch (error) {
    console.log(`  ❌ Database connection failed: ${error.message}`);
    return false;
  }
}

async function checkRLSFunctions() {
  console.log(`\nChecking ${CHECKS.rlsFunctions}...`);
  
  try {
    const sql = postgres(process.env.POSTGRES_URL!);
    
    const functions = await sql`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
        AND routine_name IN (
          'auth_org_id', 'auth_user_id', 'auth_workspace_id', 'auth_role',
          'set_auth_context', 'verify_auth_context', 'clear_auth_context'
        )
      ORDER BY routine_name
    `;
    
    const expectedFunctions = [
      'auth_org_id', 'auth_user_id', 'auth_workspace_id', 'auth_role',
      'set_auth_context', 'verify_auth_context', 'clear_auth_context'
    ];
    
    for (const func of expectedFunctions) {
      const exists = functions.some(f => f.routine_name === func);
      console.log(`  ${exists ? '✅' : '❌'} ${func}()`);
    }
    
    await sql.end();
    return functions.length === expectedFunctions.length;
  } catch (error) {
    console.log(`  ❌ Failed to check RLS functions: ${error.message}`);
    return false;
  }
}

async function checkOrganizationTables() {
  console.log(`\nChecking ${CHECKS.organizationTables}...`);
  
  try {
    const sql = postgres(process.env.POSTGRES_URL!);
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('organizations', 'organization_members', 'workspaces', 'User')
      ORDER BY table_name
    `;
    
    const expectedTables = ['organizations', 'organization_members', 'workspaces', 'User'];
    
    for (const table of expectedTables) {
      const exists = tables.some(t => t.table_name === table);
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    }
    
    // Check if organization_members has required columns
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'organization_members' 
        AND column_name IN ('user_id', 'organization_id', 'role', 'permissions', 'allowed_workspaces')
    `;
    
    console.log(`  ℹ️  organization_members columns: ${columns.length}/5 required columns found`);
    
    await sql.end();
    return tables.length === expectedTables.length;
  } catch (error) {
    console.log(`  ❌ Failed to check organization tables: ${error.message}`);
    return false;
  }
}

async function checkSupabaseAuth() {
  console.log(`\nChecking ${CHECKS.supabaseAuth}...`);
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    
    // Check if we can connect to Supabase
    const { data: users, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });
    
    if (error) {
      console.log(`  ❌ Supabase Auth connection failed: ${error.message}`);
      return false;
    }
    
    console.log(`  ✅ Supabase Auth connected`);
    console.log(`  ℹ️  Total users in auth.users: ${users?.users?.length || 0}`);
    
    return true;
  } catch (error) {
    console.log(`  ❌ Failed to check Supabase Auth: ${error.message}`);
    return false;
  }
}

async function checkRLSPolicies() {
  console.log(`\nChecking ${CHECKS.policies}...`);
  
  try {
    const sql = postgres(process.env.POSTGRES_URL!);
    
    const policies = await sql`
      SELECT COUNT(*) as count 
      FROM pg_policies 
      WHERE schemaname = 'public'
    `;
    
    console.log(`  ✅ RLS Policies found: ${policies[0].count}`);
    
    // Check some key tables have RLS enabled
    const rlsEnabled = await sql`
      SELECT tablename, COUNT(*) as policy_count
      FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename IN ('organizations', 'organization_members', 'workspaces', 'invoices', 'bills')
      GROUP BY tablename
      ORDER BY tablename
    `;
    
    for (const table of rlsEnabled) {
      console.log(`  ✅ ${table.tablename}: ${table.policy_count} policies`);
    }
    
    await sql.end();
    return policies[0].count > 0;
  } catch (error) {
    console.log(`  ❌ Failed to check RLS policies: ${error.message}`);
    return false;
  }
}

async function checkSemanticViews() {
  console.log(`\nChecking ${CHECKS.semanticViews}...`);
  
  try {
    const sql = postgres(process.env.POSTGRES_URL!);
    
    const views = await sql`
      SELECT viewname 
      FROM pg_views 
      WHERE schemaname = 'semantic'
      ORDER BY viewname
    `;
    
    console.log(`  ✅ Semantic views found: ${views.length}`);
    
    const expectedViews = [
      'v_ap_aging_report', 'v_ar_aging_report', 'v_balance_sheet',
      'v_cash_flow_statement', 'v_customer_revenue', 'v_financial_ratios',
      'v_inventory_status', 'v_kpi_dashboard', 'v_order_pipeline',
      'v_profit_loss_statement'
    ];
    
    for (const viewName of expectedViews) {
      const exists = views.some(v => v.viewname === viewName);
      if (!exists) {
        console.log(`  ❌ Missing view: ${viewName}`);
      }
    }
    
    if (views.length === expectedViews.length) {
      console.log(`  ✅ All expected semantic views present`);
    }
    
    await sql.end();
    return views.length === expectedViews.length;
  } catch (error) {
    console.log(`  ❌ Failed to check semantic views: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('=' .repeat(60));
  console.log('🔍 Dual Authentication Setup Verification');
  console.log('=' .repeat(60));
  
  const results = {
    environment: await checkEnvironmentVariables(),
    database: await checkDatabaseConnection(),
    rlsFunctions: await checkRLSFunctions(),
    organizationTables: await checkOrganizationTables(),
    supabaseAuth: await checkSupabaseAuth(),
    policies: await checkRLSPolicies(),
    semanticViews: await checkSemanticViews(),
  };
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Summary');
  console.log('=' .repeat(60));
  
  let allPassed = true;
  for (const [key, value] of Object.entries(results)) {
    const checkName = CHECKS[key as keyof typeof CHECKS];
    console.log(`${value ? '✅' : '❌'} ${checkName}`);
    if (!value) allPassed = false;
  }
  
  console.log('\n' + '=' .repeat(60));
  if (allPassed) {
    console.log('✅ All checks passed! Dual authentication is properly configured.');
  } else {
    console.log('❌ Some checks failed. Please review the configuration above.');
  }
  console.log('=' .repeat(60));
  
  process.exit(allPassed ? 0 : 1);
}

// Run the verification
main().catch(console.error);