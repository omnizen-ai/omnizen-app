/**
 * Personal Finance Authentication Utilities
 * 
 * Handles user creation and authentication for personal finance users
 * within the OmniZen organization structure
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// OmniZen organization ID for all personal finance users
const OMNIZEN_ORG_ID = 'omnizen-personal-finance';
const OMNIZEN_ORG_NAME = 'OmniZen Personal Finance';

/**
 * Ensure OmniZen organization exists for personal finance users
 */
export async function ensureOmniZenOrg(): Promise<string> {
  // Check if OmniZen org exists
  const { data: existingOrg } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', 'omnizen-personal')
    .single();

  if (existingOrg) {
    return existingOrg.id;
  }

  // Create OmniZen organization
  const { data: org, error } = await supabase
    .from('organizations')
    .insert({
      name: OMNIZEN_ORG_NAME,
      slug: 'omnizen-personal',
      account_type: 'personal',
      is_personal_finance: true,
      plan_tier: 'personal-pro', // Top tier for all features
      settings: {
        currency: 'USD',
        timezone: 'America/New_York',
        fiscal_year_start: '01-01',
        features: {
          personal_finance: true,
          investments: true,
          tax_planning: true,
          family_sharing: true,
          ai_insights: true
        }
      }
    })
    .select()
    .single();

  if (error) throw error;
  
  // Create default personal finance categories
  await createDefaultCategories(org.id);
  
  // Apply personal finance COA template
  await applyPersonalCOA(org.id);

  return org.id;
}

/**
 * Create a personal finance user
 */
export async function createPersonalUser(
  email: string,
  name: string,
  planTier: 'personal-free' | 'personal-plus' | 'personal-pro' | 'family' = 'personal-plus'
): Promise<{
  userId: string;
  workspaceId: string;
  orgId: string;
}> {
  // Ensure OmniZen org exists
  const orgId = await ensureOmniZenOrg();

  // Create user
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      email,
      name,
      auth_provider: 'email'
    })
    .select()
    .single();

  if (userError) throw userError;

  // Create personal workspace within OmniZen org
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .insert({
      org_id: orgId,
      name: `${name}'s Finances`,
      slug: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-'),
      workspace_type: 'personal',
      created_by: user.id,
      settings: {
        plan_tier: planTier,
        features: getFeaturesByPlan(planTier)
      }
    })
    .select()
    .single();

  if (workspaceError) throw workspaceError;

  // Add user to OmniZen org with workspace access
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      org_id: orgId,
      user_id: user.id,
      workspace_id: workspace.id,
      role: 'owner', // Each person owns their workspace
      invited_by: user.id
    });

  if (memberError) throw memberError;

  // Create auth bridge entry
  const { error: bridgeError } = await supabase
    .from('nextauth_users_supabase_users')
    .insert({
      nextauth_user_id: user.id,
      supabase_user_id: user.id
    });

  if (bridgeError) console.warn('Auth bridge creation failed:', bridgeError);

  return {
    userId: user.id,
    workspaceId: workspace.id,
    orgId
  };
}

/**
 * Create a family account with multiple members
 */
export async function createFamilyAccount(
  familyName: string,
  members: Array<{ email: string; name: string; role: 'parent' | 'child' }>
): Promise<{
  familyWorkspaceId: string;
  members: Array<{ userId: string; name: string; role: string }>;
  orgId: string;
}> {
  const orgId = await ensureOmniZenOrg();
  
  // Create family workspace
  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .insert({
      org_id: orgId,
      name: `${familyName} Family Finances`,
      slug: familyName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      workspace_type: 'family',
      settings: {
        plan_tier: 'family',
        features: getFeaturesByPlan('family'),
        family_settings: {
          parental_controls: true,
          shared_budgets: true,
          allowance_tracking: true
        }
      }
    })
    .select()
    .single();

  if (workspaceError) throw workspaceError;

  // Create family members
  const createdMembers = [];
  
  for (const member of members) {
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: member.email,
        name: member.name,
        auth_provider: 'email'
      })
      .select()
      .single();

    if (userError) throw userError;

    // Add to organization with family workspace access
    await supabase
      .from('organization_members')
      .insert({
        org_id: orgId,
        user_id: user.id,
        workspace_id: workspace.id,
        role: member.role === 'parent' ? 'admin' : 'viewer',
        invited_by: user.id
      });

    createdMembers.push({
      userId: user.id,
      name: member.name,
      role: member.role
    });
  }

  return {
    familyWorkspaceId: workspace.id,
    members: createdMembers,
    orgId
  };
}

