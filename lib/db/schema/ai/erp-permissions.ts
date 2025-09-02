import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
  integer,
  decimal,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { organizations } from '../core/organizations';
import { aiAgents } from './agents';
import { users } from '../core/users';

// Permission scope levels
export const permissionScopeEnum = pgEnum('permission_scope', [
  'global',      // All data in organization
  'workspace',   // Limited to specific workspaces
  'entity',      // Limited to specific entity types
  'record',      // Limited to specific records
  'field'        // Limited to specific fields
]);

// ERP operations
export const erpOperationEnum = pgEnum('erp_operation', [
  'read',
  'create',
  'update',
  'delete',
  'approve',
  'post',
  'void',
  'reconcile',
  'export'
]);

// Agent ERP Permissions - Fine-grained access control
export const agentErpPermissions = pgTable('agent_erp_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  agentId: uuid('agent_id').notNull().references(() => aiAgents.id, { onDelete: 'cascade' }),
  
  // Permission details
  permissionName: text('permission_name').notNull(),
  description: text('description'),
  
  // Scope
  scope: permissionScopeEnum('scope').notNull(),
  
  // Entity permissions
  entityTypes: jsonb('entity_types'), // ['invoices', 'bills', 'journal_entries']
  operations: jsonb('operations'), // ['read', 'create', 'update']
  
  // Conditions and filters
  conditions: jsonb('conditions'), // SQL-like conditions
  // Example: {
  //   "amount": {"operator": "<=", "value": 10000},
  //   "status": {"operator": "in", "value": ["draft", "pending"]},
  //   "created_at": {"operator": ">=", "value": "30_days_ago"}
  // }
  
  // Field-level restrictions
  allowedFields: jsonb('allowed_fields'), // Fields the agent can access
  deniedFields: jsonb('denied_fields'), // Fields explicitly denied (overrides allowed)
  
  // Value limits
  maxTransactionAmount: decimal('max_transaction_amount', { precision: 20, scale: 2 }),
  maxDailyVolume: decimal('max_daily_volume', { precision: 20, scale: 2 }),
  maxRecordsPerQuery: integer('max_records_per_query'),
  
  // Time restrictions
  allowedHours: jsonb('allowed_hours'), // {"start": "09:00", "end": "17:00"}
  allowedDays: jsonb('allowed_days'), // ["monday", "tuesday", "wednesday", "thursday", "friday"]
  
  // Approval requirements
  requiresApproval: boolean('requires_approval').notNull().default(false),
  approvalThreshold: decimal('approval_threshold', { precision: 20, scale: 2 }),
  approverRoles: jsonb('approver_roles'), // ['admin', 'manager']
  
  // Status
  isActive: boolean('is_active').notNull().default(true),
  validFrom: timestamp('valid_from'),
  validUntil: timestamp('valid_until'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  agentIdx: index('agent_erp_perm_agent_idx').on(table.agentId),
  scopeIdx: index('agent_erp_perm_scope_idx').on(table.scope),
  activeIdx: index('agent_erp_perm_active_idx').on(table.isActive),
}));

// Automation rule triggers
export const automationTriggerEnum = pgEnum('automation_trigger', [
  'schedule',
  'event',
  'webhook',
  'threshold',
  'condition',
  'manual'
]);

