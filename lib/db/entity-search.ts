/**
 * Entity Search Functions for Frontend Autocomplete
 * TanStack Query compatible functions for @ mention autocomplete
 * Uses transactions and RLS for proper auth context
 */

import { db } from './index';
import { 
  contacts, 
  products, 
  invoices, 
  bills, 
  payments,
} from './schema/finance/transactions';
import { chartAccounts } from './schema/finance/accounts';
import { salesOrders, purchaseOrders } from './schema/erp/orders';
import { and, eq, like, or, desc, asc, sql } from 'drizzle-orm';

export interface UserContext {
  userId: string;
  orgId: string;
  workspaceId?: string;
  role: string;
}

export interface EntitySearchResult {
  id: string;
  name: string;
  description?: string;
  type?: string;
  metadata?: Record<string, any>;
}

/**
 * Search customers/contacts using transactions and RLS
 */
export async function searchCustomers(
  searchTerm: string, 
  userContext: UserContext,
  limit: number = 10
): Promise<EntitySearchResult[]> {
  try {
    // Execute in transaction to ensure auth context and query use same connection
    const results = await db.transaction(async (tx) => {
      // Set auth context for RLS
      await tx.execute(sql`
        SELECT set_config('auth.user_id', ${userContext.userId}, true),
               set_config('auth.org_id', ${userContext.orgId}, true),
               set_config('auth.workspace_id', ${userContext.workspaceId || ''}, true),
               set_config('auth.role', ${userContext.role}, true)
      `);

      // Execute query - RLS handles organization filtering automatically
      return await tx
        .select({
          id: contacts.id,
          name: contacts.displayName,
          companyName: contacts.companyName,
          firstName: contacts.firstName,
          lastName: contacts.lastName,
          email: contacts.email,
          type: contacts.type,
        })
        .from(contacts)
        .where(
          and(
            or(
              like(contacts.displayName, `%${searchTerm}%`),
              like(contacts.companyName, `%${searchTerm}%`),
              like(contacts.firstName, `%${searchTerm}%`),
              like(contacts.lastName, `%${searchTerm}%`),
              like(contacts.email, `%${searchTerm}%`)
            ),
            eq(contacts.isActive, true)
          )
        )
        .orderBy(asc(contacts.displayName))
        .limit(limit);
    });

    return results.map(contact => ({
      id: contact.id,
      name: contact.name || contact.companyName || `${contact.firstName} ${contact.lastName}`.trim(),
      description: contact.email || undefined,
      type: contact.type || undefined,
      metadata: {
        companyName: contact.companyName,
        email: contact.email,
        type: contact.type,
      }
    }));
  } catch (error) {
    console.error('[EntitySearch] Customer search error:', error);
    return [];
  }
}

/**
 * Search products/services
 */
export async function searchProducts(
  searchTerm: string,
  userContext: UserContext,
  limit: number = 10
): Promise<EntitySearchResult[]> {
  try {
    const results = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        description: products.description,
        category: products.category,
        salePrice: products.salePrice,
      })
      .from(products)
      .where(
        and(
          eq(products.organizationId, userContext.orgId),
          or(
            like(products.name, `%${searchTerm}%`),
            like(products.sku, `%${searchTerm}%`),
            like(products.description, `%${searchTerm}%`),
            like(products.category, `%${searchTerm}%`)
          ),
          eq(products.isActive, true)
        )
      )
      .orderBy(asc(products.name))
      .limit(limit);

    return results.map(product => ({
      id: product.id,
      name: product.name,
      description: `${product.sku} - $${product.salePrice}`,
      type: product.category || 'product',
      metadata: {
        sku: product.sku,
        price: product.salePrice,
        category: product.category,
      }
    }));
  } catch (error) {
    console.error('[EntitySearch] Product search error:', error);
    return [];
  }
}

/**
 * Search invoices
 */
