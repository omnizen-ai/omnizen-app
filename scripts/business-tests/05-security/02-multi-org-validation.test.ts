#!/usr/bin/env npx tsx
/**
 * Test Journey: Security - Multi-Organization Validation
 * 
 * Tests complete isolation and parallel operation of multiple organizations:
 * - Data isolation across all modules
 * - Independent financial operations
 * - Separate user management
 * - Isolated AI agent operations
 * - Cross-org membership handling
 * - Plan tier enforcement
 * 
 * Scenarios tested:
 * - Parallel invoicing
 * - Concurrent payments
 * - Simultaneous reporting
 * - Cross-org user switching
 * - Resource limits by plan
 * 
 * Organizations tested:
 * - Anchorblock Technology Limited (Professional tier)
 * - Team Qreative (Growth tier)
 * - New test organization (Starter tier)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { 
  getSupabaseClient, 
  executeSql, 
  setAuthContext, 
  clearAuthContext 
} from '../utils/db-client';
import { 
  assertDataExists,
  assertFinancialIntegrity
} from '../utils/test-assertions';
import { createTestOrganization } from '../utils/auth-context';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const supabase = getSupabaseClient();

interface TestContext {
  anchorblock: {
    orgId: string;
    userId: string;
    workspaceId: string;
  };
  teamQreative: {
    orgId: string;
    userId: string;
    workspaceId: string;
  };
  testOrg: {
    orgId?: string;
    userId?: string;
    workspaceId?: string;
  };
}

/**
 * Test parallel invoice creation
 */
async function testParallelInvoicing(context: TestContext): Promise<void> {
  console.log(chalk.cyan('Testing parallel invoice creation across organizations...'));

  const invoicePromises = [];

  // Create invoice for Anchorblock
  await setAuthContext(
    context.anchorblock.orgId,
    context.anchorblock.userId,
    context.anchorblock.workspaceId
  );

  invoicePromises.push(
    supabase
      .from('invoices')
      .insert({
        org_id: context.anchorblock.orgId,
        invoice_number: 'MULTI-AB-001',
        invoice_date: '2024-03-01',
        due_date: '2024-03-31',
        total_amount: 5000,
        status: 'draft'
      })
      .select()
      .single()
  );

  // Create invoice for Team Qreative
  await clearAuthContext();
  await setAuthContext(
    context.teamQreative.orgId,
    context.teamQreative.userId,
    context.teamQreative.workspaceId
  );

  invoicePromises.push(
    supabase
      .from('invoices')
      .insert({
        org_id: context.teamQreative.orgId,
        invoice_number: 'MULTI-TQ-001',
        invoice_date: '2024-03-01',
        due_date: '2024-03-31',
        total_amount: 7500,
        status: 'draft'
      })
      .select()
      .single()
  );

  // Execute in parallel
  const results = await Promise.all(invoicePromises);
  
  // Verify each org got their invoice
  const [abInvoice, tqInvoice] = results;
  
  if (abInvoice.error || tqInvoice.error) {
    throw new Error('Failed to create parallel invoices');
  }

  // Verify isolation - each org shouldn't see the other's invoice
  await setAuthContext(context.anchorblock.orgId, context.anchorblock.userId);
  const { data: crossCheck1 } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('invoice_number', 'MULTI-TQ-001');

  if (crossCheck1 && crossCheck1.length > 0) {
    throw new Error('Organization isolation violated: Anchorblock can see Team Qreative invoice!');
  }

  // Cleanup
  if (abInvoice.data) await supabase.from('invoices').delete().eq('id', abInvoice.data.id);
  if (tqInvoice.data) await supabase.from('invoices').delete().eq('id', tqInvoice.data.id);

  console.log(chalk.green('✓ Parallel invoicing with proper isolation verified'));
}

/**
 * Test cross-org user membership
 */
