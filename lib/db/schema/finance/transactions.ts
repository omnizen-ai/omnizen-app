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
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { organizations, workspaces } from '../core/organizations';
import { chartAccounts, journalEntries } from './accounts';

// Contact types
export const contactTypeEnum = pgEnum('contact_type', [
  'customer',
  'vendor',
  'customer_vendor',
  'employee',
  'other'
]);

// Contacts - Customers, Vendors, Employees
export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  
  // Type and identification
  type: contactTypeEnum('type').notNull(),
  externalCode: text('external_code'), // Integration reference
  
  // Name fields
  companyName: text('company_name'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  displayName: text('display_name'),
  
  // Contact information
  email: text('email'),
  phone: text('phone'),
  mobile: text('mobile'),
  website: text('website'),
  
  // Address
  addressLine1: text('address_line1'),
  addressLine2: text('address_line2'),
  city: text('city'),
  state: text('state'),
  postalCode: text('postal_code'),
  country: text('country'),
  
  // Financial details
  taxId: text('tax_id'),
  currencyCode: text('currency_code').notNull().default('USD'),
  paymentTerms: integer('payment_terms').default(30), // days
  creditLimit: decimal('credit_limit', { precision: 20, scale: 2 }),
  
  // Default accounts
  defaultSalesAccountId: uuid('default_sales_account_id').references(() => chartAccounts.id),
  defaultPurchaseAccountId: uuid('default_purchase_account_id').references(() => chartAccounts.id),
  
  // Status and metadata
  isActive: boolean('is_active').notNull().default(true),
  notes: text('notes'),
  customFields: jsonb('custom_fields'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgExternalIdx: uniqueIndex('fin_contact_org_external_idx').on(table.organizationId, table.externalCode),
  typeIdx: index('fin_contact_type_idx').on(table.type),
  emailIdx: index('fin_contact_email_idx').on(table.email),
  activeIdx: index('fin_contact_active_idx').on(table.isActive),
}));

// Products/Services
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  
  // Identification
  sku: text('sku').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  
  // Type and category
  isService: boolean('is_service').notNull().default(false),
  category: text('category'),
  unitOfMeasure: text('unit_of_measure').notNull().default('unit'),
  
  // Pricing
  salePrice: decimal('sale_price', { precision: 20, scale: 6 }),
  purchasePrice: decimal('purchase_price', { precision: 20, scale: 6 }),
  currencyCode: text('currency_code').notNull().default('USD'),
  
  // Tax
  taxCodeId: uuid('tax_code_id'),
  isTaxable: boolean('is_taxable').notNull().default(true),
  
  // GL accounts
  incomeAccountId: uuid('income_account_id').references(() => chartAccounts.id),
  expenseAccountId: uuid('expense_account_id').references(() => chartAccounts.id),
  inventoryAccountId: uuid('inventory_account_id').references(() => chartAccounts.id),
  
  // Inventory tracking
  isTrackedInventory: boolean('is_tracked_inventory').notNull().default(false),
  quantityOnHand: decimal('quantity_on_hand', { precision: 20, scale: 4 }).default('0'),
  reorderPoint: decimal('reorder_point', { precision: 20, scale: 4 }),
  reorderQuantity: decimal('reorder_quantity', { precision: 20, scale: 4 }),
  
  // Vendor
  preferredVendorId: uuid('preferred_vendor_id').references(() => contacts.id),
  
  // Status
  isActive: boolean('is_active').notNull().default(true),
  customFields: jsonb('custom_fields'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgSkuIdx: uniqueIndex('fin_product_org_sku_idx').on(table.organizationId, table.sku),
  categoryIdx: index('fin_product_category_idx').on(table.category),
  activeIdx: index('fin_product_active_idx').on(table.isActive),
}));

// Invoice status
export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft',
  'sent',
  'viewed',
  'partially_paid',
  'paid',
  'overdue',
  'cancelled',
  'void'
]);