// ERP Automation Rules - Define automated workflows
export const erpAutomationRules = pgTable('erp_automation_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  agentId: uuid('agent_id').references(() => aiAgents.id),
  
  // Rule identification
  ruleName: text('rule_name').notNull(),
  description: text('description'),
  category: text('category'), // invoicing, payments, reconciliation, reporting
  
  // Trigger configuration
  triggerType: automationTriggerEnum('trigger_type').notNull(),
  triggerConfig: jsonb('trigger_config').notNull(),
  // Examples:
  // Schedule: {"cron": "0 9 * * 1", "timezone": "America/New_York"}
  // Event: {"entity": "invoice", "event": "created", "conditions": {...}}
  // Threshold: {"metric": "cash_balance", "operator": "<", "value": 10000}
  
  // Conditions (all must be true)
  conditions: jsonb('conditions'), // Array of condition objects
  
  // Actions to perform
  actions: jsonb('actions').notNull(), // Array of action objects
  // Example: [
  //   {"type": "create_invoice", "params": {...}},
  //   {"type": "send_email", "params": {...}},
  //   {"type": "update_field", "params": {...}}
  // ]
  
  // Execution settings
  maxExecutionsPerDay: integer('max_executions_per_day'),
  cooldownMinutes: integer('cooldown_minutes'), // Minimum time between executions
  retryOnFailure: boolean('retry_on_failure').notNull().default(true),
  maxRetries: integer('max_retries').default(3),
  
  // Notification settings
  notifyOnSuccess: boolean('notify_on_success').notNull().default(false),
  notifyOnFailure: boolean('notify_on_failure').notNull().default(true),
  notificationEmails: jsonb('notification_emails'),
  
  // Status and statistics
  isActive: boolean('is_active').notNull().default(true),
  lastExecutedAt: timestamp('last_executed_at'),
  lastStatus: text('last_status'), // success, failure, skipped
  executionCount: integer('execution_count').notNull().default(0),
  successCount: integer('success_count').notNull().default(0),
  failureCount: integer('failure_count').notNull().default(0),
  
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  triggerTypeIdx: index('erp_automation_trigger_idx').on(table.triggerType),
  categoryIdx: index('erp_automation_category_idx').on(table.category),
  activeIdx: index('erp_automation_active_idx').on(table.isActive),
  agentIdx: index('erp_automation_agent_idx').on(table.agentId),
}));

// Agent Audit Trail - Comprehensive logging for compliance
export const agentAuditTrail = pgTable('agent_audit_trail', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  agentId: uuid('agent_id').references(() => aiAgents.id),
  executionId: uuid('execution_id'), // Reference to agent_executions
  
  // Action details
  actionType: text('action_type').notNull(), // query, create, update, delete, approve, etc.
  entityType: text('entity_type').notNull(), // invoice, payment, journal_entry, etc.
  entityId: uuid('entity_id'),
  
  // What happened
  action: text('action').notNull(), // Detailed description
  sqlQuery: text('sql_query'), // Actual SQL executed
  
  // Data changes
  previousData: jsonb('previous_data'), // State before change
  newData: jsonb('new_data'), // State after change
  changedFields: jsonb('changed_fields'), // List of modified fields
  
  // Financial impact
  financialImpact: decimal('financial_impact', { precision: 20, scale: 2 }),
  affectedAccounts: jsonb('affected_accounts'), // GL accounts affected
  
  // Context
  reason: text('reason'), // Why this action was taken
  businessContext: jsonb('business_context'), // Additional context
  
  // Compliance fields
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  sessionId: text('session_id'),
  
  // Risk assessment
  riskLevel: text('risk_level'), // low, medium, high, critical
  riskFactors: jsonb('risk_factors'), // Factors contributing to risk
  
  // Approval trail
  requiredApproval: boolean('required_approval').notNull().default(false),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  approvalNotes: text('approval_notes'),
  
  // Status
  status: text('status').notNull(), // success, failure, pending_approval, rejected
  errorMessage: text('error_message'),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  agentIdx: index('agent_audit_agent_idx').on(table.agentId),
  entityIdx: index('agent_audit_entity_idx').on(table.entityType, table.entityId),
  actionTypeIdx: index('agent_audit_action_idx').on(table.actionType),
  createdIdx: index('agent_audit_created_idx').on(table.createdAt),
  riskIdx: index('agent_audit_risk_idx').on(table.riskLevel),
}));