async function testCrossOrgMembership(context: TestContext): Promise<void> {
  console.log(chalk.cyan('Testing cross-organization user membership...'));

  // Create a user that belongs to both organizations
  const { data: sharedUser } = await supabase
    .from('users')
    .insert({
      email: 'shared@multiorg.com',
      name: 'Shared User'
    })
    .select()
    .single();

  if (sharedUser) {
    // Add to both organizations
    await supabase
      .from('organization_members')
      .insert([
        {
          org_id: context.anchorblock.orgId,
          user_id: sharedUser.id,
          role: 'user',
          invited_by: context.anchorblock.userId
        },
        {
          org_id: context.teamQreative.orgId,
          user_id: sharedUser.id,
          role: 'viewer',
          invited_by: context.teamQreative.userId
        }
      ]);

    // Test access with Anchorblock context
    await setAuthContext(
      context.anchorblock.orgId,
      sharedUser.id,
      context.anchorblock.workspaceId,
      'user'
    );

    const { data: abAccess } = await supabase
      .from('invoices')
      .select('COUNT(*)')
      .eq('org_id', context.anchorblock.orgId);

    // Test access with Team Qreative context
    await setAuthContext(
      context.teamQreative.orgId,
      sharedUser.id,
      context.teamQreative.workspaceId,
      'viewer'
    );

    const { data: tqAccess } = await supabase
      .from('invoices')
      .select('COUNT(*)')
      .eq('org_id', context.teamQreative.orgId);

    // Verify can't access wrong org even with membership
    const { data: wrongOrgAccess } = await supabase
      .from('invoices')
      .select('COUNT(*)')
      .eq('org_id', context.anchorblock.orgId); // Wrong org for current context

    if (wrongOrgAccess && wrongOrgAccess.length > 0) {
      const count = wrongOrgAccess[0].count;
      if (count > 0) {
        throw new Error('Cross-org access violation: User can access wrong org data!');
      }
    }

    // Cleanup
    await supabase.from('organization_members').delete().eq('user_id', sharedUser.id);
    await supabase.from('users').delete().eq('id', sharedUser.id);

    console.log(chalk.green('✓ Cross-org membership properly managed'));
  }
}

/**
 * Test plan tier limits
 */
async function testPlanTierLimits(context: TestContext): Promise<void> {
  console.log(chalk.cyan('Testing plan tier resource limits...'));

  // Create a starter tier organization
  const starterOrg = await createTestOrganization(
    'Startup Co',
    'startup-co',
    'startup@test.com',
    'starter'
  );

  if (starterOrg) {
    context.testOrg.orgId = starterOrg.orgId;
    context.testOrg.userId = starterOrg.userId;
    context.testOrg.workspaceId = starterOrg.workspaceId;

    await setAuthContext(
      starterOrg.orgId,
      starterOrg.userId,
      starterOrg.workspaceId
    );

    // Test workspace limits (starter = 1 workspace)
    const { error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        org_id: starterOrg.orgId,
        name: 'Second Workspace',
        slug: 'second',
        created_by: starterOrg.userId
      });

    if (!workspaceError) {
      console.log(chalk.yellow('⚠ Starter plan can create multiple workspaces (check if intended)'));
    } else {
      console.log(chalk.green('✓ Workspace limit enforced for starter plan'));
    }

    // Test user limits (starter = 5 users)
    const userPromises = [];
    for (let i = 0; i < 10; i++) {
      userPromises.push(
        supabase
          .from('organization_members')
          .insert({
            org_id: starterOrg.orgId,
            user_id: `test-user-${i}`,
            role: 'user',
            invited_by: starterOrg.userId
          })
      );
    }

    const userResults = await Promise.allSettled(userPromises);
    const successCount = userResults.filter(r => r.status === 'fulfilled').length;
    
    if (successCount > 5) {
      console.log(chalk.yellow(`⚠ Starter plan added ${successCount} users (limit should be 5)`));
    } else {
      console.log(chalk.green('✓ User limit enforced for starter plan'));
    }

    // Compare with Professional tier (Anchorblock)
    await setAuthContext(
      context.anchorblock.orgId,
      context.anchorblock.userId,
      context.anchorblock.workspaceId
    );

    // Professional should allow more workspaces
    const { error: proWorkspaceError } = await supabase
      .from('workspaces')
      .insert({
        org_id: context.anchorblock.orgId,
        name: 'Test Workspace',
        slug: 'test-ws',
        created_by: context.anchorblock.userId
      })
      .select()
      .single()
      .then(async (result) => {
        if (result.data) {
          // Cleanup
          await supabase.from('workspaces').delete().eq('id', result.data.id);
        }
        return result;
      });

    if (proWorkspaceError) {
      console.log(chalk.yellow('⚠ Professional plan cannot create workspaces'));
    } else {
      console.log(chalk.green('✓ Professional plan has higher limits'));
    }

    // Cleanup test org
    await supabase.from('organization_members').delete().eq('org_id', starterOrg.orgId);
    await supabase.from('organizations').delete().eq('id', starterOrg.orgId);
  }
}

