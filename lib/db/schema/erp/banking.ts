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
  jsonb,
  date,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { organizations, workspaces } from '../core/organizations';
import { chartAccounts, journalEntries } from '../finance/accounts';
import { currencies } from '../finance/accounts';
import { users } from '../core/users';
import { payments } from '../finance/transactions';

// Bank account types
export const bankAccountTypeEnum = pgEnum('bank_account_type', [
  'checking',
  'savings',
  'credit_card',
  'cash',
  'loan',
  'merchant',
  'investment'
]);

// Bank Accounts - Physical bank accounts
export const bankAccounts = pgTable('bank_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  
  // Account details
  accountName: text('account_name').notNull(),
  accountNumber: text('account_number'),
  accountType: bankAccountTypeEnum('account_type').notNull(),
  
  // Bank information
  bankName: text('bank_name'),
  bankBranch: text('bank_branch'),
  routingNumber: text('routing_number'),
  swiftCode: text('swift_code'),
  iban: text('iban'),
  
  // Currency and GL
  currencyCode: text('currency_code').notNull().references(() => currencies.code),
  glAccountId: uuid('gl_account_id').notNull().references(() => chartAccounts.id),
  
  // Balances
  currentBalance: decimal('current_balance', { precision: 20, scale: 2 }).notNull().default('0'),
  availableBalance: decimal('available_balance', { precision: 20, scale: 2 }).notNull().default('0'),
  lastReconciledBalance: decimal('last_reconciled_balance', { precision: 20, scale: 2 }).default('0'),
  lastReconciledDate: date('last_reconciled_date'),
  
  // Settings
  isDefault: boolean('is_default').notNull().default(false),
  allowPayments: boolean('allow_payments').notNull().default(true),
  allowDeposits: boolean('allow_deposits').notNull().default(true),
  requireReconciliation: boolean('require_reconciliation').notNull().default(true),
  
  // Integration
  bankFeedEnabled: boolean('bank_feed_enabled').notNull().default(false),
  bankFeedProvider: text('bank_feed_provider'), // plaid, yodlee, manual
  bankFeedCredentials: jsonb('bank_feed_credentials'), // encrypted
  lastSyncedAt: timestamp('last_synced_at'),
  
  // Status
  isActive: boolean('is_active').notNull().default(true),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgNameIdx: uniqueIndex('erp_bank_account_org_name_idx').on(table.organizationId, table.accountName),
  typeIdx: index('erp_bank_account_type_idx').on(table.accountType),
  glAccountIdx: index('erp_bank_account_gl_idx').on(table.glAccountId),
  activeIdx: index('erp_bank_account_active_idx').on(table.isActive),
}));

// Transaction types
export const bankTransactionTypeEnum = pgEnum('bank_transaction_type', [
  'deposit',
  'withdrawal',
  'transfer',
  'fee',
  'interest',
  'adjustment',
  'opening_balance'
]);

// Bank Transactions - Actual bank transactions
export const bankTransactions = pgTable('bank_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  bankAccountId: uuid('bank_account_id').notNull().references(() => bankAccounts.id, { onDelete: 'cascade' }),
  
  // Transaction details
  transactionDate: date('transaction_date').notNull(),
  transactionType: bankTransactionTypeEnum('transaction_type').notNull(),
  
  // Reference numbers
  bankReferenceNumber: text('bank_reference_number'),
  checkNumber: text('check_number'),
  
  // Amounts
  amount: decimal('amount', { precision: 20, scale: 2 }).notNull(),
  runningBalance: decimal('running_balance', { precision: 20, scale: 2 }),
  
  // Description
  payee: text('payee'),
  description: text('description'),
  memo: text('memo'),
  
  // Categorization
  category: text('category'),
  tags: jsonb('tags'), // Array of tags
  
  // Reconciliation
  isReconciled: boolean('is_reconciled').notNull().default(false),
  reconciledDate: date('reconciled_date'),
  reconciliationId: uuid('reconciliation_id').references(() => bankReconciliations.id),
  
  // Matching to payments/journal entries
  paymentId: uuid('payment_id').references(() => payments.id),
  journalEntryId: uuid('journal_entry_id').references(() => journalEntries.id),
  
  // Import tracking
  importBatchId: text('import_batch_id'),
  isDuplicate: boolean('is_duplicate').notNull().default(false),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  bankAccountDateIdx: index('erp_bank_txn_account_date_idx').on(table.bankAccountId, table.transactionDate),
  reconciledIdx: index('erp_bank_txn_reconciled_idx').on(table.isReconciled),
  paymentIdx: index('erp_bank_txn_payment_idx').on(table.paymentId),
  importBatchIdx: index('erp_bank_txn_import_idx').on(table.importBatchId),
}));