// Invoices (AR)
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  
  // Invoice details
  invoiceNumber: text('invoice_number').notNull(),
  customerId: uuid('customer_id').notNull().references(() => contacts.id),
  
  // Dates
  issueDate: timestamp('issue_date').notNull(),
  dueDate: timestamp('due_date').notNull(),
  
  // Amounts
  currencyCode: text('currency_code').notNull().default('USD'),
  exchangeRate: decimal('exchange_rate', { precision: 20, scale: 8 }),
  
  subtotal: decimal('subtotal', { precision: 20, scale: 2 }).notNull(),
  discountAmount: decimal('discount_amount', { precision: 20, scale: 2 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 20, scale: 2 }).default('0'),
  totalAmount: decimal('total_amount', { precision: 20, scale: 2 }).notNull(),
  
  // Payment tracking
  paidAmount: decimal('paid_amount', { precision: 20, scale: 2 }).default('0'),
  balanceDue: decimal('balance_due', { precision: 20, scale: 2 }).notNull(),
  
  // Status
  status: invoiceStatusEnum('status').notNull().default('draft'),
  
  // References
  poNumber: text('po_number'),
  journalEntryId: uuid('journal_entry_id').references(() => journalEntries.id),
  
  // Content
  notes: text('notes'),
  terms: text('terms'),
  footer: text('footer'),
  
  // Metadata
  sentAt: timestamp('sent_at'),
  viewedAt: timestamp('viewed_at'),
  paidAt: timestamp('paid_at'),
  customFields: jsonb('custom_fields'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgNumberIdx: uniqueIndex('fin_invoice_org_number_idx').on(table.organizationId, table.invoiceNumber),
  customerIdx: index('fin_invoice_customer_idx').on(table.customerId),
  statusIdx: index('fin_invoice_status_idx').on(table.status),
  dueDateIdx: index('fin_invoice_due_date_idx').on(table.dueDate),
}));

// Invoice line items
export const invoiceLines = pgTable('invoice_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  lineNumber: integer('line_number').notNull(),
  
  // Product/Service
  productId: uuid('product_id').references(() => products.id),
  description: text('description').notNull(),
  
  // Quantities and amounts
  quantity: decimal('quantity', { precision: 20, scale: 6 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 20, scale: 6 }).notNull(),
  
  // Discounts
  discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).default('0'),
  discountAmount: decimal('discount_amount', { precision: 20, scale: 2 }).default('0'),
  
  // Tax
  taxCodeId: uuid('tax_code_id'),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 20, scale: 2 }).default('0'),
  
  // Totals
  lineSubtotal: decimal('line_subtotal', { precision: 20, scale: 2 }).notNull(),
  lineTotal: decimal('line_total', { precision: 20, scale: 2 }).notNull(),
  
  // GL account
  accountId: uuid('account_id').references(() => chartAccounts.id),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  invoiceLineIdx: uniqueIndex('fin_invoice_line_idx').on(table.invoiceId, table.lineNumber),
}));

// Bill status (same as invoice but for AP)
export const billStatusEnum = pgEnum('bill_status', [
  'draft',
  'received',
  'approved',
  'partially_paid',
  'paid',
  'overdue',
  'disputed',
  'cancelled',
  'void'
]);

// Bills (AP)
export const bills = pgTable('bills', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  
  // Bill details
  billNumber: text('bill_number').notNull(),
  vendorId: uuid('vendor_id').notNull().references(() => contacts.id),
  vendorInvoiceNumber: text('vendor_invoice_number'),
  
  // Dates
  billDate: timestamp('bill_date').notNull(),
  dueDate: timestamp('due_date').notNull(),
  
  // Amounts
  currencyCode: text('currency_code').notNull().default('USD'),
  exchangeRate: decimal('exchange_rate', { precision: 20, scale: 8 }),
  
  subtotal: decimal('subtotal', { precision: 20, scale: 2 }).notNull(),
  discountAmount: decimal('discount_amount', { precision: 20, scale: 2 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 20, scale: 2 }).default('0'),
  totalAmount: decimal('total_amount', { precision: 20, scale: 2 }).notNull(),
  
  // Payment tracking
  paidAmount: decimal('paid_amount', { precision: 20, scale: 2 }).default('0'),
  balanceDue: decimal('balance_due', { precision: 20, scale: 2 }).notNull(),
  
  // Status
  status: billStatusEnum('status').notNull().default('draft'),
  
  // References
  poNumber: text('po_number'),
  journalEntryId: uuid('journal_entry_id').references(() => journalEntries.id),
  
  // Approval workflow
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at'),
  
  // Content
  notes: text('notes'),
  customFields: jsonb('custom_fields'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgNumberIdx: uniqueIndex('fin_bill_org_number_idx').on(table.organizationId, table.billNumber),
  vendorIdx: index('fin_bill_vendor_idx').on(table.vendorId),
  statusIdx: index('fin_bill_status_idx').on(table.status),
  dueDateIdx: index('fin_bill_due_date_idx').on(table.dueDate),
}));

