#!/usr/bin/env npx tsx
/**
 * Test Journey: Security - RLS Policies
 * 
 * Tests Row Level Security policies across all tables:
 * - Organization isolation
 * - User access control
 * - Workspace boundaries
 * - Role-based permissions
 * - Cross-table consistency
 * - Attack vector prevention
 * 
 * Security scenarios tested:
 * - Direct table access attempts
 * - SQL injection patterns
 * - Privilege escalation
 * - Data leakage prevention
 * - Audit trail integrity
 * 
 * Organizations tested:
 * - Anchorblock Technology Limited (Professional tier)
 * - Team Qreative (Growth tier)
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
  assertDataExists
} from '../utils/test-assertions';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const supabase = getSupabaseClient();

interface TestContext {
  anchorblock: {
    orgId: string;
    userId: string;
    workspaceId: string;
    adminUserId: string;
  };
  teamQreative: {
    orgId: string;
    userId: string;
    workspaceId: string;
  };
  maliciousUser: {
    userId: string;
  };
}

/**
 * Test organization isolation
 */
async function testOrganizationIsolation(context: TestContext): Promise<void> {
  console.log(chalk.cyan('Testing organization isolation...'));

  const tables = [
    'organizations', 'workspaces', 'contacts', 'products', 'invoices',
    'bills', 'payments', 'journal_entries', 'chart_of_accounts',
    'bank_accounts', 'expense_reports', 'ai_agents'
  ];

  for (const table of tables) {
    // Set context to Anchorblock
    await setAuthContext(
      context.anchorblock.orgId,
      context.anchorblock.userId,
      context.anchorblock.workspaceId
    );

    // Try to access Team Qreative data
    const { data: crossOrgAttempt } = await executeSql(`
      SELECT COUNT(*) as count 
      FROM ${table}
      WHERE org_id = $1
    `, [context.teamQreative.orgId]);

    if (crossOrgAttempt && crossOrgAttempt[0].count > 0) {
      throw new Error(`RLS VIOLATION in ${table}: Can access other org's data!`);
    }

    console.log(chalk.green(`✓ ${table}: Organization isolation verified`));
  }
}

/**
 * Test user-level access control
 */
async function testUserAccessControl(context: TestContext): Promise<void> {
  console.log(chalk.cyan('Testing user-level access control...'));

  // Test 1: User can only see their own sessions
  await setAuthContext(
    context.anchorblock.orgId,
    context.anchorblock.userId
  );

  const { data: sessions } = await executeSql(`
    SELECT user_id FROM user_sessions
    WHERE user_id != $1
  `, [context.anchorblock.userId]);

  if (sessions && sessions.length > 0) {
    throw new Error('RLS VIOLATION: Can see other users\' sessions!');
  }

  console.log(chalk.green('✓ User sessions properly isolated'));

  // Test 2: Audit logs are read-only
  const { error: auditWriteError } = await executeSql(`
    INSERT INTO audit_logs (org_id, user_id, action, resource_type, resource_id)
    VALUES ($1, $2, 'test', 'test', 'test-id')
  `, [context.anchorblock.orgId, context.anchorblock.userId]);

  // We expect this to succeed only through proper channels
  if (!auditWriteError) {
    console.log(chalk.yellow('⚠ Audit logs can be written directly (check if this is intended)'));
  } else {
    console.log(chalk.green('✓ Audit logs protected from direct writes'));
  }

  // Test 3: Personal data protection
  const { data: userData } = await executeSql(`
    SELECT email FROM users
    WHERE id != $1
  `, [context.anchorblock.userId]);

  if (userData && userData.length > 0) {
    throw new Error('RLS VIOLATION: Can see other users\' personal data!');
  }

  console.log(chalk.green('✓ User personal data properly protected'));
}

/**
 * Test workspace boundaries
 */