// Reconciliation status
export const reconciliationStatusEnum = pgEnum('reconciliation_status', [
  'draft',
  'in_progress',
  'completed',
  'approved',
  'void'
]);

// Bank Reconciliations - Track reconciliation process
export const bankReconciliations: any = pgTable('bank_reconciliations', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  bankAccountId: uuid('bank_account_id').notNull().references(() => bankAccounts.id),
  
  // Period
  statementDate: date('statement_date').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  
  // Balances
  statementBeginningBalance: decimal('statement_beginning_balance', { precision: 20, scale: 2 }).notNull(),
  statementEndingBalance: decimal('statement_ending_balance', { precision: 20, scale: 2 }).notNull(),
  
  // GL balances
  glBeginningBalance: decimal('gl_beginning_balance', { precision: 20, scale: 2 }).notNull(),
  glEndingBalance: decimal('gl_ending_balance', { precision: 20, scale: 2 }).notNull(),
  
  // Reconciliation items
  clearedDeposits: decimal('cleared_deposits', { precision: 20, scale: 2 }).notNull().default('0'),
  clearedWithdrawals: decimal('cleared_withdrawals', { precision: 20, scale: 2 }).notNull().default('0'),
  
  // Outstanding items
  outstandingDeposits: decimal('outstanding_deposits', { precision: 20, scale: 2 }).notNull().default('0'),
  outstandingWithdrawals: decimal('outstanding_withdrawals', { precision: 20, scale: 2 }).notNull().default('0'),
  
  // Adjustments
  adjustments: decimal('adjustments', { precision: 20, scale: 2 }).notNull().default('0'),
  
  // Difference
  difference: decimal('difference', { precision: 20, scale: 2 }).notNull().default('0'),
  
  // Status
  status: reconciliationStatusEnum('status').notNull().default('draft'),
  
  // Approval
  preparedBy: uuid('prepared_by').references(() => users.id),
  preparedAt: timestamp('prepared_at'),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  
  // Notes
  notes: text('notes'),
  
  // Transaction lists
  clearedTransactionIds: jsonb('cleared_transaction_ids'), // Array of bank transaction IDs
  outstandingTransactionIds: jsonb('outstanding_transaction_ids'), // Array of bank transaction IDs
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  accountDateIdx: uniqueIndex('erp_recon_account_date_idx').on(table.bankAccountId, table.statementDate),
  statusIdx: index('erp_recon_status_idx').on(table.status),
}));

// Bank Rules - Auto-categorization rules
export const bankRules = pgTable('bank_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Rule details
  ruleName: text('rule_name').notNull(),
  description: text('description'),
  
  // Conditions (all must match)
  conditions: jsonb('conditions').notNull(), // Array of {field, operator, value}
  // Example: [
  //   {field: 'description', operator: 'contains', value: 'Amazon'},
  //   {field: 'amount', operator: 'greater_than', value: 100}
  // ]
  
  // Actions to take when rule matches
  actions: jsonb('actions').notNull(), // Array of {action, value}
  // Example: [
  //   {action: 'set_category', value: 'Office Supplies'},
  //   {action: 'add_tag', value: 'tax-deductible'},
  //   {action: 'assign_account', value: 'account_id'}
  // ]
  
  // Apply to specific bank accounts or all
  bankAccountIds: jsonb('bank_account_ids'), // null = all accounts
  
  // Priority (lower number = higher priority)
  priority: decimal('priority', { precision: 10, scale: 0 }).notNull().default('100'),
  
  // Settings
  isActive: boolean('is_active').notNull().default(true),
  stopOnMatch: boolean('stop_on_match').notNull().default(false),
  
  // Statistics
  matchCount: decimal('match_count', { precision: 10, scale: 0 }).notNull().default('0'),
  lastMatchedAt: timestamp('last_matched_at'),
  
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  priorityIdx: index('erp_bank_rule_priority_idx').on(table.priority),
  activeIdx: index('erp_bank_rule_active_idx').on(table.isActive),
}));