// Bill line items (similar structure to invoice lines)
export const billLines = pgTable('bill_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  billId: uuid('bill_id').notNull().references(() => bills.id, { onDelete: 'cascade' }),
  lineNumber: integer('line_number').notNull(),
  
  // Product/Service
  productId: uuid('product_id').references(() => products.id),
  description: text('description').notNull(),
  
  // Quantities and amounts
  quantity: decimal('quantity', { precision: 20, scale: 6 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 20, scale: 6 }).notNull(),
  
  // Discounts
  discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).default('0'),
  discountAmount: decimal('discount_amount', { precision: 20, scale: 2 }).default('0'),
  
  // Tax
  taxCodeId: uuid('tax_code_id'),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 20, scale: 2 }).default('0'),
  
  // Totals
  lineSubtotal: decimal('line_subtotal', { precision: 20, scale: 2 }).notNull(),
  lineTotal: decimal('line_total', { precision: 20, scale: 2 }).notNull(),
  
  // GL account
  accountId: uuid('account_id').references(() => chartAccounts.id),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  billLineIdx: uniqueIndex('fin_bill_line_idx').on(table.billId, table.lineNumber),
}));

// Payment methods
export const paymentMethodEnum = pgEnum('payment_method', [
  'cash',
  'check',
  'credit_card',
  'debit_card',
  'bank_transfer',
  'ach',
  'wire',
  'paypal',
  'stripe',
  'other'
]);

// Payments
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  
  // Payment details
  paymentNumber: text('payment_number').notNull(),
  paymentDate: timestamp('payment_date').notNull(),
  
  // Direction and contact
  direction: text('direction').notNull(), // incoming (from customer) or outgoing (to vendor)
  contactId: uuid('contact_id').notNull().references(() => contacts.id),
  
  // Amount
  amount: decimal('amount', { precision: 20, scale: 2 }).notNull(),
  currencyCode: text('currency_code').notNull().default('USD'),
  exchangeRate: decimal('exchange_rate', { precision: 20, scale: 8 }),
  
  // Payment method
  method: paymentMethodEnum('method').notNull(),
  referenceNumber: text('reference_number'),
  
  // Bank account (for reconciliation)
  bankAccountId: uuid('bank_account_id').references(() => chartAccounts.id),
  
  // Status
  status: text('status').notNull().default('posted'), // draft, posted, reconciled, void
  
  // Journal entry
  journalEntryId: uuid('journal_entry_id').references(() => journalEntries.id),
  
  // Notes
  memo: text('memo'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgNumberIdx: uniqueIndex('fin_payment_org_number_idx').on(table.organizationId, table.paymentNumber),
  contactIdx: index('fin_payment_contact_idx').on(table.contactId),
  dateIdx: index('fin_payment_date_idx').on(table.paymentDate),
  statusIdx: index('fin_payment_status_idx').on(table.status),
}));

// Payment allocations (apply payments to invoices/bills)
export const paymentAllocations = pgTable('payment_allocations', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  paymentId: uuid('payment_id').notNull().references(() => payments.id, { onDelete: 'cascade' }),
  
  // Document reference
  documentType: text('document_type').notNull(), // invoice or bill
  documentId: uuid('document_id').notNull(),
  
  // Amount applied
  amountApplied: decimal('amount_applied', { precision: 20, scale: 2 }).notNull(),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  paymentIdx: index('fin_allocation_payment_idx').on(table.paymentId),
  documentIdx: index('fin_allocation_document_idx').on(table.documentType, table.documentId),
}));

// Relations
export const contactsRelations = relations(contacts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [contacts.organizationId],
    references: [organizations.id],
  }),
  invoices: many(invoices),
  bills: many(bills),
  payments: many(payments),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [invoices.organizationId],
    references: [organizations.id],
  }),
  customer: one(contacts, {
    fields: [invoices.customerId],
    references: [contacts.id],
  }),
  lines: many(invoiceLines),
  journalEntry: one(journalEntries, {
    fields: [invoices.journalEntryId],
    references: [journalEntries.id],
  }),
}));

export const billsRelations = relations(bills, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [bills.organizationId],
    references: [organizations.id],
  }),
  vendor: one(contacts, {
    fields: [bills.vendorId],
    references: [contacts.id],
  }),
  lines: many(billLines),
  journalEntry: one(journalEntries, {
    fields: [bills.journalEntryId],
    references: [journalEntries.id],
  }),
}));

// Types
export type Contact = InferSelectModel<typeof contacts>;
export type Product = InferSelectModel<typeof products>;
export type Invoice = InferSelectModel<typeof invoices>;
export type InvoiceLine = InferSelectModel<typeof invoiceLines>;
export type Bill = InferSelectModel<typeof bills>;
export type BillLine = InferSelectModel<typeof billLines>;
export type Payment = InferSelectModel<typeof payments>;
export type PaymentAllocation = InferSelectModel<typeof paymentAllocations>;