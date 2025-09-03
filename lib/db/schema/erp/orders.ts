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
  integer,
  date,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { organizations, workspaces } from '../core/organizations';
import { contacts, products, invoices, bills } from '../finance/transactions';
import { warehouses } from './warehouses';
import { users } from '../core/users';
import { taxCodes } from '../finance/accounts';

// Sales order status
export const salesOrderStatusEnum = pgEnum('sales_order_status', [
  'draft',
  'pending',
  'confirmed',
  'in_fulfillment',
  'partially_fulfilled',
  'fulfilled',
  'partially_invoiced',
  'invoiced',
  'completed',
  'cancelled',
  'on_hold'
]);

// Sales Orders
export const salesOrders = pgTable('sales_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  
  // Order details
  orderNumber: text('order_number').notNull(),
  customerId: uuid('customer_id').notNull().references(() => contacts.id),
  
  // Dates
  orderDate: date('order_date').notNull(),
  expectedDeliveryDate: date('expected_delivery_date'),
  actualDeliveryDate: date('actual_delivery_date'),
  
  // Shipping
  shippingAddressLine1: text('shipping_address_line1'),
  shippingAddressLine2: text('shipping_address_line2'),
  shippingCity: text('shipping_city'),
  shippingState: text('shipping_state'),
  shippingPostalCode: text('shipping_postal_code'),
  shippingCountry: text('shipping_country'),
  
  // Billing (if different from customer default)
  billingAddressLine1: text('billing_address_line1'),
  billingAddressLine2: text('billing_address_line2'),
  billingCity: text('billing_city'),
  billingState: text('billing_state'),
  billingPostalCode: text('billing_postal_code'),
  billingCountry: text('billing_country'),
  
  // Warehouse
  warehouseId: uuid('warehouse_id').references(() => warehouses.id),
  
  // Amounts
  currencyCode: text('currency_code').notNull().default('USD'),
  exchangeRate: decimal('exchange_rate', { precision: 20, scale: 8 }),
  
  subtotal: decimal('subtotal', { precision: 20, scale: 2 }).notNull(),
  discountAmount: decimal('discount_amount', { precision: 20, scale: 2 }).default('0'),
  shippingAmount: decimal('shipping_amount', { precision: 20, scale: 2 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 20, scale: 2 }).default('0'),
  totalAmount: decimal('total_amount', { precision: 20, scale: 2 }).notNull(),
  
  // Fulfillment tracking
  totalQuantityOrdered: decimal('total_quantity_ordered', { precision: 20, scale: 6 }).notNull().default('0'),
  totalQuantityFulfilled: decimal('total_quantity_fulfilled', { precision: 20, scale: 6 }).notNull().default('0'),
  totalQuantityInvoiced: decimal('total_quantity_invoiced', { precision: 20, scale: 6 }).notNull().default('0'),
  
  // Status
  status: salesOrderStatusEnum('status').notNull().default('draft'),
  
  // References
  customerPoNumber: text('customer_po_number'),
  salesRepId: uuid('sales_rep_id').references(() => users.id),
  
  // Payment terms
  paymentTerms: integer('payment_terms').default(30), // days
  
  // Notes and customization
  internalNotes: text('internal_notes'),
  customerNotes: text('customer_notes'),
  customFields: jsonb('custom_fields'),
  
  // Approval
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  
  // Fulfillment
  fulfilledBy: uuid('fulfilled_by').references(() => users.id),
  fulfilledAt: timestamp('fulfilled_at'),
  
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgNumberIdx: uniqueIndex('erp_so_org_number_idx').on(table.organizationId, table.orderNumber),
  customerIdx: index('erp_so_customer_idx').on(table.customerId),
  statusIdx: index('erp_so_status_idx').on(table.status),
  orderDateIdx: index('erp_so_date_idx').on(table.orderDate),
  warehouseIdx: index('erp_so_warehouse_idx').on(table.warehouseId),
}));