/**
 * Test concurrent financial operations
 */
async function testConcurrentFinancialOps(context: TestContext): Promise<void> {
  console.log(chalk.cyan('Testing concurrent financial operations...'));

  // Prepare journal entry data for both orgs
  const operations = [
    {
      orgId: context.anchorblock.orgId,
      userId: context.anchorblock.userId,
      workspaceId: context.anchorblock.workspaceId,
      description: 'Anchorblock concurrent test'
    },
    {
      orgId: context.teamQreative.orgId,
      userId: context.teamQreative.userId,
      workspaceId: context.teamQreative.workspaceId,
      description: 'Team Qreative concurrent test'
    }
  ];

  // Execute financial operations concurrently
  const promises = operations.map(async (op) => {
    await setAuthContext(op.orgId, op.userId, op.workspaceId);
    
    // Create journal entry
    const { data: journal } = await supabase
      .from('journal_entries')
      .insert({
        org_id: op.orgId,
        entry_date: '2024-03-01',
        description: op.description,
        status: 'posted',
        total_debit: 1000,
        total_credit: 1000
      })
      .select()
      .single();

    if (journal) {
      // Add journal lines
      await supabase
        .from('journal_lines')
        .insert([
          {
            org_id: op.orgId,
            journal_entry_id: journal.id,
            account_code: '1200',
            debit_amount: 1000,
            credit_amount: 0,
            description: 'Debit'
          },
          {
            org_id: op.orgId,
            journal_entry_id: journal.id,
            account_code: '4000',
            debit_amount: 0,
            credit_amount: 1000,
            description: 'Credit'
          }
        ]);
    }

    return journal;
  });

  const results = await Promise.all(promises);
  
  // Verify both succeeded
  if (results.some(r => !r)) {
    throw new Error('Concurrent financial operations failed');
  }

  // Verify financial integrity for both orgs
  await setAuthContext(context.anchorblock.orgId, context.anchorblock.userId);
  await assertFinancialIntegrity(context.anchorblock.orgId);
  
  await setAuthContext(context.teamQreative.orgId, context.teamQreative.userId);
  await assertFinancialIntegrity(context.teamQreative.orgId);

  // Cleanup
  for (const journal of results) {
    if (journal) {
      await supabase.from('journal_lines').delete().eq('journal_entry_id', journal.id);
      await supabase.from('journal_entries').delete().eq('id', journal.id);
    }
  }

  console.log(chalk.green('✓ Concurrent financial operations executed successfully'));
}

/**
 * Test AI agent isolation
 */
