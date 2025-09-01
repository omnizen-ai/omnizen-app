import {
  pgTable,
  text,
  timestamp,
  uuid,
  decimal,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
  integer,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { organizations, workspaces } from '../core/organizations';

// Account types enum - foundation of double-entry bookkeeping
export const accountTypeEnum = pgEnum('account_type', [
  'asset',
  'liability',
  'equity',
  'income',
  'expense',
  'contra_asset',
  'contra_liability',
  'other'
]);

// Chart of Accounts - Core financial structure
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Organization scope
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  
  // Account structure
  code: text('code').notNull(),
  name: text('name').notNull(),
  type: accountTypeEnum('type').notNull(),
  
  // Hierarchy
  parentId: uuid('parent_id').references((): AnyPgColumn => accounts.id),
  
  // Properties
  description: text('description'),
  isPostable: boolean('is_postable').notNull().default(true), // Can receive transactions
  isActive: boolean('is_active').notNull().default(true),
  isSystemAccount: boolean('is_system_account').notNull().default(false), // Protected from deletion
  
  // Currency and balance
  currencyCode: text('currency_code').notNull().default('USD'),
  normalBalance: text('normal_balance').notNull(), // debit or credit
  currentBalance: decimal('current_balance', { precision: 20, scale: 2 }).notNull().default('0.00'),
  
  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by'),
}, (table) => ({
  orgCodeIdx: uniqueIndex('fin_account_org_code_idx').on(table.organizationId, table.code),
  typeIdx: index('fin_account_type_idx').on(table.type),
  parentIdx: index('fin_account_parent_idx').on(table.parentId),
  activeIdx: index('fin_account_active_idx').on(table.isActive),
}));

// Journal types
export const journalTypeEnum = pgEnum('journal_type', [
  'general',
  'sales',
  'purchases',
  'cash_receipts',
  'cash_disbursements',
  'inventory',
  'payroll',
  'adjusting',
  'closing',
  'other'
]);

// Journals - Different types of accounting books
export const journals = pgTable('journals', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  
  code: text('code').notNull(),
  name: text('name').notNull(),
  type: journalTypeEnum('type').notNull(),
  description: text('description'),
  
  // Settings
  isActive: boolean('is_active').notNull().default(true),
  requiresApproval: boolean('requires_approval').notNull().default(false),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgCodeIdx: uniqueIndex('fin_journal_org_code_idx').on(table.organizationId, table.code),
  typeIdx: index('fin_journal_type_idx').on(table.type),
}));

// Journal entry status
export const entryStatusEnum = pgEnum('entry_status', [
  'draft',
  'pending_approval',
  'approved',
  'posted',
  'void',
  'reversed'
]);

// Journal Entries - Core of double-entry bookkeeping
export const journalEntries: any = pgTable('journal_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  journalId: uuid('journal_id').notNull().references(() => journals.id),
  
  // Entry details
  entryNumber: text('entry_number').notNull(),
  entryDate: timestamp('entry_date').notNull(),
  
  // Document reference
  documentType: text('document_type'), // invoice, bill, payment, receipt, adjustment
  documentId: uuid('document_id'), // Reference to source document
  
  // Description and status
  description: text('description').notNull(),
  memo: text('memo'),
  status: entryStatusEnum('status').notNull().default('draft'),
  
  // Approval workflow
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at'),
  
  // Posting details
  postedAt: timestamp('posted_at'),
  reversedFromId: uuid('reversed_from_id').references((): AnyPgColumn => journalEntries.id),
  
  // Metadata
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgNumberIdx: uniqueIndex('fin_entry_org_number_idx').on(table.organizationId, table.entryNumber),
  dateIdx: index('fin_entry_date_idx').on(table.entryDate),
  statusIdx: index('fin_entry_status_idx').on(table.status),
  documentIdx: index('fin_entry_document_idx').on(table.documentType, table.documentId),
}));

