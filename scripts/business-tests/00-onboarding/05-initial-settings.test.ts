/**
 * Test: Initial Settings Configuration
 * Tests setting up initial organization preferences and defaults
 */

import { supabaseAdmin } from '../utils/db-client'
import { createTestOrganization } from '../utils/auth-context'
import { runTestSuite, assertEqual, assertTrue } from '../utils/test-assertions'
import { cleanupBySlug } from '../utils/cleanup'

async function testDefaultSettings() {
  const { org } = await createTestOrganization(
    'Anchorblock Technology Limited',
    'anchorblock-settings',
    'admin@anchorblock.ai',
    'professional'
  )
  
  // Verify default settings are applied
  assertTrue(org.is_active, 'Organization should be active by default')
  assertEqual(org.currency, 'USD', 'Default currency should be USD')
  assertEqual(org.timezone, 'America/New_York', 'Default timezone should be set')
  assertEqual(org.fiscal_year_start, 1, 'Default fiscal year should start in January')
  assertEqual(org.data_retention_days, 730, 'Professional plan should have 730 days retention')
  
  return org
}

async function testInvoiceSettings() {
  const { org } = await createTestOrganization(
    'Invoice Settings Org',
    'invoice-settings',
    'admin@invoice.ai',
    'growth'
  )
  
  // Configure invoice settings
  const invoiceSettings = {
    invoice_prefix: 'INV',
    next_invoice_number: 1001,
    default_payment_terms: 30,
    late_fee_percentage: 1.5,
    invoice_footer: 'Thank you for your business!',
    auto_send_reminders: true,
    reminder_days: [7, 3, 0], // 7 days before, 3 days before, on due date
    default_tax_rate: 8.5
  }
  
  const { data: updated } = await supabaseAdmin
    .from('organizations')
    .update({
      feature_flags: {
        ...org.feature_flags,
        invoice_settings: invoiceSettings
      }
    })
    .eq('id', org.id)
    .select()
    .single()
  
  const settings = updated.feature_flags.invoice_settings
  assertEqual(settings.invoice_prefix, 'INV', 'Invoice prefix should be INV')
  assertEqual(settings.next_invoice_number, 1001, 'Next invoice number should be 1001')
  assertEqual(settings.default_payment_terms, 30, 'Payment terms should be Net 30')
  assertTrue(settings.auto_send_reminders, 'Auto reminders should be enabled')
  
  return updated
}

async function testBillSettings() {
  const { org } = await createTestOrganization(
    'Bill Settings Org',
    'bill-settings',
    'admin@bills.ai',
    'growth'
  )
  
  // Configure bill/expense settings
  const billSettings = {
    bill_prefix: 'BILL',
    require_approval: true,
    approval_threshold: 5000, // Amounts over $5000 need approval
    default_expense_account: null, // Will be set after COA creation
    auto_categorize: true,
    duplicate_detection: true,
    receipt_required_threshold: 100 // Receipts required for expenses over $100
  }
  
  const { data: updated } = await supabaseAdmin
    .from('organizations')
    .update({
      feature_flags: {
        ...org.feature_flags,
        bill_settings: billSettings
      }
    })
    .eq('id', org.id)
    .select()
    .single()
  
  const settings = updated.feature_flags.bill_settings
  assertTrue(settings.require_approval, 'Bill approval should be required')
  assertEqual(settings.approval_threshold, 5000, 'Approval threshold should be $5000')
  assertTrue(settings.duplicate_detection, 'Duplicate detection should be enabled')
  
  return updated
}

async function testNotificationPreferences() {
  const { org } = await createTestOrganization(
    'Notification Org',
    'notification-settings',
    'admin@notify.ai',
    'professional'
  )
  
  // Set notification preferences
  const notifications = {
    email_notifications: {
      new_invoice: true,
      payment_received: true,
      payment_overdue: true,
      bill_due: true,
      low_inventory: true,
      monthly_summary: true
    },
    notification_emails: ['admin@anchorblock.ai', 'cfo@anchorblock.ai'],
    slack_integration: {
      enabled: false,
      webhook_url: null,
      channels: {
        sales: '#sales',
        finance: '#finance'
      }
    },
    in_app_notifications: true
  }
  
  const { data: updated } = await supabaseAdmin
    .from('organizations')
    .update({
      feature_flags: {
        ...org.feature_flags,
        notifications: notifications
      }
    })
    .eq('id', org.id)
    .select()
    .single()
  
  const notifySettings = updated.feature_flags.notifications
  assertTrue(notifySettings.email_notifications.payment_received, 'Payment notifications should be enabled')
  assertEqual(notifySettings.notification_emails.length, 2, 'Should have 2 notification emails')
  assertFalse(notifySettings.slack_integration.enabled, 'Slack should be disabled by default')
  
  return updated
}