export async function searchInvoices(
  searchTerm: string,
  userContext: UserContext,
  limit: number = 10
): Promise<EntitySearchResult[]> {
  try {
    const results = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        customerId: invoices.customerId,
        total: invoices.total,
        status: invoices.status,
        dueDate: invoices.dueDate,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.organizationId, userContext.orgId),
          like(invoices.invoiceNumber, `%${searchTerm}%`)
        )
      )
      .orderBy(desc(invoices.createdAt))
      .limit(limit);

    return results.map(invoice => ({
      id: invoice.id,
      name: invoice.invoiceNumber,
      description: `$${invoice.total} - ${invoice.status}`,
      type: 'invoice',
      metadata: {
        customerId: invoice.customerId,
        total: invoice.total,
        status: invoice.status,
        dueDate: invoice.dueDate,
      }
    }));
  } catch (error) {
    console.error('[EntitySearch] Invoice search error:', error);
    return [];
  }
}

/**
 * Search vendors using transactions and RLS
 */
export async function searchVendors(
  searchTerm: string,
  userContext: UserContext,
  limit: number = 10
): Promise<EntitySearchResult[]> {
  try {
    // Execute in transaction to ensure auth context and query use same connection
    const results = await db.transaction(async (tx) => {
      // Set auth context for RLS
      await tx.execute(sql`
        SELECT set_config('auth.user_id', ${userContext.userId}, true),
               set_config('auth.org_id', ${userContext.orgId}, true),
               set_config('auth.workspace_id', ${userContext.workspaceId || ''}, true),
               set_config('auth.role', ${userContext.role}, true)
      `);

      // Execute query - RLS handles organization filtering automatically
      return await tx
        .select({
          id: contacts.id,
          name: contacts.displayName,
          companyName: contacts.companyName,
          email: contacts.email,
          type: contacts.type,
        })
        .from(contacts)
        .where(
          and(
            or(
              eq(contacts.type, 'vendor'),
              eq(contacts.type, 'customer_vendor')
            ),
            or(
              like(contacts.displayName, `%${searchTerm}%`),
              like(contacts.companyName, `%${searchTerm}%`),
              like(contacts.email, `%${searchTerm}%`)
            ),
            eq(contacts.isActive, true)
          )
        )
        .orderBy(asc(contacts.displayName))
        .limit(limit);
    });

    return results.map(vendor => ({
      id: vendor.id,
      name: vendor.name || vendor.companyName || 'Unknown',
      description: vendor.email || undefined,
      type: 'vendor',
      metadata: {
        companyName: vendor.companyName,
        email: vendor.email,
      }
    }));
  } catch (error) {
    console.error('[EntitySearch] Vendor search error:', error);
    return [];
  }
}

/**
 * Search chart of accounts
 */
export async function searchAccounts(
  searchTerm: string,
  userContext: UserContext,
  limit: number = 10
): Promise<EntitySearchResult[]> {
  try {
    const results = await db
      .select({
        id: chartAccounts.id,
        accountCode: chartAccounts.accountCode,
        accountName: chartAccounts.accountName,
        accountType: chartAccounts.accountType,
        description: chartAccounts.description,
      })
      .from(chartAccounts)
      .where(
        and(
          eq(chartAccounts.organizationId, userContext.orgId),
          or(
            like(chartAccounts.accountCode, `%${searchTerm}%`),
            like(chartAccounts.accountName, `%${searchTerm}%`),
            like(chartAccounts.description, `%${searchTerm}%`)
          ),
          eq(chartAccounts.isActive, true)
        )
      )
      .orderBy(asc(chartAccounts.accountCode))
      .limit(limit);

    return results.map(account => ({
      id: account.id,
      name: `${account.accountCode} - ${account.accountName}`,
      description: account.description || account.accountType,
      type: account.accountType,
      metadata: {
        accountCode: account.accountCode,
        accountType: account.accountType,
      }
    }));
  } catch (error) {
    console.error('[EntitySearch] Account search error:', error);
    return [];
  }
}

/**
 * Search payments
 */
