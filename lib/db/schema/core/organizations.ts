import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  integer,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';

// Plan tiers enum
export const planTierEnum = pgEnum('plan_tier', [
  'starter',
  'professional',
  'enterprise',
  'custom',
  // Personal finance tiers
  'personal-free',
  'personal-plus',
  'personal-pro',
  'family'
]);

// Account type enum
export const organizationTypeEnum = pgEnum('organization_type', [
  'business',
  'personal',
  'hybrid'
]);

// Accounting mode enum - Progressive enforcement for different business sizes
export const accountingModeEnum = pgEnum('accounting_mode', [
  'simple',    // No balance enforcement, warnings only (startups/small business)
  'standard',  // Balance required for posting, drafts can be unbalanced (growing business)
  'strict'     // Always enforced, even on drafts (enterprise/regulated)
]);

// Organizations - Multi-tenant foundation
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  planTier: planTierEnum('plan_tier').notNull().default('starter'),
  
  // Personal finance support
  accountType: organizationTypeEnum('organization_type').default('business'),
  isPersonalFinance: boolean('is_personal_finance').default(false),
  
  // Accounting configuration
  accountingMode: accountingModeEnum('accounting_mode').notNull().default('simple'),
  enforceBalanceOnPost: boolean('enforce_balance_on_post').notNull().default(false),
  requireApprovalWorkflow: boolean('require_approval_workflow').notNull().default(false),
  
  // Feature flags for progressive enhancement
  featureFlags: jsonb('feature_flags').notNull().default({
    invoicing: true,
    basic_accounting: true,
    full_accounting: false,
    inventory: false,
    ai_automation: false,
    custom_workflows: false,
    api_access: false,
    white_label: false,
  }),
  
  // Limits based on plan
  maxUsers: integer('max_users').notNull().default(5),
  maxAiAgents: integer('max_ai_agents').notNull().default(2),
  maxWorkspaces: integer('max_workspaces').notNull().default(1),
  dataRetentionDays: integer('data_retention_days').notNull().default(90),
  
  // Settings
  countryCode: text('country_code').default('US'),
  timezone: text('timezone').notNull().default('UTC'),
  currency: text('currency').notNull().default('USD'),
  fiscalYearStart: integer('fiscal_year_start').notNull().default(1), // Month number
  
  // Metadata
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  
  // Billing
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  trialEndsAt: timestamp('trial_ends_at'),
}, (table) => ({
  slugIdx: uniqueIndex('core_org_slug_idx').on(table.slug),
  planTierIdx: index('core_org_plan_tier_idx').on(table.planTier),
  activeIdx: index('core_org_active_idx').on(table.isActive),
}));

// Workspaces - For enterprise segregation
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  workspaceType: text('workspace_type').notNull().default('default'), // default, department, project, subsidiary, personal, family
  
  // Workspace-specific settings
  settings: jsonb('settings').notNull().default({}),
  metadata: jsonb('metadata'),
  
  // Hierarchy for enterprise
  parentWorkspaceId: uuid('parent_workspace_id').references((): AnyPgColumn => workspaces.id),
  
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgWorkspaceIdx: uniqueIndex('core_org_workspace_idx').on(table.organizationId, table.slug),
  workspaceTypeIdx: index('core_workspace_type_idx').on(table.workspaceType),
}));

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  workspaces: many(workspaces),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [workspaces.organizationId],
    references: [organizations.id],
  }),
  parentWorkspace: one(workspaces, {
    fields: [workspaces.parentWorkspaceId],
    references: [workspaces.id],
  }),
  childWorkspaces: many(workspaces),
}));

// Types
export type Organization = InferSelectModel<typeof organizations>;
export type Workspace = InferSelectModel<typeof workspaces>;