// Sales Order Lines
export const salesOrderLines = pgTable('sales_order_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  salesOrderId: uuid('sales_order_id').notNull().references(() => salesOrders.id, { onDelete: 'cascade' }),
  lineNumber: integer('line_number').notNull(),
  
  // Product/Service
  productId: uuid('product_id').references(() => products.id),
  description: text('description').notNull(),
  
  // Quantities
  quantityOrdered: decimal('quantity_ordered', { precision: 20, scale: 6 }).notNull(),
  quantityFulfilled: decimal('quantity_fulfilled', { precision: 20, scale: 6 }).notNull().default('0'),
  quantityInvoiced: decimal('quantity_invoiced', { precision: 20, scale: 6 }).notNull().default('0'),
  quantityCancelled: decimal('quantity_cancelled', { precision: 20, scale: 6 }).notNull().default('0'),
  
  // Pricing
  unitPrice: decimal('unit_price', { precision: 20, scale: 6 }).notNull(),
  
  // Discounts
  discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).default('0'),
  discountAmount: decimal('discount_amount', { precision: 20, scale: 2 }).default('0'),
  
  // Tax
  taxCodeId: uuid('tax_code_id').references(() => taxCodes.id),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 20, scale: 2 }).default('0'),
  
  // Totals
  lineSubtotal: decimal('line_subtotal', { precision: 20, scale: 2 }).notNull(),
  lineTotal: decimal('line_total', { precision: 20, scale: 2 }).notNull(),
  
  // Expected delivery
  expectedDeliveryDate: date('expected_delivery_date'),
  
  // Notes
  notes: text('notes'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  orderLineIdx: uniqueIndex('erp_so_line_idx').on(table.salesOrderId, table.lineNumber),
  productIdx: index('erp_so_line_product_idx').on(table.productId),
}));

// Purchase order status
export const purchaseOrderStatusEnum = pgEnum('purchase_order_status', [
  'draft',
  'pending_approval',
  'approved',
  'sent',
  'acknowledged',
  'partially_received',
  'received',
  'partially_billed',
  'billed',
  'completed',
  'cancelled',
  'on_hold'
]);

// Purchase Orders
export const purchaseOrders = pgTable('purchase_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  
  // Order details
  orderNumber: text('order_number').notNull(),
  vendorId: uuid('vendor_id').notNull().references(() => contacts.id),
  
  // Dates
  orderDate: date('order_date').notNull(),
  expectedReceiptDate: date('expected_receipt_date'),
  actualReceiptDate: date('actual_receipt_date'),
  
  // Ship to location
  shipToWarehouseId: uuid('ship_to_warehouse_id').references(() => warehouses.id),
  shipToAddressLine1: text('ship_to_address_line1'),
  shipToAddressLine2: text('ship_to_address_line2'),
  shipToCity: text('ship_to_city'),
  shipToState: text('ship_to_state'),
  shipToPostalCode: text('ship_to_postal_code'),
  shipToCountry: text('ship_to_country'),
  
  // Amounts
  currencyCode: text('currency_code').notNull().default('USD'),
  exchangeRate: decimal('exchange_rate', { precision: 20, scale: 8 }),
  
  subtotal: decimal('subtotal', { precision: 20, scale: 2 }).notNull(),
  discountAmount: decimal('discount_amount', { precision: 20, scale: 2 }).default('0'),
  shippingAmount: decimal('shipping_amount', { precision: 20, scale: 2 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 20, scale: 2 }).default('0'),
  totalAmount: decimal('total_amount', { precision: 20, scale: 2 }).notNull(),
  
  // Receipt tracking
  totalQuantityOrdered: decimal('total_quantity_ordered', { precision: 20, scale: 6 }).notNull().default('0'),
  totalQuantityReceived: decimal('total_quantity_received', { precision: 20, scale: 6 }).notNull().default('0'),
  totalQuantityBilled: decimal('total_quantity_billed', { precision: 20, scale: 6 }).notNull().default('0'),
  
  // Status
  status: purchaseOrderStatusEnum('status').notNull().default('draft'),
  
  // References
  vendorReferenceNumber: text('vendor_reference_number'),
  requisitionNumber: text('requisition_number'),
  
  // Payment terms
  paymentTerms: integer('payment_terms').default(30), // days
  
  // Approval workflow
  requestedBy: uuid('requested_by').references(() => users.id),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  approvalNotes: text('approval_notes'),
  
  // Sending
  sentAt: timestamp('sent_at'),
  sentMethod: text('sent_method'), // email, fax, portal, manual
  
  // Notes
  internalNotes: text('internal_notes'),
  vendorNotes: text('vendor_notes'),
  customFields: jsonb('custom_fields'),
  
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgNumberIdx: uniqueIndex('erp_po_org_number_idx').on(table.organizationId, table.orderNumber),
  vendorIdx: index('erp_po_vendor_idx').on(table.vendorId),
  statusIdx: index('erp_po_status_idx').on(table.status),
  orderDateIdx: index('erp_po_date_idx').on(table.orderDate),
  warehouseIdx: index('erp_po_warehouse_idx').on(table.shipToWarehouseId),
}));