// Query validation rules
export const queryValidationRules = pgTable('query_validation_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Rule details
  ruleName: text('rule_name').notNull(),
  description: text('description'),
  
  // What to check
  ruleType: text('rule_type').notNull(), // syntax, permission, data_access, performance
  
  // Pattern matching
  sqlPatterns: jsonb('sql_patterns'), // Regex patterns to match/block
  blockedKeywords: jsonb('blocked_keywords'), // Keywords that should not appear
  
  // Table/column restrictions
  blockedTables: jsonb('blocked_tables'),
  blockedColumns: jsonb('blocked_columns'),
  
  // Query complexity limits
  maxJoins: integer('max_joins'),
  maxSubqueries: integer('max_subqueries'),
  maxRowsReturned: integer('max_rows_returned'),
  maxExecutionTime: integer('max_execution_time'), // milliseconds
  
  // Required clauses
  requiredClauses: jsonb('required_clauses'), // e.g., must have WHERE clause
  
  // Action to take
  action: text('action').notNull(), // block, warn, log, approve
  warningMessage: text('warning_message'),
  
  // Exceptions
  exemptAgents: jsonb('exempt_agents'), // Agent IDs exempt from this rule
  exemptUsers: jsonb('exempt_users'), // User IDs exempt from this rule
  
  // Priority
  priority: integer('priority').notNull().default(100),
  
  // Status
  isActive: boolean('is_active').notNull().default(true),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  ruleTypeIdx: index('query_validation_type_idx').on(table.ruleType),
  priorityIdx: index('query_validation_priority_idx').on(table.priority),
  activeIdx: index('query_validation_active_idx').on(table.isActive),
}));

// Safety guardrails for financial operations
export const financialGuardrails = pgTable('financial_guardrails', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Guardrail identification
  guardrailName: text('guardrail_name').notNull(),
  description: text('description'),
  category: text('category').notNull(), // transaction_limits, period_controls, balance_checks
  
  // Scope
  entityType: text('entity_type'), // invoice, payment, journal_entry, all
  
  // Rules
  rules: jsonb('rules').notNull(),
  // Examples:
  // Transaction limits: {"max_single_transaction": 100000, "max_daily_total": 500000}
  // Period controls: {"prevent_closed_period_changes": true, "closed_before": "2024-01-01"}
  // Balance checks: {"enforce_balanced_entries": true, "prevent_negative_cash": true}
  
  // Override settings
  allowOverride: boolean('allow_override').notNull().default(false),
  overrideRoles: jsonb('override_roles'), // Roles that can override
  overrideRequiresReason: boolean('override_requires_reason').notNull().default(true),
  
  // Notifications
  notifyOnViolation: boolean('notify_on_violation').notNull().default(true),
  notificationRecipients: jsonb('notification_recipients'),
  
  // Statistics
  violationCount: integer('violation_count').notNull().default(0),
  lastViolationAt: timestamp('last_violation_at'),
  
  // Status
  isActive: boolean('is_active').notNull().default(true),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  categoryIdx: index('financial_guardrail_category_idx').on(table.category),
  entityTypeIdx: index('financial_guardrail_entity_idx').on(table.entityType),
  activeIdx: index('financial_guardrail_active_idx').on(table.isActive),
}));

// Relations
export const agentErpPermissionsRelations = relations(agentErpPermissions, ({ one }) => ({
  organization: one(organizations, {
    fields: [agentErpPermissions.organizationId],
    references: [organizations.id],
  }),
  agent: one(aiAgents, {
    fields: [agentErpPermissions.agentId],
    references: [aiAgents.id],
  }),
}));

export const erpAutomationRulesRelations = relations(erpAutomationRules, ({ one }) => ({
  organization: one(organizations, {
    fields: [erpAutomationRules.organizationId],
    references: [organizations.id],
  }),
  agent: one(aiAgents, {
    fields: [erpAutomationRules.agentId],
    references: [aiAgents.id],
  }),
  createdBy: one(users, {
    fields: [erpAutomationRules.createdBy],
    references: [users.id],
  }),
}));

export const agentAuditTrailRelations = relations(agentAuditTrail, ({ one }) => ({
  organization: one(organizations, {
    fields: [agentAuditTrail.organizationId],
    references: [organizations.id],
  }),
  agent: one(aiAgents, {
    fields: [agentAuditTrail.agentId],
    references: [aiAgents.id],
  }),
  approvedBy: one(users, {
    fields: [agentAuditTrail.approvedBy],
    references: [users.id],
  }),
}));

// Types
export type AgentErpPermission = InferSelectModel<typeof agentErpPermissions>;
export type ErpAutomationRule = InferSelectModel<typeof erpAutomationRules>;
export type AgentAuditTrail = InferSelectModel<typeof agentAuditTrail>;
export type QueryValidationRule = InferSelectModel<typeof queryValidationRules>;
export type FinancialGuardrail = InferSelectModel<typeof financialGuardrails>;