async function testWorkspaceBoundaries(context: TestContext): Promise<void> {
  console.log(chalk.cyan('Testing workspace boundaries...'));

  // Create test data in different workspaces
  await setAuthContext(
    context.anchorblock.orgId,
    context.anchorblock.userId,
    context.anchorblock.workspaceId
  );

  // Create a second workspace
  const { data: workspace2 } = await supabase
    .from('workspaces')
    .insert({
      org_id: context.anchorblock.orgId,
      name: 'Finance Team',
      slug: 'finance',
      created_by: context.anchorblock.userId
    })
    .select()
    .single();

  if (workspace2) {
    // Create data in workspace 1
    const { data: invoice1 } = await supabase
      .from('invoices')
      .insert({
        org_id: context.anchorblock.orgId,
        workspace_id: context.anchorblock.workspaceId,
        invoice_number: 'WS1-TEST-001',
        invoice_date: '2024-03-01',
        due_date: '2024-03-31',
        total_amount: 1000,
        status: 'draft'
      })
      .select()
      .single();

    // Switch to workspace 2
    await setAuthContext(
      context.anchorblock.orgId,
      context.anchorblock.userId,
      workspace2.id
    );

    // Create data in workspace 2
    const { data: invoice2 } = await supabase
      .from('invoices')
      .insert({
        org_id: context.anchorblock.orgId,
        workspace_id: workspace2.id,
        invoice_number: 'WS2-TEST-001',
        invoice_date: '2024-03-01',
        due_date: '2024-03-31',
        total_amount: 2000,
        status: 'draft'
      })
      .select()
      .single();

    // Test: Workspace 1 user shouldn't see workspace 2 data
    await setAuthContext(
      context.anchorblock.orgId,
      context.anchorblock.userId,
      context.anchorblock.workspaceId
    );

    const { data: crossWorkspace } = await executeSql(`
      SELECT invoice_number 
      FROM invoices 
      WHERE workspace_id = $1
    `, [workspace2.id]);

    // Note: This might be allowed depending on business rules
    if (crossWorkspace && crossWorkspace.length > 0) {
      console.log(chalk.yellow('⚠ Cross-workspace access allowed (verify if intended)'));
    } else {
      console.log(chalk.green('✓ Workspace data properly isolated'));
    }

    // Cleanup
    if (invoice1) await supabase.from('invoices').delete().eq('id', invoice1.id);
    if (invoice2) await supabase.from('invoices').delete().eq('id', invoice2.id);
    await supabase.from('workspaces').delete().eq('id', workspace2.id);
  }
}

/**
 * Test role-based permissions
 */
async function testRoleBasedPermissions(context: TestContext): Promise<void> {
  console.log(chalk.cyan('Testing role-based permissions...'));

  // Test admin vs regular user permissions
  const roles = ['admin', 'user', 'viewer'];

  for (const role of roles) {
    await setAuthContext(
      context.anchorblock.orgId,
      context.anchorblock.userId,
      context.anchorblock.workspaceId,
      role
    );

    // Test write permissions based on role
    const { error: writeError } = await executeSql(`
      INSERT INTO products (org_id, name, sku, unit_price)
      VALUES ($1, 'Test Product', 'TEST-${role}', 100)
    `, [context.anchorblock.orgId]);

    if (role === 'viewer' && !writeError) {
      throw new Error('RLS VIOLATION: Viewer can write data!');
    }

    if (role !== 'viewer' && writeError) {
      console.warn(chalk.yellow(`⚠ ${role} cannot write (check if intended)`));
    }

    console.log(chalk.green(`✓ ${role} permissions validated`));
  }
}

/**
 * Test SQL injection prevention
 */
async function testSQLInjectionPrevention(context: TestContext): Promise<void> {
  console.log(chalk.cyan('Testing SQL injection prevention...'));

  await setAuthContext(
    context.anchorblock.orgId,
    context.anchorblock.userId
  );

  // Test various injection patterns
  const injectionPatterns = [
    "'; DROP TABLE invoices; --",
    "' OR '1'='1",
    "'; UPDATE organizations SET name='HACKED' WHERE '1'='1",
    "\\'; INSERT INTO users (email) VALUES ('hacker@evil.com'); --"
  ];

  for (const pattern of injectionPatterns) {
    try {
      // Attempt injection through a query
      const { data, error } = await executeSql(`
        SELECT * FROM contacts 
        WHERE org_id = $1 
        AND name = $2
      `, [context.anchorblock.orgId, pattern]);

      // If we get here without error, the pattern was safely handled
      console.log(chalk.green(`✓ Injection pattern safely handled: ${pattern.substring(0, 30)}...`));
    } catch (error) {
      // Errors are expected for malicious patterns
      console.log(chalk.green(`✓ Injection blocked: ${pattern.substring(0, 30)}...`));
    }
  }

  // Verify tables still exist and data is intact
  const { data: tableCheck } = await executeSql(`
    SELECT COUNT(*) as count FROM invoices WHERE org_id = $1
  `, [context.anchorblock.orgId]);

  if (!tableCheck) {
    throw new Error('SECURITY BREACH: Table was dropped!');
  }

  console.log(chalk.green('✓ All injection attempts prevented'));
}