/**
 * Get features by plan tier
 */
function getFeaturesByPlan(planTier: string) {
  const features: Record<string, any> = {
    'personal-free': {
      accounts: 2,
      transactions_limit: 500,
      budgets: 5,
      ai_insights: false,
      investments: false,
      tax_tools: false
    },
    'personal-plus': {
      accounts: 'unlimited',
      transactions_limit: 'unlimited',
      budgets: 'unlimited',
      ai_insights: true,
      investments: false,
      tax_tools: false
    },
    'personal-pro': {
      accounts: 'unlimited',
      transactions_limit: 'unlimited',
      budgets: 'unlimited',
      ai_insights: true,
      investments: true,
      tax_tools: true,
      advanced_analytics: true
    },
    'family': {
      accounts: 'unlimited',
      transactions_limit: 'unlimited',
      budgets: 'unlimited',
      ai_insights: true,
      investments: true,
      tax_tools: true,
      family_members: 5,
      shared_budgets: true,
      parental_controls: true
    }
  };

  return features[planTier] || features['personal-plus'];
}

/**
 * Create default personal finance categories
 */
async function createDefaultCategories(orgId: string): Promise<void> {
  const categories = [
    { name: 'Housing', icon: '🏠', color: '#FF6B6B' },
    { name: 'Transportation', icon: '🚗', color: '#4ECDC4' },
    { name: 'Food & Dining', icon: '🍽️', color: '#45B7D1' },
    { name: 'Shopping', icon: '🛍️', color: '#96CEB4' },
    { name: 'Entertainment', icon: '🎬', color: '#FFEAA7' },
    { name: 'Healthcare', icon: '🏥', color: '#DDA0DD', tax_relevant: true },
    { name: 'Insurance', icon: '🛡️', color: '#98D8C8' },
    { name: 'Savings', icon: '💰', color: '#FFD700' },
    { name: 'Investments', icon: '📈', color: '#32CD32' },
    { name: 'Debt Payments', icon: '💳', color: '#FF6347' },
    { name: 'Income', icon: '💵', color: '#00CED1' },
    { name: 'Taxes', icon: '📋', color: '#8B4513', tax_relevant: true },
    { name: 'Education', icon: '🎓', color: '#4169E1', tax_relevant: true },
    { name: 'Charity', icon: '❤️', color: '#FF1493', tax_relevant: true },
    { name: 'Personal Care', icon: '💅', color: '#FFB6C1' },
    { name: 'Utilities', icon: '💡', color: '#708090' },
    { name: 'Travel', icon: '✈️', color: '#20B2AA' },
    { name: 'Subscriptions', icon: '📱', color: '#9370DB' }
  ];

  const categoryData = categories.map(cat => ({
    ...cat,
    org_id: orgId,
    typical_merchants: []
  }));

  await supabase
    .from('personal_categories')
    .insert(categoryData);
}

/**
 * Apply personal finance COA template
 */