// Cash flow forecast
export const cashFlowForecasts = pgTable('cash_flow_forecasts', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Forecast details
  forecastName: text('forecast_name').notNull(),
  description: text('description'),
  
  // Period
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  
  // Scenario
  scenario: text('scenario').notNull().default('base'), // base, optimistic, pessimistic
  
  // Starting balance
  startingBalance: decimal('starting_balance', { precision: 20, scale: 2 }).notNull(),
  
  // Forecast items stored as JSONB for flexibility
  forecastItems: jsonb('forecast_items').notNull(),
  // Structure: Array of {
  //   date: 'YYYY-MM-DD',
  //   type: 'income' | 'expense',
  //   category: string,
  //   description: string,
  //   amount: number,
  //   probability: number (0-100),
  //   isRecurring: boolean,
  //   recurringFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually'
  // }
  
  // Summary
  totalInflows: decimal('total_inflows', { precision: 20, scale: 2 }).notNull().default('0'),
  totalOutflows: decimal('total_outflows', { precision: 20, scale: 2 }).notNull().default('0'),
  endingBalance: decimal('ending_balance', { precision: 20, scale: 2 }).notNull().default('0'),
  minimumBalance: decimal('minimum_balance', { precision: 20, scale: 2 }),
  minimumBalanceDate: date('minimum_balance_date'),
  
  // Settings
  includeWeekends: boolean('include_weekends').notNull().default(false),
  
  // Status
  isActive: boolean('is_active').notNull().default(true),
  
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  dateRangeIdx: index('erp_cash_forecast_date_idx').on(table.startDate, table.endDate),
  scenarioIdx: index('erp_cash_forecast_scenario_idx').on(table.scenario),
  activeIdx: index('erp_cash_forecast_active_idx').on(table.isActive),
}));

// Relations
export const bankAccountsRelations = relations(bankAccounts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [bankAccounts.organizationId],
    references: [organizations.id],
  }),
  workspace: one(workspaces, {
    fields: [bankAccounts.workspaceId],
    references: [workspaces.id],
  }),
  glAccount: one(chartAccounts, {
    fields: [bankAccounts.glAccountId],
    references: [chartAccounts.id],
  }),
  transactions: many(bankTransactions),
  reconciliations: many(bankReconciliations),
}));

export const bankTransactionsRelations = relations(bankTransactions, ({ one }) => ({
  organization: one(organizations, {
    fields: [bankTransactions.organizationId],
    references: [organizations.id],
  }),
  bankAccount: one(bankAccounts, {
    fields: [bankTransactions.bankAccountId],
    references: [bankAccounts.id],
  }),
  payment: one(payments, {
    fields: [bankTransactions.paymentId],
    references: [payments.id],
  }),
  journalEntry: one(journalEntries, {
    fields: [bankTransactions.journalEntryId],
    references: [journalEntries.id],
  }),
  reconciliation: one(bankReconciliations, {
    fields: [bankTransactions.reconciliationId],
    references: [bankReconciliations.id],
  }),
}));

export const bankReconciliationsRelations = relations(bankReconciliations, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [bankReconciliations.organizationId],
    references: [organizations.id],
  }),
  bankAccount: one(bankAccounts, {
    fields: [bankReconciliations.bankAccountId],
    references: [bankAccounts.id],
  }),
  preparedBy: one(users, {
    fields: [bankReconciliations.preparedBy],
    references: [users.id],
    relationName: 'preparedReconciliations',
  }),
  approvedBy: one(users, {
    fields: [bankReconciliations.approvedBy],
    references: [users.id],
    relationName: 'approvedReconciliations',
  }),
  transactions: many(bankTransactions),
}));

// Types
export type BankAccount = InferSelectModel<typeof bankAccounts>;
export type BankTransaction = InferSelectModel<typeof bankTransactions>;
export type BankReconciliation = InferSelectModel<typeof bankReconciliations>;
export type BankRule = InferSelectModel<typeof bankRules>;
export type CashFlowForecast = InferSelectModel<typeof cashFlowForecasts>;