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
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { organizations, workspaces } from '../core/organizations';
import { products } from '../finance/transactions';
import { users } from '../core/users';

// Warehouse types
export const warehouseTypeEnum = pgEnum('warehouse_type', [
  'main',
  'branch',
  'retail',
  'distribution',
  'virtual',
  'consignment',
  'third_party'
]);

// Warehouses - Multi-location inventory management
export const warehouses = pgTable('warehouses', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  
  // Warehouse identification
  code: text('code').notNull(),
  name: text('name').notNull(),
  type: warehouseTypeEnum('type').notNull().default('main'),
  
  // Location details
  addressLine1: text('address_line1'),
  addressLine2: text('address_line2'),
  city: text('city'),
  state: text('state'),
  postalCode: text('postal_code'),
  country: text('country'),
  
  // Contact information
  managerName: text('manager_name'),
  phone: text('phone'),
  email: text('email'),
  
  // Settings
  isDefault: boolean('is_default').notNull().default(false),
  allowNegativeStock: boolean('allow_negative_stock').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  
  // Metadata
  customFields: jsonb('custom_fields'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgCodeIdx: uniqueIndex('erp_warehouse_org_code_idx').on(table.organizationId, table.code),
  typeIdx: index('erp_warehouse_type_idx').on(table.type),
  activeIdx: index('erp_warehouse_active_idx').on(table.isActive),
}));

// Stock move types
export const stockMoveTypeEnum = pgEnum('stock_move_type', [
  'purchase',
  'sale',
  'transfer',
  'adjustment',
  'production',
  'return',
  'damage',
  'count'
]);

// Stock Moves - Track all inventory movements
export const stockMoves = pgTable('stock_moves', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Movement details
  moveNumber: text('move_number').notNull(),
  moveDate: timestamp('move_date').notNull(),
  moveType: stockMoveTypeEnum('move_type').notNull(),
  
  // Product and location
  productId: uuid('product_id').notNull().references(() => products.id),
  fromWarehouseId: uuid('from_warehouse_id').references(() => warehouses.id),
  toWarehouseId: uuid('to_warehouse_id').references(() => warehouses.id),
  
  // Quantities
  quantity: decimal('quantity', { precision: 20, scale: 6 }).notNull(),
  unitCost: decimal('unit_cost', { precision: 20, scale: 6 }),
  totalCost: decimal('total_cost', { precision: 20, scale: 2 }),
  
  // Reference to source document
  referenceType: text('reference_type'), // invoice, bill, transfer_order, adjustment
  referenceId: uuid('reference_id'),
  
  // Reason and notes
  reason: text('reason'),
  notes: text('notes'),
  
  // Tracking
  lotNumber: text('lot_number'),
  serialNumber: text('serial_number'),
  expiryDate: timestamp('expiry_date'),
  
  // Status
  status: text('status').notNull().default('completed'), // pending, completed, cancelled
  
  // Audit
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  orgNumberIdx: uniqueIndex('erp_stock_move_org_number_idx').on(table.organizationId, table.moveNumber),
  productIdx: index('erp_stock_move_product_idx').on(table.productId),
  warehouseIdx: index('erp_stock_move_warehouse_idx').on(table.fromWarehouseId, table.toWarehouseId),
  dateIdx: index('erp_stock_move_date_idx').on(table.moveDate),
  typeIdx: index('erp_stock_move_type_idx').on(table.moveType),
  referenceIdx: index('erp_stock_move_reference_idx').on(table.referenceType, table.referenceId),
}));

// Inventory Levels - Current stock per product per warehouse
export const inventoryLevels = pgTable('inventory_levels', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  warehouseId: uuid('warehouse_id').notNull().references(() => warehouses.id),
  
  // Stock quantities
  quantityOnHand: decimal('quantity_on_hand', { precision: 20, scale: 6 }).notNull().default('0'),
  quantityReserved: decimal('quantity_reserved', { precision: 20, scale: 6 }).notNull().default('0'),
  quantityAvailable: decimal('quantity_available', { precision: 20, scale: 6 }).notNull().default('0'),
  
  // Reorder settings (can override product defaults per warehouse)
  reorderPoint: decimal('reorder_point', { precision: 20, scale: 6 }),
  reorderQuantity: decimal('reorder_quantity', { precision: 20, scale: 6 }),
  maxStockLevel: decimal('max_stock_level', { precision: 20, scale: 6 }),
  
  // Valuation
  averageCost: decimal('average_cost', { precision: 20, scale: 6 }),
  lastPurchaseCost: decimal('last_purchase_cost', { precision: 20, scale: 6 }),
  totalValue: decimal('total_value', { precision: 20, scale: 2 }),
  
  // Last activity
  lastReceivedDate: timestamp('last_received_date'),
  lastSoldDate: timestamp('last_sold_date'),
  lastCountedDate: timestamp('last_counted_date'),
  
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  uniqueProductWarehouseIdx: uniqueIndex('erp_inventory_unique_idx').on(
    table.organizationId,
    table.productId,
    table.warehouseId
  ),
  warehouseIdx: index('erp_inventory_warehouse_idx').on(table.warehouseId),
  productIdx: index('erp_inventory_product_idx').on(table.productId),
}));

// Inventory adjustment reasons
export const adjustmentReasonEnum = pgEnum('adjustment_reason', [
  'cycle_count',
  'physical_inventory',
  'damaged',
  'expired',
  'lost',
  'found',
  'theft',
  'data_correction',
  'other'
]);