// Journal Entry Lines - Debits and Credits
export const journalLines = pgTable('journal_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  journalEntryId: uuid('journal_entry_id').notNull().references(() => journalEntries.id, { onDelete: 'cascade' }),
  
  lineNumber: integer('line_number').notNull(),
  
  // Account and amounts
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  debit: decimal('debit', { precision: 20, scale: 2 }).notNull().default('0.00'),
  credit: decimal('credit', { precision: 20, scale: 2 }).notNull().default('0.00'),
  
  // Currency support
  currencyCode: text('currency_code').notNull().default('USD'),
  exchangeRate: decimal('exchange_rate', { precision: 20, scale: 8 }),
  
  // References
  contactId: uuid('contact_id'), // Reference to contacts table
  productId: uuid('product_id'), // Reference to products table
  taxCodeId: uuid('tax_code_id'), // Reference to tax codes
  
  // Description
  description: text('description'),
  
  // Analytics dimensions
  departmentId: uuid('department_id'),
  projectId: uuid('project_id'),
  costCenterId: uuid('cost_center_id'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  entryLineIdx: uniqueIndex('fin_journal_line_entry_idx').on(table.journalEntryId, table.lineNumber),
  accountIdx: index('fin_journal_line_account_idx').on(table.accountId),
  contactIdx: index('fin_journal_line_contact_idx').on(table.contactId),
}));

// Currencies
export const currencies = pgTable('currencies', {
  code: text('code').primaryKey(), // USD, EUR, GBP, etc.
  symbol: text('symbol').notNull(),
  name: text('name').notNull(),
  decimals: integer('decimals').notNull().default(2),
  isActive: boolean('is_active').notNull().default(true),
});

// Exchange rates
export const exchangeRates = pgTable('exchange_rates', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  
  rateDate: timestamp('rate_date').notNull(),
  fromCurrency: text('from_currency').notNull().references(() => currencies.code),
  toCurrency: text('to_currency').notNull().references(() => currencies.code),
  rate: decimal('rate', { precision: 20, scale: 8 }).notNull(),
  
  source: text('source'), // manual, api, bank
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  orgDateCurrencyIdx: uniqueIndex('fin_fx_rate_unique_idx').on(
    table.organizationId,
    table.rateDate,
    table.fromCurrency,
    table.toCurrency
  ),
}));

// Tax codes
export const taxCodes = pgTable('tax_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  
  code: text('code').notNull(),
  description: text('description'),
  ratePercent: decimal('rate_percent', { precision: 9, scale: 4 }).notNull().default('0'),
  
  // Tax type
  isSales: boolean('is_sales').notNull().default(true),
  isPurchase: boolean('is_purchase').notNull().default(true),
  
  // GL accounts
  salesAccountId: uuid('sales_account_id').references(() => accounts.id),
  purchaseAccountId: uuid('purchase_account_id').references(() => accounts.id),
  
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  orgCodeIdx: uniqueIndex('fin_tax_code_org_idx').on(table.organizationId, table.code),
}));

// Relations
export const accountsRelations = relations(accounts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [accounts.organizationId],
    references: [organizations.id],
  }),
  workspace: one(workspaces, {
    fields: [accounts.workspaceId],
    references: [workspaces.id],
  }),
  parent: one(accounts, {
    fields: [accounts.parentId],
    references: [accounts.id],
    relationName: 'accountHierarchy',
  }),
  children: many(accounts, { relationName: 'accountHierarchy' }),
  journalLines: many(journalLines),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [journalEntries.organizationId],
    references: [organizations.id],
  }),
  journal: one(journals, {
    fields: [journalEntries.journalId],
    references: [journals.id],
  }),
  lines: many(journalLines),
  reversedFrom: one(journalEntries, {
    fields: [journalEntries.reversedFromId],
    references: [journalEntries.id],
  }),
}));

export const journalLinesRelations = relations(journalLines, ({ one }) => ({
  journalEntry: one(journalEntries, {
    fields: [journalLines.journalEntryId],
    references: [journalEntries.id],
  }),
  account: one(accounts, {
    fields: [journalLines.accountId],
    references: [accounts.id],
  }),
}));

// Types
export type Account = InferSelectModel<typeof accounts>;
export type Journal = InferSelectModel<typeof journals>;
export type JournalEntry = InferSelectModel<typeof journalEntries>;
export type JournalLine = InferSelectModel<typeof journalLines>;
export type Currency = InferSelectModel<typeof currencies>;
export type ExchangeRate = InferSelectModel<typeof exchangeRates>;
export type TaxCode = InferSelectModel<typeof taxCodes>;