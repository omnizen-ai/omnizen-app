import { db } from '../index';
import { purchaseOrders, contacts, warehouses } from '../schema/index';
import { eq, and, like, or, desc, count, gte, lte } from 'drizzle-orm';

// Purchase Orders queries
export async function getPurchaseOrders(
  organizationId: string,
  filters?: {
    status?: string;
    vendorId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }
) {
  const conditions: any[] = [eq(purchaseOrders.organizationId, organizationId)];
  
  if (filters?.status) {
    conditions.push(eq(purchaseOrders.status, filters.status as any));
  }
  
  if (filters?.vendorId) {
    conditions.push(eq(purchaseOrders.vendorId, filters.vendorId));
  }
  
  if (filters?.dateFrom) {
    conditions.push(gte(purchaseOrders.orderDate, filters.dateFrom));
  }
  
  if (filters?.dateTo) {
    conditions.push(lte(purchaseOrders.orderDate, filters.dateTo));
  }
  
  if (filters?.search) {
    conditions.push(
      or(
        like(purchaseOrders.orderNumber, `%${filters.search}%`),
        like(purchaseOrders.vendorReferenceNumber, `%${filters.search}%`),
        like(purchaseOrders.requisitionNumber, `%${filters.search}%`)
      )
    );
  }
  
  let query = db
    .select({
      order: purchaseOrders,
      vendor: {
        id: contacts.id,
        name: contacts.displayName,
        companyName: contacts.companyName,
        email: contacts.email,
      },
      warehouse: {
        id: warehouses.id,
        name: warehouses.name,
        code: warehouses.code,
      }
    })
    .from(purchaseOrders)
    .leftJoin(contacts, eq(purchaseOrders.vendorId, contacts.id))
    .leftJoin(warehouses, eq(purchaseOrders.shipToWarehouseId, warehouses.id))
    .where(and(...conditions))
    .orderBy(desc(purchaseOrders.orderDate));
  
  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }
  
  const result = await query;
  return result || [];
}

export async function getPurchaseOrderById(purchaseOrderId: string, organizationId: string) {
  const result = await db
    .select({
      order: purchaseOrders,
      vendor: {
        id: contacts.id,
        name: contacts.displayName,
        companyName: contacts.companyName,
        email: contacts.email,
      },
      warehouse: {
        id: warehouses.id,
        name: warehouses.name,
        code: warehouses.code,
      }
    })
    .from(purchaseOrders)
    .leftJoin(contacts, eq(purchaseOrders.vendorId, contacts.id))
    .leftJoin(warehouses, eq(purchaseOrders.shipToWarehouseId, warehouses.id))
    .where(and(eq(purchaseOrders.id, purchaseOrderId), eq(purchaseOrders.organizationId, organizationId)))
    .limit(1);
  
  return result[0] || null;
}

export async function createPurchaseOrder(data: typeof purchaseOrders.$inferInsert) {
  const result = await db.insert(purchaseOrders).values(data).returning();
  return result[0];
}

export async function updatePurchaseOrder(purchaseOrderId: string, organizationId: string, data: Partial<typeof purchaseOrders.$inferInsert>) {
  const result = await db
    .update(purchaseOrders)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(purchaseOrders.id, purchaseOrderId), eq(purchaseOrders.organizationId, organizationId)))
    .returning();
  
  return result[0];
}

export async function deletePurchaseOrder(purchaseOrderId: string, organizationId: string) {
  const result = await db
    .delete(purchaseOrders)
    .where(and(eq(purchaseOrders.id, purchaseOrderId), eq(purchaseOrders.organizationId, organizationId)))
    .returning();
  
  return result[0];
}

export async function getPurchaseOrderSummary(organizationId: string) {
  const totalOrdersResult = await db
    .select({ count: count() })
    .from(purchaseOrders)
    .where(eq(purchaseOrders.organizationId, organizationId));
    
  const draftOrdersResult = await db
    .select({ count: count() })
    .from(purchaseOrders)
    .where(and(
      eq(purchaseOrders.organizationId, organizationId),
      eq(purchaseOrders.status, 'draft')
    ));
    
  const approvedOrdersResult = await db
    .select({ count: count() })
    .from(purchaseOrders)
    .where(and(
      eq(purchaseOrders.organizationId, organizationId),
      eq(purchaseOrders.status, 'approved')
    ));

  const receivedOrdersResult = await db
    .select({ count: count() })
    .from(purchaseOrders)
    .where(and(
      eq(purchaseOrders.organizationId, organizationId),
      eq(purchaseOrders.status, 'received')
    ));

  // Calculate total value of all orders
  const totalValueResult = await db
    .select({
      totalValue: count()
    })
    .from(purchaseOrders)
    .where(eq(purchaseOrders.organizationId, organizationId));

  // Get sum of totalAmount - we'll do this in a separate query since Drizzle doesn't have a direct sum function
  const orders = await db
    .select({ totalAmount: purchaseOrders.totalAmount })
    .from(purchaseOrders)
    .where(eq(purchaseOrders.organizationId, organizationId));
    
  const totalValue = orders.reduce((sum, order) => {
    return sum + parseFloat(order.totalAmount || '0');
  }, 0);

  return {
    totalOrders: totalOrdersResult[0]?.count || 0,
    draftOrders: draftOrdersResult[0]?.count || 0,
    approvedOrders: approvedOrdersResult[0]?.count || 0,
    receivedOrders: receivedOrdersResult[0]?.count || 0,
    totalValue,
  };
}