// Inventory Adjustments - Track manual adjustments
export const inventoryAdjustments = pgTable('inventory_adjustments', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Adjustment details
  adjustmentNumber: text('adjustment_number').notNull(),
  adjustmentDate: timestamp('adjustment_date').notNull(),
  
  // Warehouse
  warehouseId: uuid('warehouse_id').notNull().references(() => warehouses.id),
  
  // Reason and approval
  reason: adjustmentReasonEnum('reason').notNull(),
  description: text('description'),
  
  // Status and approval
  status: text('status').notNull().default('draft'), // draft, pending_approval, approved, posted, cancelled
  
  // Approval workflow
  requestedBy: uuid('requested_by').references(() => users.id),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  
  // Posting
  postedAt: timestamp('posted_at'),
  stockMoveIds: jsonb('stock_move_ids'), // Array of generated stock move IDs
  
  // Totals
  totalItems: decimal('total_items', { precision: 10, scale: 0 }).notNull().default('0'),
  totalValueChange: decimal('total_value_change', { precision: 20, scale: 2 }),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgNumberIdx: uniqueIndex('erp_adjustment_org_number_idx').on(table.organizationId, table.adjustmentNumber),
  warehouseIdx: index('erp_adjustment_warehouse_idx').on(table.warehouseId),
  statusIdx: index('erp_adjustment_status_idx').on(table.status),
  dateIdx: index('erp_adjustment_date_idx').on(table.adjustmentDate),
}));

// Inventory Adjustment Lines
export const inventoryAdjustmentLines = pgTable('inventory_adjustment_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  adjustmentId: uuid('adjustment_id').notNull().references(() => inventoryAdjustments.id, { onDelete: 'cascade' }),
  lineNumber: decimal('line_number', { precision: 10, scale: 0 }).notNull(),
  
  // Product details
  productId: uuid('product_id').notNull().references(() => products.id),
  
  // Quantities
  currentQuantity: decimal('current_quantity', { precision: 20, scale: 6 }).notNull(),
  newQuantity: decimal('new_quantity', { precision: 20, scale: 6 }).notNull(),
  adjustmentQuantity: decimal('adjustment_quantity', { precision: 20, scale: 6 }).notNull(),
  
  // Cost
  unitCost: decimal('unit_cost', { precision: 20, scale: 6 }),
  totalValueChange: decimal('total_value_change', { precision: 20, scale: 2 }),
  
  // Tracking
  lotNumber: text('lot_number'),
  serialNumber: text('serial_number'),
  
  // Notes
  notes: text('notes'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  adjustmentLineIdx: uniqueIndex('erp_adj_line_idx').on(table.adjustmentId, table.lineNumber),
  productIdx: index('erp_adj_line_product_idx').on(table.productId),
}));

// Relations
export const warehousesRelations = relations(warehouses, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [warehouses.organizationId],
    references: [organizations.id],
  }),
  workspace: one(workspaces, {
    fields: [warehouses.workspaceId],
    references: [workspaces.id],
  }),
  inventoryLevels: many(inventoryLevels),
  stockMovesFrom: many(stockMoves, { relationName: 'fromWarehouse' }),
  stockMovesTo: many(stockMoves, { relationName: 'toWarehouse' }),
  adjustments: many(inventoryAdjustments),
}));

export const stockMovesRelations = relations(stockMoves, ({ one }) => ({
  organization: one(organizations, {
    fields: [stockMoves.organizationId],
    references: [organizations.id],
  }),
  product: one(products, {
    fields: [stockMoves.productId],
    references: [products.id],
  }),
  fromWarehouse: one(warehouses, {
    fields: [stockMoves.fromWarehouseId],
    references: [warehouses.id],
    relationName: 'fromWarehouse',
  }),
  toWarehouse: one(warehouses, {
    fields: [stockMoves.toWarehouseId],
    references: [warehouses.id],
    relationName: 'toWarehouse',
  }),
  createdBy: one(users, {
    fields: [stockMoves.createdBy],
    references: [users.id],
  }),
}));

export const inventoryLevelsRelations = relations(inventoryLevels, ({ one }) => ({
  organization: one(organizations, {
    fields: [inventoryLevels.organizationId],
    references: [organizations.id],
  }),
  product: one(products, {
    fields: [inventoryLevels.productId],
    references: [products.id],
  }),
  warehouse: one(warehouses, {
    fields: [inventoryLevels.warehouseId],
    references: [warehouses.id],
  }),
}));

export const inventoryAdjustmentsRelations = relations(inventoryAdjustments, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [inventoryAdjustments.organizationId],
    references: [organizations.id],
  }),
  warehouse: one(warehouses, {
    fields: [inventoryAdjustments.warehouseId],
    references: [warehouses.id],
  }),
  requestedBy: one(users, {
    fields: [inventoryAdjustments.requestedBy],
    references: [users.id],
    relationName: 'requestedAdjustments',
  }),
  approvedBy: one(users, {
    fields: [inventoryAdjustments.approvedBy],
    references: [users.id],
    relationName: 'approvedAdjustments',
  }),
  lines: many(inventoryAdjustmentLines),
}));

// Types
export type Warehouse = InferSelectModel<typeof warehouses>;
export type StockMove = InferSelectModel<typeof stockMoves>;
export type InventoryLevel = InferSelectModel<typeof inventoryLevels>;
export type InventoryAdjustment = InferSelectModel<typeof inventoryAdjustments>;
export type InventoryAdjustmentLine = InferSelectModel<typeof inventoryAdjustmentLines>;