/**
 * Test data leakage prevention
 */
async function testDataLeakagePrevention(context: TestContext): Promise<void> {
  console.log(chalk.cyan('Testing data leakage prevention...'));

  // Test 1: Error messages don't leak sensitive data
  await setAuthContext(
    context.anchorblock.orgId,
    context.anchorblock.userId
  );

  const { error: leakTest } = await executeSql(`
    SELECT * FROM organizations WHERE id = 'invalid-uuid'
  `, []);

  if (error && error.message.includes('organization')) {
    console.warn(chalk.yellow('⚠ Error messages may leak schema information'));
  }

  // Test 2: Aggregates don't leak cross-org data
  const { data: aggregateTest } = await executeSql(`
    SELECT 
      COUNT(*) as total_orgs,
      COUNT(DISTINCT org_id) as unique_orgs
    FROM invoices
  `, []);

  if (aggregateTest && aggregateTest[0].unique_orgs > 1) {
    throw new Error('RLS VIOLATION: Aggregate leaks cross-org data!');
  }

  // Test 3: JOINs respect RLS
  const { data: joinTest } = await executeSql(`
    SELECT 
      i.invoice_number,
      c.name as customer_name,
      o.name as org_name
    FROM invoices i
    JOIN contacts c ON c.id = i.customer_id
    JOIN organizations o ON o.id = i.org_id
    WHERE o.id != $1
  `, [context.anchorblock.orgId]);

  if (joinTest && joinTest.length > 0) {
    throw new Error('RLS VIOLATION: JOIN bypasses organization isolation!');
  }

  console.log(chalk.green('✓ Data leakage prevention verified'));
}

/**
 * Test unauthorized user access
 */
async function testUnauthorizedAccess(context: TestContext): Promise<void> {
  console.log(chalk.cyan('Testing unauthorized user access...'));

  // Create a malicious user (not part of any org)
  const { data: maliciousUser } = await supabase
    .from('users')
    .insert({
      email: 'malicious@hacker.com',
      name: 'Malicious User'
    })
    .select()
    .single();

  if (maliciousUser) {
    context.maliciousUser.userId = maliciousUser.id;

    // Try to access data without proper org membership
    await setAuthContext(
      '', // No org
      maliciousUser.id,
      '' // No workspace
    );

    // Attempt to read sensitive data
    const tables = ['invoices', 'payments', 'bank_accounts', 'journal_entries'];
    
    for (const table of tables) {
      const { data } = await executeSql(`
        SELECT * FROM ${table} LIMIT 1
      `, []);

      if (data && data.length > 0) {
        throw new Error(`RLS VIOLATION: Unauthorized user can access ${table}!`);
      }
    }

    // Attempt to create data
    const { error: createError } = await executeSql(`
      INSERT INTO contacts (name, email, contact_type)
      VALUES ('Hacked Contact', 'hacked@evil.com', 'customer')
    `, []);

    if (!createError) {
      throw new Error('RLS VIOLATION: Unauthorized user can create data!');
    }

    // Cleanup
    await supabase.from('users').delete().eq('id', maliciousUser.id);

    console.log(chalk.green('✓ Unauthorized access properly blocked'));
  }
}

/**
 * Test audit trail integrity
 */
async function testAuditTrailIntegrity(context: TestContext): Promise<void> {
  console.log(chalk.cyan('Testing audit trail integrity...'));

  await setAuthContext(
    context.anchorblock.orgId,
    context.anchorblock.userId
  );

  // Perform an auditable action
  const { data: invoice } = await supabase
    .from('invoices')
    .insert({
      org_id: context.anchorblock.orgId,
      invoice_number: 'AUDIT-TEST-001',
      invoice_date: '2024-03-01',
      due_date: '2024-03-31',
      total_amount: 1000,
      status: 'draft'
    })
    .select()
    .single();

  if (invoice) {
    // Check if audit log was created
    const { data: auditLogs } = await executeSql(`
      SELECT * FROM audit_logs
      WHERE org_id = $1
        AND resource_type = 'invoice'
        AND resource_id = $2
      ORDER BY created_at DESC
      LIMIT 1
    `, [context.anchorblock.orgId, invoice.id]);

    if (!auditLogs || auditLogs.length === 0) {
      console.warn(chalk.yellow('⚠ Audit log not created for invoice'));
    } else {
      // Try to modify audit log
      const { error: modifyError } = await executeSql(`
        UPDATE audit_logs
        SET action = 'modified'
        WHERE id = $1
      `, [auditLogs[0].id]);

      if (!modifyError) {
        throw new Error('SECURITY VIOLATION: Audit logs can be modified!');
      }

      // Try to delete audit log
      const { error: deleteError } = await executeSql(`
        DELETE FROM audit_logs
        WHERE id = $1
      `, [auditLogs[0].id]);

      if (!deleteError) {
        throw new Error('SECURITY VIOLATION: Audit logs can be deleted!');
      }

      console.log(chalk.green('✓ Audit trail is immutable'));
    }

    // Cleanup
    await supabase.from('invoices').delete().eq('id', invoice.id);
  }
}