// Purchase Order Lines
export const purchaseOrderLines = pgTable('purchase_order_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  purchaseOrderId: uuid('purchase_order_id').notNull().references(() => purchaseOrders.id, { onDelete: 'cascade' }),
  lineNumber: integer('line_number').notNull(),
  
  // Product/Service
  productId: uuid('product_id').references(() => products.id),
  description: text('description').notNull(),
  vendorSku: text('vendor_sku'),
  
  // Quantities
  quantityOrdered: decimal('quantity_ordered', { precision: 20, scale: 6 }).notNull(),
  quantityReceived: decimal('quantity_received', { precision: 20, scale: 6 }).notNull().default('0'),
  quantityBilled: decimal('quantity_billed', { precision: 20, scale: 6 }).notNull().default('0'),
  quantityCancelled: decimal('quantity_cancelled', { precision: 20, scale: 6 }).notNull().default('0'),
  
  // Pricing
  unitPrice: decimal('unit_price', { precision: 20, scale: 6 }).notNull(),
  
  // Discounts
  discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).default('0'),
  discountAmount: decimal('discount_amount', { precision: 20, scale: 2 }).default('0'),
  
  // Tax
  taxCodeId: uuid('tax_code_id').references(() => taxCodes.id),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).default('0'),
  taxAmount: decimal('tax_amount', { precision: 20, scale: 2 }).default('0'),
  
  // Totals
  lineSubtotal: decimal('line_subtotal', { precision: 20, scale: 2 }).notNull(),
  lineTotal: decimal('line_total', { precision: 20, scale: 2 }).notNull(),
  
  // Expected receipt
  expectedReceiptDate: date('expected_receipt_date'),
  
  // Notes
  notes: text('notes'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  orderLineIdx: uniqueIndex('erp_po_line_idx').on(table.purchaseOrderId, table.lineNumber),
  productIdx: index('erp_po_line_product_idx').on(table.productId),
}));

// Order fulfillment status
export const fulfillmentStatusEnum = pgEnum('fulfillment_status', [
  'pending',
  'picking',
  'packing',
  'ready_to_ship',
  'shipped',
  'in_transit',
  'delivered',
  'returned',
  'cancelled'
]);

// Order Fulfillments (for sales orders)
export const orderFulfillments = pgTable('order_fulfillments', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  salesOrderId: uuid('sales_order_id').notNull().references(() => salesOrders.id),
  
  // Fulfillment details
  fulfillmentNumber: text('fulfillment_number').notNull(),
  fulfillmentDate: timestamp('fulfillment_date').notNull(),
  
  // Warehouse
  warehouseId: uuid('warehouse_id').notNull().references(() => warehouses.id),
  
  // Shipping
  shippingMethod: text('shipping_method'),
  shippingCarrier: text('shipping_carrier'),
  trackingNumber: text('tracking_number'),
  shippingCost: decimal('shipping_cost', { precision: 20, scale: 2 }),
  
  // Status
  status: fulfillmentStatusEnum('status').notNull().default('pending'),
  
  // Dates
  shippedAt: timestamp('shipped_at'),
  deliveredAt: timestamp('delivered_at'),
  
  // Notes
  notes: text('notes'),
  
  // Created/fulfilled by
  createdBy: uuid('created_by').references(() => users.id),
  fulfilledBy: uuid('fulfilled_by').references(() => users.id),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgNumberIdx: uniqueIndex('erp_fulfillment_org_number_idx').on(table.organizationId, table.fulfillmentNumber),
  salesOrderIdx: index('erp_fulfillment_so_idx').on(table.salesOrderId),
  statusIdx: index('erp_fulfillment_status_idx').on(table.status),
  warehouseIdx: index('erp_fulfillment_warehouse_idx').on(table.warehouseId),
}));

// Fulfillment Lines
export const fulfillmentLines = pgTable('fulfillment_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  fulfillmentId: uuid('fulfillment_id').notNull().references(() => orderFulfillments.id, { onDelete: 'cascade' }),
  salesOrderLineId: uuid('sales_order_line_id').notNull().references(() => salesOrderLines.id),
  
  // Quantities
  quantityFulfilled: decimal('quantity_fulfilled', { precision: 20, scale: 6 }).notNull(),
  
  // Tracking
  lotNumber: text('lot_number'),
  serialNumbers: jsonb('serial_numbers'), // Array of serial numbers
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  fulfillmentIdx: index('erp_fulfillment_line_idx').on(table.fulfillmentId),
  orderLineIdx: index('erp_fulfillment_line_so_idx').on(table.salesOrderLineId),
}));

