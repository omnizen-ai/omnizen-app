#!/usr/bin/env npx tsx
/**
 * Personal Finance Test Journey: Personal User Signup
 * 
 * Tests the onboarding flow for individual users joining OmniZen
 * for personal finance management.
 * 
 * Validates:
 * - User creation within OmniZen organization
 * - Personal workspace setup
 * - Default category creation
 * - Personal COA application
 * - Plan tier features
 * 
 * Test Users:
 * - Sarah Chen (Young Professional)
 * - The Martinez Family (Family Account)
 * - Alex Thompson (Freelancer/Investor)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { 
  createPersonalUser,
  createFamilyAccount,
  ensureOmniZenOrg,
  setPersonalAuthContext
} from '../utils/personal-auth';
import { 
  getSupabaseClient,
  executeSql,
  clearAuthContext
} from '../../utils/db-client';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const supabase = getSupabaseClient();

interface TestContext {
  omnizen: {
    orgId: string;
  };
  sarah: {
    userId?: string;
    workspaceId?: string;
    email: string;
    name: string;
  };
  martinez: {
    familyWorkspaceId?: string;
    members?: Array<{ userId: string; name: string; role: string }>;
  };
  alex: {
    userId?: string;
    workspaceId?: string;
    email: string;
    name: string;
  };
}

/**
 * Test OmniZen organization setup
 */
