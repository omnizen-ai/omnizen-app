import {
  pgTable,
  text,
  timestamp,
  uuid,
  decimal,
  integer,
  boolean,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const contactTypeEnum = pgEnum('contact_type', ['customer', 'vendor', 'both']);
export const accountTypeEnum = pgEnum('account_type', ['asset', 'liability', 'equity', 'revenue', 'expense']);
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'completed', 'cancelled']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'paid', 'overdue', 'cancelled']);

// Chart of Accounts - Foundation of double-entry bookkeeping
export const chartOfAccounts = pgTable('chart_of_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountNumber: text('account_number').notNull().unique(),
  accountName: text('account_name').notNull(),
  accountType: accountTypeEnum('account_type').notNull(),
  parentAccountId: uuid('parent_account_id').references((): AnyPgColumn => chartOfAccounts.id),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  balance: decimal('balance', { precision: 20, scale: 2 }).default('0.00'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  accountNumberIdx: uniqueIndex('account_number_idx').on(table.accountNumber),
  accountTypeIdx: index('account_type_idx').on(table.accountType),
}));

// Contacts - Customers and Vendors
export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactType: contactTypeEnum('contact_type').notNull(),
  companyName: text('company_name'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email'),
  phone: text('phone'),
  address: jsonb('address'), // {street, city, state, zip, country}
  taxId: text('tax_id'),
  creditLimit: decimal('credit_limit', { precision: 20, scale: 2 }),
  paymentTerms: integer('payment_terms').default(30), // days
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  contactTypeIdx: index('contact_type_idx').on(table.contactType),
  emailIdx: index('email_idx').on(table.email),
}));

// Journal Entries - Core of double-entry bookkeeping
export const journalEntries = pgTable('journal_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  entryNumber: text('entry_number').notNull().unique(),
  entryDate: timestamp('entry_date').notNull(),
  description: text('description').notNull(),
  reference: text('reference'), // invoice number, receipt number, etc.
  createdBy: text('created_by'),
  isPosted: boolean('is_posted').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  entryNumberIdx: uniqueIndex('entry_number_idx').on(table.entryNumber),
  entryDateIdx: index('entry_date_idx').on(table.entryDate),
}));

// Journal Entry Lines - Debits and Credits
export const journalEntryLines = pgTable('journal_entry_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  journalEntryId: uuid('journal_entry_id').notNull().references(() => journalEntries.id),
  accountId: uuid('account_id').notNull().references(() => chartOfAccounts.id),
  debit: decimal('debit', { precision: 20, scale: 2 }).default('0.00'),
  credit: decimal('credit', { precision: 20, scale: 2 }).default('0.00'),
  description: text('description'),
  contactId: uuid('contact_id').references(() => contacts.id),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  journalEntryIdx: index('journal_entry_idx').on(table.journalEntryId),
  accountIdx: index('account_idx').on(table.accountId),
}));

// Invoices
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  contactId: uuid('contact_id').notNull().references(() => contacts.id),
  invoiceDate: timestamp('invoice_date').notNull(),
  dueDate: timestamp('due_date').notNull(),
  status: invoiceStatusEnum('status').default('draft'),
  subtotal: decimal('subtotal', { precision: 20, scale: 2 }).notNull(),
  taxAmount: decimal('tax_amount', { precision: 20, scale: 2 }).default('0.00'),
  totalAmount: decimal('total_amount', { precision: 20, scale: 2 }).notNull(),
  paidAmount: decimal('paid_amount', { precision: 20, scale: 2 }).default('0.00'),
  notes: text('notes'),
  terms: text('terms'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  invoiceNumberIdx: uniqueIndex('invoice_number_idx').on(table.invoiceNumber),
  contactIdx: index('contact_idx').on(table.contactId),
  statusIdx: index('status_idx').on(table.status),
  dueDateIdx: index('due_date_idx').on(table.dueDate),
}));

// Invoice Line Items
export const invoiceLineItems = pgTable('invoice_line_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id),
  productId: uuid('product_id').references(() => inventory.id),
  description: text('description').notNull(),
  quantity: decimal('quantity', { precision: 20, scale: 4 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 20, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 20, scale: 2 }).default('0.00'),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).default('0.00'),
  totalAmount: decimal('total_amount', { precision: 20, scale: 2 }).notNull(),
  accountId: uuid('account_id').references(() => chartOfAccounts.id),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  invoiceIdx: index('invoice_idx').on(table.invoiceId),
}));

// Inventory
export const inventory = pgTable('inventory', {
  id: uuid('id').primaryKey().defaultRandom(),
  sku: text('sku').notNull().unique(),
  productName: text('product_name').notNull(),
  description: text('description'),
  category: text('category'),
  unitCost: decimal('unit_cost', { precision: 20, scale: 2 }).notNull(),
  sellingPrice: decimal('selling_price', { precision: 20, scale: 2 }).notNull(),
  quantityOnHand: decimal('quantity_on_hand', { precision: 20, scale: 4 }).default('0'),
  reorderPoint: decimal('reorder_point', { precision: 20, scale: 4 }),
  preferredVendorId: uuid('preferred_vendor_id').references(() => contacts.id),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  skuIdx: uniqueIndex('sku_idx').on(table.sku),
  categoryIdx: index('category_idx').on(table.category),
}));