// Purchase receipts (for purchase orders)
export const purchaseReceipts = pgTable('purchase_receipts', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  purchaseOrderId: uuid('purchase_order_id').notNull().references(() => purchaseOrders.id),
  
  // Receipt details
  receiptNumber: text('receipt_number').notNull(),
  receiptDate: timestamp('receipt_date').notNull(),
  
  // Warehouse
  warehouseId: uuid('warehouse_id').notNull().references(() => warehouses.id),
  
  // Reference
  vendorDeliveryNote: text('vendor_delivery_note'),
  
  // Status
  status: text('status').notNull().default('received'), // received, inspecting, accepted, rejected
  
  // Quality check
  qualityCheckRequired: boolean('quality_check_required').notNull().default(false),
  qualityCheckCompleted: boolean('quality_check_completed').notNull().default(false),
  qualityCheckNotes: text('quality_check_notes'),
  
  // Notes
  notes: text('notes'),
  
  // Received by
  receivedBy: uuid('received_by').references(() => users.id),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgNumberIdx: uniqueIndex('erp_receipt_org_number_idx').on(table.organizationId, table.receiptNumber),
  purchaseOrderIdx: index('erp_receipt_po_idx').on(table.purchaseOrderId),
  warehouseIdx: index('erp_receipt_warehouse_idx').on(table.warehouseId),
}));

// Receipt Lines
export const receiptLines = pgTable('receipt_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  receiptId: uuid('receipt_id').notNull().references(() => purchaseReceipts.id, { onDelete: 'cascade' }),
  purchaseOrderLineId: uuid('purchase_order_line_id').notNull().references(() => purchaseOrderLines.id),
  
  // Quantities
  quantityReceived: decimal('quantity_received', { precision: 20, scale: 6 }).notNull(),
  quantityAccepted: decimal('quantity_accepted', { precision: 20, scale: 6 }).notNull(),
  quantityRejected: decimal('quantity_rejected', { precision: 20, scale: 6 }).notNull().default('0'),
  
  // Reason for rejection
  rejectionReason: text('rejection_reason'),
  
  // Tracking
  lotNumber: text('lot_number'),
  serialNumbers: jsonb('serial_numbers'), // Array of serial numbers
  expiryDate: date('expiry_date'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  receiptIdx: index('erp_receipt_line_idx').on(table.receiptId),
  orderLineIdx: index('erp_receipt_line_po_idx').on(table.purchaseOrderLineId),
}));

// Relations
export const salesOrdersRelations = relations(salesOrders, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [salesOrders.organizationId],
    references: [organizations.id],
  }),
  customer: one(contacts, {
    fields: [salesOrders.customerId],
    references: [contacts.id],
  }),
  warehouse: one(warehouses, {
    fields: [salesOrders.warehouseId],
    references: [warehouses.id],
  }),
  lines: many(salesOrderLines),
  fulfillments: many(orderFulfillments),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [purchaseOrders.organizationId],
    references: [organizations.id],
  }),
  vendor: one(contacts, {
    fields: [purchaseOrders.vendorId],
    references: [contacts.id],
  }),
  warehouse: one(warehouses, {
    fields: [purchaseOrders.shipToWarehouseId],
    references: [warehouses.id],
  }),
  lines: many(purchaseOrderLines),
  receipts: many(purchaseReceipts),
}));

// Quotation status
export const quotationStatusEnum = pgEnum('quotation_status', [
  'draft',
  'pending',
  'sent',
  'viewed',
  'accepted',
  'rejected',
  'expired',
  'converted',
  'cancelled'
]);