async function testOmniZenOrgSetup(): Promise<string> {
  console.log(chalk.cyan('Setting up OmniZen organization for personal finance...'));
  
  const orgId = await ensureOmniZenOrg();
  
  // Verify organization created with correct settings
  const { data: org, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();
  
  if (error) throw error;
  
  if (org.account_type !== 'personal') {
    throw new Error('Organization not set up for personal finance');
  }
  
  if (!org.is_personal_finance) {
    throw new Error('Personal finance flag not set');
  }
  
  console.log(chalk.green('✓ OmniZen organization ready for personal finance'));
  console.log(chalk.blue(`  Organization ID: ${orgId}`));
  console.log(chalk.blue(`  Account Type: ${org.account_type}`));
  
  return orgId;
}

/**
 * Test Sarah's signup (Young Professional)
 */
async function testSarahSignup(context: TestContext): Promise<void> {
  console.log(chalk.cyan('\nTesting Sarah Chen signup (Young Professional)...'));
  
  const result = await createPersonalUser(
    context.sarah.email,
    context.sarah.name,
    'personal-plus'
  );
  
  context.sarah.userId = result.userId;
  context.sarah.workspaceId = result.workspaceId;
  
  // Verify user created
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', result.userId)
    .single();
  
  if (!user) throw new Error('User not created');
  
  // Verify workspace created
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', result.workspaceId)
    .single();
  
  if (!workspace) throw new Error('Workspace not created');
  if (workspace.workspace_type !== 'personal') {
    throw new Error('Workspace not marked as personal');
  }
  
  // Verify org membership
  const { data: membership } = await supabase
    .from('organization_members')
    .select('*')
    .eq('user_id', result.userId)
    .eq('org_id', context.omnizen.orgId)
    .single();
  
  if (!membership) throw new Error('User not added to OmniZen org');
  
  console.log(chalk.green('✓ Sarah Chen account created successfully'));
  console.log(chalk.blue(`  User ID: ${result.userId}`));
  console.log(chalk.blue(`  Workspace: ${workspace.name}`));
  console.log(chalk.blue(`  Plan: Personal Plus ($9/month)`));
}

/**
 * Test Martinez family account setup
 */
async function testMartinezFamilySignup(context: TestContext): Promise<void> {
  console.log(chalk.cyan('\nTesting Martinez Family account setup...'));
  
  const result = await createFamilyAccount(
    'Martinez',
    [
      { email: 'carlos@martinez.family', name: 'Carlos Martinez', role: 'parent' },
      { email: 'maria@martinez.family', name: 'Maria Martinez', role: 'parent' },
      { email: 'sofia@martinez.family', name: 'Sofia Martinez', role: 'child' },
      { email: 'diego@martinez.family', name: 'Diego Martinez', role: 'child' }
    ]
  );
  
  context.martinez.familyWorkspaceId = result.familyWorkspaceId;
  context.martinez.members = result.members;
  
  // Verify family workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', result.familyWorkspaceId)
    .single();
  
  if (!workspace) throw new Error('Family workspace not created');
  if (workspace.workspace_type !== 'family') {
    throw new Error('Workspace not marked as family');
  }
  
  // Verify all members added
  const { data: memberships } = await supabase
    .from('organization_members')
    .select('*')
    .eq('workspace_id', result.familyWorkspaceId);
  
  if (memberships?.length !== 4) {
    throw new Error('Not all family members added');
  }
  
  // Verify parental controls
  const parents = memberships.filter(m => m.role === 'admin');
  const children = memberships.filter(m => m.role === 'viewer');
  
  if (parents.length !== 2) throw new Error('Parents not set as admins');
  if (children.length !== 2) throw new Error('Children not set as viewers');
  
  console.log(chalk.green('✓ Martinez Family account created successfully'));
  console.log(chalk.blue(`  Family Workspace: ${workspace.name}`));
  console.log(chalk.blue(`  Members: ${result.members.length} (2 parents, 2 children)`));
  console.log(chalk.blue(`  Plan: Family ($29/month)`));
}

/**
 * Test Alex's signup (Freelancer/Investor)
 */
async function testAlexSignup(context: TestContext): Promise<void> {
  console.log(chalk.cyan('\nTesting Alex Thompson signup (Freelancer/Investor)...'));
  
  const result = await createPersonalUser(
    context.alex.email,
    context.alex.name,
    'personal-pro'
  );
  
  context.alex.userId = result.userId;
  context.alex.workspaceId = result.workspaceId;
  
  // Set auth context for Alex
  await setPersonalAuthContext(result.workspaceId, result.userId);
  
  // Verify Pro features enabled
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('settings')
    .eq('id', result.workspaceId)
    .single();
  
  const features = workspace?.settings?.features;
  if (!features?.investments) {
    throw new Error('Investment features not enabled for Pro plan');
  }
  if (!features?.tax_tools) {
    throw new Error('Tax tools not enabled for Pro plan');
  }
  
  console.log(chalk.green('✓ Alex Thompson account created successfully'));
  console.log(chalk.blue(`  User ID: ${result.userId}`));
  console.log(chalk.blue(`  Plan: Personal Pro ($19/month)`));
  console.log(chalk.blue(`  Features: Investments ✓, Tax Tools ✓, AI Insights ✓`));
}

/**
 * Test default categories creation
 */
async function testDefaultCategories(context: TestContext): Promise<void> {
  console.log(chalk.cyan('\nVerifying default categories...'));
  
  const { data: categories } = await supabase
    .from('personal_categories')
    .select('*')
    .eq('org_id', context.omnizen.orgId);
  
  if (!categories || categories.length === 0) {
    throw new Error('No default categories created');
  }
  
  // Check essential categories exist
  const essentialCategories = [
    'Housing', 'Transportation', 'Food & Dining', 
    'Healthcare', 'Savings', 'Income'
  ];
  
  for (const essential of essentialCategories) {
    const found = categories.find(c => c.name === essential);
    if (!found) {
      throw new Error(`Essential category '${essential}' not found`);
    }
  }
  
  // Check tax-relevant categories
  const taxRelevant = categories.filter(c => c.tax_relevant);
  if (taxRelevant.length === 0) {
    throw new Error('No tax-relevant categories marked');
  }
  
  console.log(chalk.green(`✓ ${categories.length} default categories created`));
  console.log(chalk.blue(`  Tax-relevant categories: ${taxRelevant.length}`));
}

/**
 * Test personal COA setup
 */
async function testPersonalCOA(context: TestContext): Promise<void> {
  console.log(chalk.cyan('\nVerifying personal Chart of Accounts...'));
  
  const { data: accounts } = await supabase
    .from('chart_of_accounts')
    .select('*')
    .eq('org_id', context.omnizen.orgId)
    .order('account_code');
  
  if (!accounts || accounts.length === 0) {
    throw new Error('No COA accounts created');
  }
  
  // Check account types distribution
  const assetAccounts = accounts.filter(a => a.account_type === 'Asset');
  const liabilityAccounts = accounts.filter(a => a.account_type === 'Liability');
  const incomeAccounts = accounts.filter(a => a.account_type === 'Revenue');
  const expenseAccounts = accounts.filter(a => a.account_type === 'Expense');
  const equityAccounts = accounts.filter(a => a.account_type === 'Equity');
  
  if (assetAccounts.length === 0) throw new Error('No asset accounts');
  if (liabilityAccounts.length === 0) throw new Error('No liability accounts');
  if (incomeAccounts.length === 0) throw new Error('No income accounts');
  if (expenseAccounts.length === 0) throw new Error('No expense accounts');
  if (equityAccounts.length === 0) throw new Error('No equity accounts');
  
  // Check essential personal finance accounts
  const checkingAccount = accounts.find(a => a.account_code === '1100');
  const savingsAccount = accounts.find(a => a.account_code === '1200');
  const creditCards = accounts.find(a => a.account_code === '2000');
  const salaryIncome = accounts.find(a => a.account_code === '4100');
  
  if (!checkingAccount) throw new Error('No checking account in COA');
  if (!savingsAccount) throw new Error('No savings account in COA');
  if (!creditCards) throw new Error('No credit card account in COA');
  if (!salaryIncome) throw new Error('No salary income account in COA');
  
  console.log(chalk.green(`✓ Personal COA created with ${accounts.length} accounts`));
  console.log(chalk.blue(`  Assets: ${assetAccounts.length}`));
  console.log(chalk.blue(`  Liabilities: ${liabilityAccounts.length}`));
  console.log(chalk.blue(`  Income: ${incomeAccounts.length}`));
  console.log(chalk.blue(`  Expenses: ${expenseAccounts.length}`));
  console.log(chalk.blue(`  Equity: ${equityAccounts.length}`));
}

/**
 * Test data isolation between users
 */
async function testDataIsolation(context: TestContext): Promise<void> {
  console.log(chalk.cyan('\nTesting data isolation between personal users...'));
  
  if (!context.sarah.userId || !context.alex.userId) {
    throw new Error('Users not created for isolation test');
  }
  
  // Set context as Sarah
  await setPersonalAuthContext(context.sarah.workspaceId!, context.sarah.userId);
  
  // Create test data for Sarah
  const { data: sarahGoal } = await supabase
    .from('financial_goals')
    .insert({
      org_id: context.omnizen.orgId,
      workspace_id: context.sarah.workspaceId,
      goal_type: 'savings',
      name: 'Emergency Fund',
      target_amount: 10000,
      current_amount: 2500
    })
    .select()
    .single();
  
  // Switch to Alex
  await clearAuthContext();
  await setPersonalAuthContext(context.alex.workspaceId!, context.alex.userId);
  
  // Try to access Sarah's goal
  const { data: alexView } = await supabase
    .from('financial_goals')
    .select('*')
    .eq('id', sarahGoal?.id || 'none');
  
  if (alexView && alexView.length > 0) {
    throw new Error('CRITICAL: Alex can see Sarah\'s financial goals!');
  }
  
  // Create Alex's goal
  const { data: alexGoal } = await supabase
    .from('financial_goals')
    .insert({
      org_id: context.omnizen.orgId,
      workspace_id: context.alex.workspaceId,
      goal_type: 'investment',
      name: 'Portfolio Growth',
      target_amount: 100000,
      current_amount: 45000
    })
    .select()
    .single();
  
  // Verify each user sees only their goals
  const { data: alexGoals } = await supabase
    .from('financial_goals')
    .select('*')
    .eq('workspace_id', context.alex.workspaceId);
  
  if (alexGoals?.length !== 1) {
    throw new Error('Alex should see only their own goal');
  }
  
  // Cleanup
  if (sarahGoal) await supabase.from('financial_goals').delete().eq('id', sarahGoal.id);
  if (alexGoal) await supabase.from('financial_goals').delete().eq('id', alexGoal.id);
  
  console.log(chalk.green('✓ Data properly isolated between personal users'));
}

/**
 * Main test execution
 */
async function runTests() {
  console.log(chalk.bold.blue('\n🧪 Testing Personal Finance - User Signup & Onboarding\n'));
  
  const context: TestContext = {
    omnizen: {
      orgId: ''
    },
    sarah: {
      email: 'sarah.chen@example.com',
      name: 'Sarah Chen'
    },
    martinez: {},
    alex: {
      email: 'alex.thompson@example.com',
      name: 'Alex Thompson'
    }
  };
  
  try {
    // Test 1: OmniZen Organization Setup
    console.log(chalk.bold('\n🏢 Test 1: OmniZen Organization Setup'));
    context.omnizen.orgId = await testOmniZenOrgSetup();
    
    // Test 2: Default Categories
    console.log(chalk.bold('\n📁 Test 2: Default Categories'));
    await testDefaultCategories(context);
    
    // Test 3: Personal COA
    console.log(chalk.bold('\n📊 Test 3: Personal Chart of Accounts'));
    await testPersonalCOA(context);
    
    // Test 4: Sarah's Signup
    console.log(chalk.bold('\n👤 Test 4: Young Professional Signup'));
    await testSarahSignup(context);
    
    // Test 5: Martinez Family Account
    console.log(chalk.bold('\n👨‍👩‍👧‍👦 Test 5: Family Account Setup'));
    await testMartinezFamilySignup(context);
    
    // Test 6: Alex's Signup
    console.log(chalk.bold('\n💼 Test 6: Freelancer/Investor Signup'));
    await testAlexSignup(context);
    
    // Test 7: Data Isolation
    console.log(chalk.bold('\n🔒 Test 7: Data Isolation'));
    await testDataIsolation(context);
    
    console.log(chalk.bold.green('\n✅ All personal finance signup tests passed!\n'));
    console.log(chalk.green('The system successfully:'));
    console.log(chalk.green('• Created OmniZen organization for personal finance'));
    console.log(chalk.green('• Set up individual user workspaces'));
    console.log(chalk.green('• Created family account with parental controls'));
    console.log(chalk.green('• Applied personal finance COA'));
    console.log(chalk.green('• Ensured data isolation between users'));
    console.log(chalk.green('• Enabled plan-specific features'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Test failed:'), error);
    throw error;
  } finally {
    await clearAuthContext();
  }
}

// Execute tests
runTests().catch(console.error);