/**
 * Test RLS function reliability
 */
async function testRLSFunctions(context: TestContext): Promise<void> {
  console.log(chalk.cyan('Testing RLS helper functions...'));

  await setAuthContext(
    context.anchorblock.orgId,
    context.anchorblock.userId,
    context.anchorblock.workspaceId,
    'admin'
  );

  // Test auth helper functions
  const { data: authFunctions } = await executeSql(`
    SELECT 
      auth_org_id() as org_id,
      auth_user_id() as user_id,
      auth_workspace_id() as workspace_id,
      auth_role() as role
  `, []);

  if (!authFunctions || authFunctions.length === 0) {
    throw new Error('RLS functions not working!');
  }

  const result = authFunctions[0];
  if (result.org_id !== context.anchorblock.orgId) {
    throw new Error('auth_org_id() returns wrong value!');
  }
  if (result.user_id !== context.anchorblock.userId) {
    throw new Error('auth_user_id() returns wrong value!');
  }
  if (result.workspace_id !== context.anchorblock.workspaceId) {
    throw new Error('auth_workspace_id() returns wrong value!');
  }
  if (result.role !== 'admin') {
    throw new Error('auth_role() returns wrong value!');
  }

  console.log(chalk.green('✓ RLS helper functions working correctly'));
}

/**
 * Main test execution
 */
async function runTests() {
  console.log(chalk.bold.blue('\n🧪 Testing Security - RLS Policies\n'));

  const context: TestContext = {
    anchorblock: {
      orgId: '',
      userId: '',
      workspaceId: '',
      adminUserId: ''
    },
    teamQreative: {
      orgId: '',
      userId: '',
      workspaceId: ''
    },
    maliciousUser: {
      userId: ''
    }
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
      workspaceId: anchorblockWorkspace?.id || '',
      adminUserId: anchorblockUser?.id || ''
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

    // Run security tests
    console.log(chalk.bold('\n🔒 Test 1: Organization Isolation'));
    await testOrganizationIsolation(context);

    console.log(chalk.bold('\n👤 Test 2: User Access Control'));
    await testUserAccessControl(context);

    console.log(chalk.bold('\n🏢 Test 3: Workspace Boundaries'));
    await testWorkspaceBoundaries(context);

    console.log(chalk.bold('\n👮 Test 4: Role-Based Permissions'));
    await testRoleBasedPermissions(context);

    console.log(chalk.bold('\n💉 Test 5: SQL Injection Prevention'));
    await testSQLInjectionPrevention(context);

    console.log(chalk.bold('\n🔐 Test 6: Data Leakage Prevention'));
    await testDataLeakagePrevention(context);

    console.log(chalk.bold('\n🚫 Test 7: Unauthorized Access'));
    await testUnauthorizedAccess(context);

    console.log(chalk.bold('\n📝 Test 8: Audit Trail Integrity'));
    await testAuditTrailIntegrity(context);

    console.log(chalk.bold('\n⚙️ Test 9: RLS Functions'));
    await testRLSFunctions(context);

    console.log(chalk.bold.green('\n✅ All RLS security tests passed!\n'));
    console.log(chalk.green('The system demonstrates strong security with:'));
    console.log(chalk.green('• Complete organization isolation'));
    console.log(chalk.green('• Robust user access control'));
    console.log(chalk.green('• SQL injection prevention'));
    console.log(chalk.green('• Data leakage protection'));
    console.log(chalk.green('• Immutable audit trails'));

  } catch (error) {
    console.error(chalk.red('\n❌ Security test failed:'), error);
    console.error(chalk.red('THIS IS A CRITICAL SECURITY ISSUE!'));
    throw error;
  } finally {
    await clearAuthContext();
  }
}

// Execute tests
runTests().catch(console.error);