async function testSecuritySettings() {
  const { org } = await createTestOrganization(
    'Security Org',
    'security-settings',
    'admin@security.ai',
    'enterprise'
  )
  
  // Configure security settings (enterprise features)
  const securitySettings = {
    two_factor_required: true,
    session_timeout_minutes: 30,
    password_policy: {
      min_length: 12,
      require_uppercase: true,
      require_lowercase: true,
      require_numbers: true,
      require_special: true,
      expire_days: 90
    },
    ip_whitelist: ['192.168.1.0/24', '10.0.0.0/8'],
    audit_log_retention_days: 2555, // 7 years for compliance
    sso_enabled: false,
    sso_provider: null
  }
  
  const { data: updated } = await supabaseAdmin
    .from('organizations')
    .update({
      feature_flags: {
        ...org.feature_flags,
        security: securitySettings
      }
    })
    .eq('id', org.id)
    .select()
    .single()
  
  const security = updated.feature_flags.security
  assertTrue(security.two_factor_required, '2FA should be required for enterprise')
  assertEqual(security.session_timeout_minutes, 30, 'Session timeout should be 30 minutes')
  assertEqual(security.password_policy.min_length, 12, 'Password minimum length should be 12')
  assertEqual(security.audit_log_retention_days, 2555, 'Audit logs should be retained for 7 years')
  
  return updated
}

async function testIntegrationSettings() {
  const { org } = await createTestOrganization(
    'Integration Org',
    'integration-settings',
    'admin@integrate.ai',
    'professional'
  )
  
  // Configure third-party integrations
  const integrations = {
    stripe: {
      enabled: true,
      publishable_key: 'pk_test_xxx',
      webhook_secret: null, // Set when webhook configured
      auto_sync: true
    },
    quickbooks: {
      enabled: false,
      company_id: null,
      sync_frequency: 'daily'
    },
    google_workspace: {
      enabled: true,
      domain: 'anchorblock.ai',
      sync_contacts: true,
      sync_calendar: false
    },
    api: {
      enabled: true,
      rate_limit: 1000, // requests per hour
      allowed_ips: [],
      webhook_endpoints: []
    }
  }
  
  const { data: updated } = await supabaseAdmin
    .from('organizations')
    .update({
      feature_flags: {
        ...org.feature_flags,
        integrations: integrations
      }
    })
    .eq('id', org.id)
    .select()
    .single()
  
  const integ = updated.feature_flags.integrations
  assertTrue(integ.stripe.enabled, 'Stripe integration should be enabled')
  assertTrue(integ.stripe.auto_sync, 'Stripe auto-sync should be enabled')
  assertTrue(integ.api.enabled, 'API access should be enabled for professional')
  assertEqual(integ.api.rate_limit, 1000, 'API rate limit should be 1000/hour')
  
  return updated
}

async function testReportingPreferences() {
  const { org } = await createTestOrganization(
    'Reporting Org',
    'reporting-settings',
    'admin@reports.ai',
    'professional'
  )
  
  // Configure reporting preferences
  const reportingSettings = {
    default_date_range: 'current_month',
    comparison_period: 'previous_period',
    currency_display: 'symbol', // $ vs USD
    decimal_places: 2,
    thousand_separator: ',',
    negative_format: 'parentheses', // (100) vs -100
    scheduled_reports: [
      {
        name: 'Monthly P&L',
        type: 'profit_loss',
        frequency: 'monthly',
        recipients: ['cfo@anchorblock.ai'],
        day_of_month: 1
      },
      {
        name: 'Weekly Cash Flow',
        type: 'cash_flow',
        frequency: 'weekly',
        recipients: ['admin@anchorblock.ai'],
        day_of_week: 1 // Monday
      }
    ],
    dashboard_widgets: [
      'revenue_chart',
      'expense_breakdown',
      'cash_position',
      'ar_aging',
      'top_customers'
    ]
  }
  
  const { data: updated } = await supabaseAdmin
    .from('organizations')
    .update({
      feature_flags: {
        ...org.feature_flags,
        reporting: reportingSettings
      }
    })
    .eq('id', org.id)
    .select()
    .single()
  
  const reporting = updated.feature_flags.reporting
  assertEqual(reporting.default_date_range, 'current_month', 'Default range should be current month')
  assertEqual(reporting.decimal_places, 2, 'Should show 2 decimal places')
  assertEqual(reporting.scheduled_reports.length, 2, 'Should have 2 scheduled reports')
  assertTrue(reporting.dashboard_widgets.includes('cash_position'), 'Dashboard should include cash position')
  
  return updated
}

// Run tests
async function main() {
  console.log('🚀 Starting Initial Settings Tests\n')
  
  // Clean up any existing test data
  const slugsToClean = [
    'anchorblock-settings',
    'invoice-settings',
    'bill-settings',
    'notification-settings',
    'security-settings',
    'integration-settings',
    'reporting-settings'
  ]
  
  for (const slug of slugsToClean) {
    await cleanupBySlug(slug)
  }
  
  const results = await runTestSuite('Initial Settings Configuration', [
    { name: 'Default settings verification', fn: testDefaultSettings },
    { name: 'Invoice settings configuration', fn: testInvoiceSettings },
    { name: 'Bill and expense settings', fn: testBillSettings },
    { name: 'Notification preferences', fn: testNotificationPreferences },
    { name: 'Security settings (enterprise)', fn: testSecuritySettings },
    { name: 'Integration settings', fn: testIntegrationSettings },
    { name: 'Reporting preferences', fn: testReportingPreferences }
  ])
  
  // Cleanup
  for (const slug of slugsToClean) {
    await cleanupBySlug(slug)
  }
  
  process.exit(results.failed > 0 ? 1 : 0)
}

main().catch(console.error)