export async function searchPayments(
  searchTerm: string,
  userContext: UserContext,
  limit: number = 10
): Promise<EntitySearchResult[]> {
  try {
    const results = await db
      .select({
        id: payments.id,
        paymentNumber: payments.paymentNumber,
        amount: payments.amount,
        paymentMethod: payments.paymentMethod,
        paymentDate: payments.paymentDate,
      })
      .from(payments)
      .where(
        and(
          eq(payments.organizationId, userContext.orgId),
          like(payments.paymentNumber, `%${searchTerm}%`)
        )
      )
      .orderBy(desc(payments.paymentDate))
      .limit(limit);

    return results.map(payment => ({
      id: payment.id,
      name: payment.paymentNumber,
      description: `$${payment.amount} - ${payment.paymentMethod}`,
      type: 'payment',
      metadata: {
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.paymentDate,
      }
    }));
  } catch (error) {
    console.error('[EntitySearch] Payment search error:', error);
    return [];
  }
}

/**
 * Search sales orders
 */
export async function searchSalesOrders(
  searchTerm: string,
  userContext: UserContext,
  limit: number = 10
): Promise<EntitySearchResult[]> {
  try {
    const results = await db
      .select({
        id: salesOrders.id,
        orderNumber: salesOrders.orderNumber,
        customerId: salesOrders.customerId,
        total: salesOrders.total,
        status: salesOrders.status,
        orderDate: salesOrders.orderDate,
      })
      .from(salesOrders)
      .where(
        and(
          eq(salesOrders.organizationId, userContext.orgId),
          like(salesOrders.orderNumber, `%${searchTerm}%`)
        )
      )
      .orderBy(desc(salesOrders.orderDate))
      .limit(limit);

    return results.map(order => ({
      id: order.id,
      name: order.orderNumber,
      description: `$${order.total} - ${order.status}`,
      type: 'sales_order',
      metadata: {
        customerId: order.customerId,
        total: order.total,
        status: order.status,
        orderDate: order.orderDate,
      }
    }));
  } catch (error) {
    console.error('[EntitySearch] Sales order search error:', error);
    return [];
  }
}

/**
 * Universal entity search router
 */
export async function searchEntities(
  entityType: string,
  searchTerm: string,
  userContext: UserContext,
  limit: number = 10
): Promise<EntitySearchResult[]> {
  switch (entityType.toLowerCase()) {
    case 'customer':
    case 'customers':
    case 'contact':
    case 'contacts':
      return searchCustomers(searchTerm, userContext, limit);
      
    case 'product':
    case 'products':
    case 'item':
    case 'items':
      return searchProducts(searchTerm, userContext, limit);
      
    case 'invoice':
    case 'invoices':
      return searchInvoices(searchTerm, userContext, limit);
      
    case 'vendor':
    case 'vendors':
    case 'supplier':
    case 'suppliers':
      return searchVendors(searchTerm, userContext, limit);
      
    case 'account':
    case 'accounts':
      return searchAccounts(searchTerm, userContext, limit);
      
    case 'payment':
    case 'payments':
      return searchPayments(searchTerm, userContext, limit);
      
    case 'order':
    case 'orders':
    case 'sales_order':
    case 'sales_orders':
      return searchSalesOrders(searchTerm, userContext, limit);
      
    default:
      console.warn(`[EntitySearch] Unknown entity type: ${entityType}`);
      return [];
  }
}

/**
 * Get available entity types for autocomplete
 */
export function getAvailableEntityTypes(): Array<{type: string, displayName: string}> {
  return [
    { type: 'customer', displayName: 'Customers' },
    { type: 'vendor', displayName: 'Vendors' },
    { type: 'product', displayName: 'Products' },
    { type: 'invoice', displayName: 'Invoices' },
    { type: 'payment', displayName: 'Payments' },
    { type: 'account', displayName: 'Accounts' },
    { type: 'order', displayName: 'Orders' },
  ];
}