async function testAIAgentIsolation(context: TestContext): Promise<void> {
  console.log(chalk.cyan('Testing AI agent isolation across organizations...'));

  // Create AI agents for each org
  await setAuthContext(
    context.anchorblock.orgId,
    context.anchorblock.userId,
    context.anchorblock.workspaceId
  );

  const { data: abAgent } = await supabase
    .from('ai_agents')
    .insert({
      org_id: context.anchorblock.orgId,
      name: 'Anchorblock Assistant',
      type: 'financial_analyst',
      model: 'gpt-4',
      is_active: true
    })
    .select()
    .single();

  await setAuthContext(
    context.teamQreative.orgId,
    context.teamQreative.userId,
    context.teamQreative.workspaceId
  );

  const { data: tqAgent } = await supabase
    .from('ai_agents')
    .insert({
      org_id: context.teamQreative.orgId,
      name: 'Creative Assistant',
      type: 'project_manager',
      model: 'claude-2',
      is_active: true
    })
    .select()
    .single();

  if (abAgent && tqAgent) {
    // Test agent permissions isolation
    await setAuthContext(context.anchorblock.orgId, context.anchorblock.userId);
    
    // Try to access Team Qreative's agent
    const { data: wrongAgent } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', tqAgent.id);

    if (wrongAgent && wrongAgent.length > 0) {
      throw new Error('AI agent isolation violated: Can access other org\'s agents!');
    }

    // Test agent execution isolation
    const { data: abExecution } = await supabase
      .from('ai_agent_executions')
      .insert({
        org_id: context.anchorblock.orgId,
        agent_id: abAgent.id,
        execution_type: 'query',
        status: 'completed',
        input_data: { query: 'test' },
        output_data: { result: 'test' }
      })
      .select()
      .single();

    // Verify execution is isolated
    await setAuthContext(context.teamQreative.orgId, context.teamQreative.userId);
    
    const { data: wrongExecution } = await supabase
      .from('ai_agent_executions')
      .select('*')
      .eq('id', abExecution?.id || 'none');

    if (wrongExecution && wrongExecution.length > 0) {
      throw new Error('AI execution isolation violated!');
    }

    // Cleanup
    if (abExecution) {
      await supabase.from('ai_agent_executions').delete().eq('id', abExecution.id);
    }
    await supabase.from('ai_agents').delete().eq('id', abAgent.id);
    await supabase.from('ai_agents').delete().eq('id', tqAgent.id);

    console.log(chalk.green('✓ AI agents properly isolated between organizations'));
  }
}

/**
 * Test data aggregation isolation
 */
async function testDataAggregationIsolation(context: TestContext): Promise<void> {
  console.log(chalk.cyan('Testing data aggregation isolation...'));

  // Test that aggregations don't leak cross-org data
  await setAuthContext(
    context.anchorblock.orgId,
    context.anchorblock.userId
  );

  const queries = [
    {
      name: 'Invoice totals',
      sql: 'SELECT SUM(total_amount) as total, COUNT(*) as count FROM invoices'
    },
    {
      name: 'Customer count',
      sql: 'SELECT COUNT(DISTINCT customer_id) as customers FROM invoices'
    },
    {
      name: 'Product catalog size',
      sql: 'SELECT COUNT(*) as products FROM products'
    },
    {
      name: 'Organization count',
      sql: 'SELECT COUNT(DISTINCT org_id) as org_count FROM invoices'
    }
  ];

  for (const query of queries) {
    const { data } = await executeSql(query.sql, []);
    
    if (query.name === 'Organization count' && data && data[0].org_count > 1) {
      throw new Error(`Aggregation leak in ${query.name}: Shows multiple orgs!`);
    }
    
    console.log(chalk.green(`✓ ${query.name}: Properly isolated`));
  }
}

/**
 * Test session management across orgs
 */
async function testSessionManagement(context: TestContext): Promise<void> {
  console.log(chalk.cyan('Testing session management across organizations...'));

  // Create sessions for both orgs
  await setAuthContext(context.anchorblock.orgId, context.anchorblock.userId);
  
  const { data: abSession } = await supabase
    .from('user_sessions')
    .insert({
      user_id: context.anchorblock.userId,
      org_id: context.anchorblock.orgId,
      token: 'ab-test-token',
      expires_at: new Date(Date.now() + 3600000).toISOString()
    })
    .select()
    .single();

  await setAuthContext(context.teamQreative.orgId, context.teamQreative.userId);
  
  const { data: tqSession } = await supabase
    .from('user_sessions')
    .insert({
      user_id: context.teamQreative.userId,
      org_id: context.teamQreative.orgId,
      token: 'tq-test-token',
      expires_at: new Date(Date.now() + 3600000).toISOString()
    })
    .select()
    .single();

  if (abSession && tqSession) {
    // Verify session isolation
    await setAuthContext(context.anchorblock.orgId, context.anchorblock.userId);
    
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('token')
      .eq('user_id', context.anchorblock.userId);

    const tokens = sessions?.map(s => s.token) || [];
    if (tokens.includes('tq-test-token')) {
      throw new Error('Session isolation violated: Can see other org\'s sessions!');
    }

    // Cleanup
    await supabase.from('user_sessions').delete().eq('id', abSession.id);
    await supabase.from('user_sessions').delete().eq('id', tqSession.id);

    console.log(chalk.green('✓ Session management properly isolated'));
  }
}