// Transactions (Payments, Receipts, etc.)
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionNumber: text('transaction_number').notNull().unique(),
  transactionDate: timestamp('transaction_date').notNull(),
  transactionType: text('transaction_type').notNull(), // payment, receipt, transfer, adjustment
  contactId: uuid('contact_id').references(() => contacts.id),
  accountId: uuid('account_id').notNull().references(() => chartOfAccounts.id),
  amount: decimal('amount', { precision: 20, scale: 2 }).notNull(),
  paymentMethod: text('payment_method'), // cash, check, credit_card, bank_transfer
  referenceNumber: text('reference_number'),
  description: text('description'),
  status: transactionStatusEnum('status').default('pending'),
  journalEntryId: uuid('journal_entry_id').references(() => journalEntries.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  transactionNumberIdx: uniqueIndex('transaction_number_idx').on(table.transactionNumber),
  transactionDateIdx: index('transaction_date_idx').on(table.transactionDate),
  contactIdx: index('transaction_contact_idx').on(table.contactId),
}));

// Expenses
export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  expenseDate: timestamp('expense_date').notNull(),
  vendorId: uuid('vendor_id').references(() => contacts.id),
  categoryAccountId: uuid('category_account_id').notNull().references(() => chartOfAccounts.id),
  paymentAccountId: uuid('payment_account_id').notNull().references(() => chartOfAccounts.id),
  amount: decimal('amount', { precision: 20, scale: 2 }).notNull(),
  taxAmount: decimal('tax_amount', { precision: 20, scale: 2 }).default('0.00'),
  description: text('description'),
  receiptUrl: text('receipt_url'),
  paymentMethod: text('payment_method'),
  referenceNumber: text('reference_number'),
  journalEntryId: uuid('journal_entry_id').references(() => journalEntries.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  expenseDateIdx: index('expense_date_idx').on(table.expenseDate),
  vendorIdx: index('expense_vendor_idx').on(table.vendorId),
  categoryIdx: index('expense_category_idx').on(table.categoryAccountId),
}));

// Relations
export const chartOfAccountsRelations = relations(chartOfAccounts, ({ one, many }) => ({
  parentAccount: one(chartOfAccounts, {
    fields: [chartOfAccounts.parentAccountId],
    references: [chartOfAccounts.id],
  }),
  childAccounts: many(chartOfAccounts),
  journalEntryLines: many(journalEntryLines),
  transactions: many(transactions),
  expenses: many(expenses),
}));

export const contactsRelations = relations(contacts, ({ many }) => ({
  invoices: many(invoices),
  transactions: many(transactions),
  expenses: many(expenses),
  inventory: many(inventory),
}));

export const journalEntriesRelations = relations(journalEntries, ({ many }) => ({
  lines: many(journalEntryLines),
  transactions: many(transactions),
  expenses: many(expenses),
}));

export const journalEntryLinesRelations = relations(journalEntryLines, ({ one }) => ({
  journalEntry: one(journalEntries, {
    fields: [journalEntryLines.journalEntryId],
    references: [journalEntries.id],
  }),
  account: one(chartOfAccounts, {
    fields: [journalEntryLines.accountId],
    references: [chartOfAccounts.id],
  }),
  contact: one(contacts, {
    fields: [journalEntryLines.contactId],
    references: [contacts.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  contact: one(contacts, {
    fields: [invoices.contactId],
    references: [contacts.id],
  }),
  lineItems: many(invoiceLineItems),
}));

export const invoiceLineItemsRelations = relations(invoiceLineItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceLineItems.invoiceId],
    references: [invoices.id],
  }),
  product: one(inventory, {
    fields: [invoiceLineItems.productId],
    references: [inventory.id],
  }),
  account: one(chartOfAccounts, {
    fields: [invoiceLineItems.accountId],
    references: [chartOfAccounts.id],
  }),
}));

export const inventoryRelations = relations(inventory, ({ one, many }) => ({
  preferredVendor: one(contacts, {
    fields: [inventory.preferredVendorId],
    references: [contacts.id],
  }),
  invoiceLineItems: many(invoiceLineItems),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  contact: one(contacts, {
    fields: [transactions.contactId],
    references: [contacts.id],
  }),
  account: one(chartOfAccounts, {
    fields: [transactions.accountId],
    references: [chartOfAccounts.id],
  }),
  journalEntry: one(journalEntries, {
    fields: [transactions.journalEntryId],
    references: [journalEntries.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  vendor: one(contacts, {
    fields: [expenses.vendorId],
    references: [contacts.id],
  }),
  categoryAccount: one(chartOfAccounts, {
    fields: [expenses.categoryAccountId],
    references: [chartOfAccounts.id],
  }),
  paymentAccount: one(chartOfAccounts, {
    fields: [expenses.paymentAccountId],
    references: [chartOfAccounts.id],
  }),
  journalEntry: one(journalEntries, {
    fields: [expenses.journalEntryId],
    references: [journalEntries.id],
  }),
}));