async function applyPersonalCOA(orgId: string): Promise<void> {
  const accounts = [
    // Assets
    { code: '1000', name: 'Cash and Bank Accounts', type: 'Asset', subcategory: 'Cash and Cash Equivalents' },
    { code: '1100', name: 'Checking Account', type: 'Asset', subcategory: 'Cash and Cash Equivalents' },
    { code: '1200', name: 'Savings Account', type: 'Asset', subcategory: 'Cash and Cash Equivalents' },
    { code: '1300', name: 'Investment Accounts', type: 'Asset', subcategory: 'Investments' },
    { code: '1310', name: 'Brokerage Account', type: 'Asset', subcategory: 'Investments' },
    { code: '1320', name: 'Retirement Account (401k/IRA)', type: 'Asset', subcategory: 'Investments' },
    { code: '1400', name: 'Cryptocurrency', type: 'Asset', subcategory: 'Investments' },
    { code: '1500', name: 'Home', type: 'Asset', subcategory: 'Property' },
    { code: '1600', name: 'Vehicle', type: 'Asset', subcategory: 'Property' },
    
    // Liabilities
    { code: '2000', name: 'Credit Cards', type: 'Liability', subcategory: 'Credit Cards' },
    { code: '2100', name: 'Mortgage', type: 'Liability', subcategory: 'Loans' },
    { code: '2200', name: 'Auto Loan', type: 'Liability', subcategory: 'Loans' },
    { code: '2300', name: 'Student Loans', type: 'Liability', subcategory: 'Loans' },
    { code: '2400', name: 'Personal Loans', type: 'Liability', subcategory: 'Loans' },
    
    // Equity
    { code: '3000', name: 'Net Worth', type: 'Equity', subcategory: 'Owner Equity' },
    { code: '3100', name: 'Opening Balance Equity', type: 'Equity', subcategory: 'Owner Equity' },
    
    // Income
    { code: '4000', name: 'Income', type: 'Revenue', subcategory: 'Operating Revenue' },
    { code: '4100', name: 'Salary/Wages', type: 'Revenue', subcategory: 'Operating Revenue' },
    { code: '4200', name: 'Freelance Income', type: 'Revenue', subcategory: 'Operating Revenue' },
    { code: '4300', name: 'Investment Income', type: 'Revenue', subcategory: 'Other Revenue' },
    { code: '4400', name: 'Rental Income', type: 'Revenue', subcategory: 'Other Revenue' },
    { code: '4500', name: 'Other Income', type: 'Revenue', subcategory: 'Other Revenue' },
    
    // Expenses
    { code: '5000', name: 'Living Expenses', type: 'Expense', subcategory: 'Operating Expenses' },
    { code: '5100', name: 'Housing', type: 'Expense', subcategory: 'Operating Expenses' },
    { code: '5200', name: 'Transportation', type: 'Expense', subcategory: 'Operating Expenses' },
    { code: '5300', name: 'Food and Dining', type: 'Expense', subcategory: 'Operating Expenses' },
    { code: '5400', name: 'Healthcare', type: 'Expense', subcategory: 'Operating Expenses' },
    { code: '5500', name: 'Entertainment', type: 'Expense', subcategory: 'Operating Expenses' },
    { code: '5600', name: 'Insurance', type: 'Expense', subcategory: 'Operating Expenses' },
    { code: '5700', name: 'Taxes', type: 'Expense', subcategory: 'Operating Expenses' },
    { code: '5800', name: 'Education', type: 'Expense', subcategory: 'Operating Expenses' },
    { code: '5900', name: 'Personal Care', type: 'Expense', subcategory: 'Operating Expenses' },
    { code: '6000', name: 'Debt Payments', type: 'Expense', subcategory: 'Operating Expenses' },
    { code: '6100', name: 'Savings & Investments', type: 'Expense', subcategory: 'Operating Expenses' }
  ];

  const coaData = accounts.map(account => ({
    org_id: orgId,
    account_code: account.code,
    account_name: account.name,
    account_type: account.type,
    account_subcategory: account.subcategory,
    is_active: true,
    created_at: new Date().toISOString()
  }));

  await supabase
    .from('chart_of_accounts')
    .insert(coaData);
}

/**
 * Set auth context for personal finance user
 */
export async function setPersonalAuthContext(
  workspaceId: string,
  userId: string
): Promise<void> {
  const orgId = await ensureOmniZenOrg();
  
  // Set the auth context using the existing function
  const { setAuthContext } = await import('../../utils/db-client');
  await setAuthContext(orgId, userId, workspaceId, 'owner');
}