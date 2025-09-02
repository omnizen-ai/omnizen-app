import {
  pgTable,
  text,
  uuid,
  varchar,
  decimal,
  boolean,
  timestamp,
  integer,
  date,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { organizations, workspaces, accountTypeEnum, planTierEnum } from '../core/organizations';
import { chartAccounts } from '../finance/accounts';

// Enums
export const goalTypeEnum = pgEnum('goal_type_enum', ['savings', 'debt_payoff', 'investment', 'purchase', 'emergency_fund', 'retirement']);
export const goalStatusEnum = pgEnum('goal_status_enum', ['active', 'paused', 'completed', 'cancelled']);
export const budgetPeriodEnum = pgEnum('budget_period_enum', ['weekly', 'monthly', 'quarterly', 'yearly']);
export const assetTypeEnum = pgEnum('asset_type_enum', ['stock', 'etf', 'mutual_fund', 'bond', 'crypto', 'commodity']);
export const subscriptionFrequencyEnum = pgEnum('subscription_frequency_enum', ['weekly', 'monthly', 'quarterly', 'annual']);

// Personal Categories Table
export const personalCategories = pgTable('personal_categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  icon: varchar('icon', { length: 50 }),
  color: varchar('color', { length: 7 }),
  typicalMerchants: text('typical_merchants').array(),
  taxRelevant: boolean('tax_relevant').default(false),
  parentCategoryId: uuid('parent_category_id').references(() => personalCategories.id),
  // Optional chart of accounts mapping for detailed bookkeeping
  defaultAccountId: uuid('default_account_id').references(() => chartAccounts.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgNameIdx: uniqueIndex('personal_cat_org_name_idx').on(table.organizationId, table.name),
  parentIdx: index('personal_cat_parent_idx').on(table.parentCategoryId),
  taxRelevantIdx: index('personal_cat_tax_idx').on(table.taxRelevant),
}));

// Financial Goals Table
export const financialGoals = pgTable('financial_goals', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  goalType: goalTypeEnum('goal_type').notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  targetAmount: decimal('target_amount', { precision: 15, scale: 2 }).notNull(),
  currentAmount: decimal('current_amount', { precision: 15, scale: 2 }).default('0'),
  targetDate: date('target_date'),
  priority: integer('priority').default(1),
  autoAllocate: boolean('auto_allocate').default(false),
  allocationAmount: decimal('allocation_amount', { precision: 15, scale: 2 }),
  allocationFrequency: varchar('allocation_frequency', { length: 20 }),
  status: goalStatusEnum('status').default('active'),
  completedDate: date('completed_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgWorkspaceIdx: index('personal_goal_org_workspace_idx').on(table.organizationId, table.workspaceId),
  typeIdx: index('personal_goal_type_idx').on(table.goalType),
  statusIdx: index('personal_goal_status_idx').on(table.status),
}));

// Budget Rules Table
export const budgetRules = pgTable('budget_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => personalCategories.id),
  period: budgetPeriodEnum('period').default('monthly'),
  budgetAmount: decimal('budget_amount', { precision: 15, scale: 2 }).notNull(),
  alertThreshold: decimal('alert_threshold', { precision: 5, scale: 2 }).default('80.00'),
  rollover: boolean('rollover').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgWorkspaceIdx: index('personal_budget_org_workspace_idx').on(table.organizationId, table.workspaceId),
  categoryIdx: index('personal_budget_category_idx').on(table.categoryId),
  activeIdx: index('personal_budget_active_idx').on(table.isActive),
}));

// Investment Holdings Table
export const investmentHoldings = pgTable('investment_holdings', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  symbol: varchar('symbol', { length: 20 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  assetType: assetTypeEnum('asset_type'),
  quantity: decimal('quantity', { precision: 15, scale: 8 }).notNull(),
  costBasis: decimal('cost_basis', { precision: 15, scale: 2 }).notNull(),
  currentPrice: decimal('current_price', { precision: 15, scale: 4 }),
  marketValue: decimal('market_value', { precision: 15, scale: 2 }),
  unrealizedGainLoss: decimal('unrealized_gain_loss', { precision: 15, scale: 2 }),
  lastUpdated: timestamp('last_updated').defaultNow(),
  // Optional chart of accounts mapping for investment tracking
  investmentAccountId: uuid('investment_account_id').references(() => chartAccounts.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orgWorkspaceIdx: index('personal_invest_org_workspace_idx').on(table.organizationId, table.workspaceId),
  symbolIdx: index('personal_invest_symbol_idx').on(table.symbol),
  assetTypeIdx: index('personal_invest_type_idx').on(table.assetType),
}));

// Personal Subscriptions Table
export const personalSubscriptions = pgTable('personal_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(),
  vendorName: varchar('vendor_name', { length: 200 }),
  categoryId: uuid('category_id').references(() => personalCategories.id),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  frequency: subscriptionFrequencyEnum('frequency'),
  nextBillingDate: date('next_billing_date'),
  isActive: boolean('is_active').default(true),
  cancellationUrl: text('cancellation_url'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgWorkspaceIdx: index('personal_sub_org_workspace_idx').on(table.organizationId, table.workspaceId),
  activeIdx: index('personal_sub_active_idx').on(table.isActive),
  nextBillingIdx: index('personal_sub_billing_idx').on(table.nextBillingDate),
}));

// Relations
export const personalCategoriesRelations = relations(personalCategories, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [personalCategories.organizationId],
    references: [organizations.id],
  }),
  parentCategory: one(personalCategories, {
    fields: [personalCategories.parentCategoryId],
    references: [personalCategories.id],
  }),
  subCategories: many(personalCategories),
  budgetRules: many(budgetRules),
  subscriptions: many(personalSubscriptions),
}));

export const financialGoalsRelations = relations(financialGoals, ({ one }) => ({
  organization: one(organizations, {
    fields: [financialGoals.organizationId],
    references: [organizations.id],
  }),
  workspace: one(workspaces, {
    fields: [financialGoals.workspaceId],
    references: [workspaces.id],
  }),
}));

export const budgetRulesRelations = relations(budgetRules, ({ one }) => ({
  organization: one(organizations, {
    fields: [budgetRules.organizationId],
    references: [organizations.id],
  }),
  workspace: one(workspaces, {
    fields: [budgetRules.workspaceId],
    references: [workspaces.id],
  }),
  category: one(personalCategories, {
    fields: [budgetRules.categoryId],
    references: [personalCategories.id],
  }),
}));

export const investmentHoldingsRelations = relations(investmentHoldings, ({ one }) => ({
  organization: one(organizations, {
    fields: [investmentHoldings.organizationId],
    references: [organizations.id],
  }),
  workspace: one(workspaces, {
    fields: [investmentHoldings.workspaceId],
    references: [workspaces.id],
  }),
}));

export const personalSubscriptionsRelations = relations(personalSubscriptions, ({ one }) => ({
  organization: one(organizations, {
    fields: [personalSubscriptions.organizationId],
    references: [organizations.id],
  }),
  workspace: one(workspaces, {
    fields: [personalSubscriptions.workspaceId],
    references: [workspaces.id],
  }),
  category: one(personalCategories, {
    fields: [personalSubscriptions.categoryId],
    references: [personalCategories.id],
  }),
}));

// Type exports
export type PersonalCategory = InferSelectModel<typeof personalCategories>;
export type FinancialGoal = InferSelectModel<typeof financialGoals>;
export type BudgetRule = InferSelectModel<typeof budgetRules>;
export type InvestmentHolding = InferSelectModel<typeof investmentHoldings>;
export type PersonalSubscription = InferSelectModel<typeof personalSubscriptions>;