// Sales Quotations
export const salesQuotations = pgTable('sales_quotations', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  
  // Quotation details
  quotationNumber: text('quotation_number').notNull(),
  customerId: uuid('customer_id').notNull().references(() => contacts.id),
  
  // Dates
  quotationDate: date('quotation_date').notNull(),
  validUntil: date('valid_until').notNull(),
  
  // Status
  status: quotationStatusEnum('status').notNull().default('draft'),
  
  // Financial
  subtotal: decimal('subtotal', { precision: 20, scale: 2 }).notNull().default('0'),
  taxAmount: decimal('tax_amount', { precision: 20, scale: 2 }).notNull().default('0'),
  discountAmount: decimal('discount_amount', { precision: 20, scale: 2 }).notNull().default('0'),
  discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).notNull().default('0'),
  total: decimal('total', { precision: 20, scale: 2 }).notNull().default('0'),
  
  // Terms and conditions
  paymentTerms: text('payment_terms'),
  deliveryTerms: text('delivery_terms'),
  terms: text('terms'),
  notes: text('notes'),
  internalNotes: text('internal_notes'),
  
  // Contact info
  billingAddress: jsonb('billing_address'),
  shippingAddress: jsonb('shipping_address'),
  
  // Tracking
  sentAt: timestamp('sent_at'),
  viewedAt: timestamp('viewed_at'),
  acceptedAt: timestamp('accepted_at'),
  rejectedAt: timestamp('rejected_at'),
  convertedAt: timestamp('converted_at'),
  convertedToOrderId: uuid('converted_to_order_id').references(() => salesOrders.id),
  
  // Additional fields
  referenceNumber: text('reference_number'),
  customerPo: text('customer_po'),
  tags: jsonb('tags'), // Array of strings
  customFields: jsonb('custom_fields'),
  
  // Audit
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgNumberIdx: uniqueIndex('erp_quotation_org_number_idx').on(table.organizationId, table.quotationNumber),
  customerIdx: index('erp_quotation_customer_idx').on(table.customerId),
  statusIdx: index('erp_quotation_status_idx').on(table.status),
  dateIdx: index('erp_quotation_date_idx').on(table.quotationDate),
}));

// Quotation Lines
export const quotationLines = pgTable('quotation_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  quotationId: uuid('quotation_id').notNull().references(() => salesQuotations.id, { onDelete: 'cascade' }),
  
  // Line details
  lineNumber: integer('line_number').notNull(),
  productId: uuid('product_id').references(() => products.id),
  
  // Product details (can be overridden)
  description: text('description').notNull(),
  sku: text('sku'),
  
  // Quantities and pricing
  quantity: decimal('quantity', { precision: 20, scale: 6 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 20, scale: 4 }).notNull(),
  discountPercent: decimal('discount_percent', { precision: 5, scale: 2 }).notNull().default('0'),
  discountAmount: decimal('discount_amount', { precision: 20, scale: 2 }).notNull().default('0'),
  lineTotal: decimal('line_total', { precision: 20, scale: 2 }).notNull(),
  
  // Tax
  taxCodeId: uuid('tax_code_id').references(() => taxCodes.id),
  taxAmount: decimal('tax_amount', { precision: 20, scale: 2 }).notNull().default('0'),
  
  // Notes
  notes: text('notes'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  quotationIdx: index('erp_quotation_line_idx').on(table.quotationId),
  productIdx: index('erp_quotation_line_product_idx').on(table.productId),
  lineNumberIdx: index('erp_quotation_line_number_idx').on(table.quotationId, table.lineNumber),
}));

// Relations for quotations
export const salesQuotationsRelations = relations(salesQuotations, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [salesQuotations.organizationId],
    references: [organizations.id],
  }),
  customer: one(contacts, {
    fields: [salesQuotations.customerId],
    references: [contacts.id],
  }),
  convertedToOrder: one(salesOrders, {
    fields: [salesQuotations.convertedToOrderId],
    references: [salesOrders.id],
  }),
  lines: many(quotationLines),
  createdByUser: one(users, {
    fields: [salesQuotations.createdBy],
    references: [users.id],
  }),
}));

export const quotationLinesRelations = relations(quotationLines, ({ one }) => ({
  quotation: one(salesQuotations, {
    fields: [quotationLines.quotationId],
    references: [salesQuotations.id],
  }),
  product: one(products, {
    fields: [quotationLines.productId],
    references: [products.id],
  }),
  taxCode: one(taxCodes, {
    fields: [quotationLines.taxCodeId],
    references: [taxCodes.id],
  }),
}));

// Types
export type SalesOrder = InferSelectModel<typeof salesOrders>;
export type SalesOrderLine = InferSelectModel<typeof salesOrderLines>;
export type PurchaseOrder = InferSelectModel<typeof purchaseOrders>;
export type PurchaseOrderLine = InferSelectModel<typeof purchaseOrderLines>;
export type OrderFulfillment = InferSelectModel<typeof orderFulfillments>;
export type FulfillmentLine = InferSelectModel<typeof fulfillmentLines>;
export type PurchaseReceipt = InferSelectModel<typeof purchaseReceipts>;
export type ReceiptLine = InferSelectModel<typeof receiptLines>;
export type SalesQuotation = InferSelectModel<typeof salesQuotations>;
export type QuotationLine = InferSelectModel<typeof quotationLines>;