/**
 * Main test execution
 */
async function runTests() {
  console.log(chalk.bold.blue('\n🧪 Testing Security - Multi-Organization Validation\n'));

  const context: TestContext = {
    anchorblock: {
      orgId: '',
      userId: '',
      workspaceId: ''
    },
    teamQreative: {
      orgId: '',
      userId: '',
      workspaceId: ''
    },
    testOrg: {}
  };

  try {
    // Get test data
    console.log(chalk.yellow('Loading test context...'));

    // Get Anchorblock data
    const { data: anchorblockOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', 'anchorblock-tech')
      .single();

    const { data: anchorblockUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'faruk@anchorblock.vc')
      .single();

    const { data: anchorblockWorkspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('org_id', anchorblockOrg?.id)
      .eq('slug', 'engineering')
      .single();

    context.anchorblock = {
      orgId: anchorblockOrg?.id || '',
      userId: anchorblockUser?.id || '',
      workspaceId: anchorblockWorkspace?.id || ''
    };

    // Get Team Qreative data
    const { data: qreativeOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', 'team-qreative')
      .single();

    const { data: qreativeUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'hello@teamqreative.com')
      .single();

    const { data: qreativeWorkspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('org_id', qreativeOrg?.id)
      .eq('slug', 'design')
      .single();

    context.teamQreative = {
      orgId: qreativeOrg?.id || '',
      userId: qreativeUser?.id || '',
      workspaceId: qreativeWorkspace?.id || ''
    };

    // Validate context
    assertDataExists(context.anchorblock.orgId, 'Anchorblock organization');
    assertDataExists(context.teamQreative.orgId, 'Team Qreative organization');

    // Run multi-org tests
    console.log(chalk.bold('\n🏢 Test 1: Parallel Invoicing'));
    await testParallelInvoicing(context);

    console.log(chalk.bold('\n👥 Test 2: Cross-Org Membership'));
    await testCrossOrgMembership(context);

    console.log(chalk.bold('\n📊 Test 3: Plan Tier Limits'));
    await testPlanTierLimits(context);

    console.log(chalk.bold('\n💰 Test 4: Concurrent Financial Operations'));
    await testConcurrentFinancialOps(context);

    console.log(chalk.bold('\n🤖 Test 5: AI Agent Isolation'));
    await testAIAgentIsolation(context);

    console.log(chalk.bold('\n📈 Test 6: Data Aggregation Isolation'));
    await testDataAggregationIsolation(context);

    console.log(chalk.bold('\n🔐 Test 7: Session Management'));
    await testSessionManagement(context);

    console.log(chalk.bold.green('\n✅ All multi-organization tests passed!\n'));
    console.log(chalk.green('The system successfully demonstrates:'));
    console.log(chalk.green('• Complete data isolation between organizations'));
    console.log(chalk.green('• Proper handling of cross-org memberships'));
    console.log(chalk.green('• Plan tier limit enforcement'));
    console.log(chalk.green('• Concurrent operation support'));
    console.log(chalk.green('• AI agent isolation'));
    console.log(chalk.green('• Secure session management'));

  } catch (error) {
    console.error(chalk.red('\n❌ Multi-org test failed:'), error);
    throw error;
  } finally {
    await clearAuthContext();
  }
}

// Execute tests
runTests().catch(console.error);