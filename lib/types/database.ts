/**
 * Client-safe database type definitions  
 * This file provides static type definitions safe for client-side use
 * No imports from database modules to prevent bundling issues
 */

// Core entity types for client-side use - manually defined to match Supabase schema
export interface Contact {
  id: string;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  company_name?: string | null;
  country?: string | null;
  created_at: string;
  credit_limit?: number | null;
  currency_code: string;
  custom_fields?: any;
  default_purchase_account_id?: string | null;
  default_sales_account_id?: string | null;
  display_name?: string | null;
  email?: string | null;
  external_code?: string | null;
  first_name?: string | null;
  is_active: boolean;
  last_name?: string | null;
  mobile?: string | null;
  notes?: string | null;
  organization_id: string;
  payment_terms?: string | null;
  phone?: string | null;
  postal_code?: string | null;
  region?: string | null;
  tax_number?: string | null;
  type: string;
  updated_at: string;
  website?: string | null;
  workspace_id: string;
}

export interface Product {
  id: string;
  category?: string | null;
  created_at: string;
  currency_code: string;
  custom_fields?: any;
  description?: string | null;
  expense_account_id?: string | null;
  income_account_id?: string | null;
  inventory_account_id?: string | null;
  is_active: boolean;
  is_service: boolean;
  is_taxable: boolean;
  is_tracked_inventory: boolean;
  name: string;
  organization_id: string;
  preferred_vendor_id?: string | null;
  purchase_price?: number | null;
  quantity_on_hand?: number | null;
  reorder_point?: number | null;
  sales_price?: number | null;
  sku?: string | null;
  tax_code_id?: string | null;
  unit_of_measure?: string | null;
  updated_at: string;
  workspace_id: string;
}

export interface SalesOrder {
  id: string;
  created_at: string;
  currency_code: string;
  customer_id: string;
  delivery_address?: string | null;
  delivery_date?: string | null;
  discount_amount?: number | null;
  notes?: string | null;
  order_date: string;
  order_number: string;
  organization_id: string;
  reference?: string | null;
  shipping_amount?: number | null;
  status: string;
  subtotal_amount?: number | null;
  tax_amount?: number | null;
  total_amount: number;
  updated_at: string;
  workspace_id: string;
}

export interface PurchaseOrder {
  id: string;
  created_at: string;
  currency_code: string;
  delivery_address?: string | null;
  delivery_date?: string | null;
  discount_amount?: number | null;
  expected_date?: string | null;
  notes?: string | null;
  order_date: string;
  order_number: string;
  organization_id: string;
  reference?: string | null;
  shipping_amount?: number | null;
  status: string;
  subtotal_amount?: number | null;
  supplier_id: string;
  tax_amount?: number | null;
  total_amount: number;
  updated_at: string;
  workspace_id: string;
}

export interface Warehouse {
  id: string;
  address?: string | null;
  created_at: string;
  is_default: boolean;
  name: string;
  organization_id: string;
  updated_at: string;
  workspace_id: string;
}

export interface Invoice {
  id: string;
  created_at: string;
  currency_code: string;
  customer_id: string;
  discount_amount?: number | null;
  due_date: string;
  invoice_date: string;
  invoice_number: string;
  notes?: string | null;
  organization_id: string;
  paid_amount?: number | null;
  payment_terms?: string | null;
  reference?: string | null;
  status: string;
  subtotal_amount?: number | null;
  tax_amount?: number | null;
  total_amount: number;
  updated_at: string;
  workspace_id: string;
}

export interface Bill {
  id: string;
  bill_date: string;
  bill_number: string;
  created_at: string;
  currency_code: string;
  discount_amount?: number | null;
  due_date: string;
  notes?: string | null;
  organization_id: string;
  paid_amount?: number | null;
  reference?: string | null;
  status: string;
  subtotal_amount?: number | null;
  supplier_id: string;
  tax_amount?: number | null;
  total_amount: number;
  updated_at: string;
  workspace_id: string;
}

export interface BankAccount {
  id: string;
  account_name: string;
  account_number: string;
  account_type: string;
  bank_name: string;
  created_at: string;
  currency_code: string;
  is_active: boolean;
  organization_id: string;
  updated_at: string;
  workspace_id: string;
}

export interface BankTransaction {
  id: string;
  account_id: string;
  amount: number;
  balance: number;
  created_at: string;
  description: string;
  organization_id: string;
  reference?: string | null;
  transaction_date: string;
  transaction_type: string;
  updated_at: string;
  workspace_id: string;
}

export interface ChartAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  created_at: string;
  is_active: boolean;
  organization_id: string;
  parent_account_id?: string | null;
  updated_at: string;
  workspace_id: string;
}

// Additional utility types for client-side use
export interface EntitySearchResult {
  id: string;
  name: string;
  type: 'customer' | 'vendor' | 'product' | 'order' | 'invoice' | 'bill' | 'quotation' | 'warehouse';
  subtitle?: string;
  metadata?: Record<string, any>;
}

export interface UserContext {
  organizationId: string;
  workspaceId: string;
  userId: string;
  role: string;
}

// Summary/stats types for API responses
export interface SalesSummary {
  totalContacts: number;
  totalCustomers: number;
  activeCustomers: number;
  totalOrders: number;
  totalOrderValue: number;
}

export interface VendorsSummary {
  totalVendors: number;
  activeVendors: number;
  recentVendors: number;
  totalPurchases: number;
}

export interface WarehousesSummary {
  totalWarehouses: number;
  activeWarehouses: number;
  mainWarehouses: number;
  defaultWarehouses: number;
}

export interface ProductsSummary {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}