import { db } from '../index';
import { salesOrders, salesOrderLines, contacts, products } from '../schema/index';
import { eq, and, like, or, desc, gte, lte, count, sum, sql } from 'drizzle-orm';

// Sales Order queries
export async function getSalesOrders(
  organizationId: string,
  filters?: {
    status?: string;
    customerId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }
) {
  const conditions: any[] = [eq(salesOrders.organizationId, organizationId)];
  
  if (filters?.status) {
    conditions.push(eq(salesOrders.status, filters.status as any));
  }
  
  if (filters?.customerId) {
    conditions.push(eq(salesOrders.customerId, filters.customerId));
  }
  
  if (filters?.dateFrom) {
    conditions.push(gte(salesOrders.orderDate, filters.dateFrom));
  }
  
  if (filters?.dateTo) {
    conditions.push(lte(salesOrders.orderDate, filters.dateTo));
  }
  
  if (filters?.search) {
    conditions.push(
      or(
        like(salesOrders.orderNumber, `%${filters.search}%`),
        like(salesOrders.customerPoNumber, `%${filters.search}%`)
      )
    );
  }
  
  let query = db
    .select({
      order: salesOrders,
      customer: {
        id: contacts.id,
        name: contacts.displayName,
        companyName: contacts.companyName,
        email: contacts.email,
      }
    })
    .from(salesOrders)
    .leftJoin(contacts, eq(salesOrders.customerId, contacts.id))
    .where(and(...conditions))
    .orderBy(desc(salesOrders.orderDate));
  
  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }
  
  const result = await query;
  return result || [];
}

export async function getSalesOrderById(orderId: string, organizationId: string) {
  const result = await db
    .select({
      order: salesOrders,
      customer: {
        id: contacts.id,
        name: contacts.displayName,
        companyName: contacts.companyName,
        email: contacts.email,
        phone: contacts.phone,
        addressLine1: contacts.addressLine1,
        addressLine2: contacts.addressLine2,
        city: contacts.city,
        state: contacts.state,
        postalCode: contacts.postalCode,
        country: contacts.country,
      }
    })
    .from(salesOrders)
    .leftJoin(contacts, eq(salesOrders.customerId, contacts.id))
    .where(and(eq(salesOrders.id, orderId), eq(salesOrders.organizationId, organizationId)))
    .limit(1);
  
  return result[0] || null;
}

export async function createSalesOrder(data: typeof salesOrders.$inferInsert) {
  const result = await db.insert(salesOrders).values(data).returning();
  return result[0];
}

export async function updateSalesOrder(orderId: string, organizationId: string, data: Partial<typeof salesOrders.$inferInsert>) {
  const result = await db
    .update(salesOrders)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(salesOrders.id, orderId), eq(salesOrders.organizationId, organizationId)))
    .returning();
  
  return result[0];
}

export async function deleteSalesOrder(orderId: string, organizationId: string) {
  // Delete order lines first (foreign key constraint)
  await db
    .delete(salesOrderLines)
    .where(eq(salesOrderLines.salesOrderId, orderId));

  await db
    .delete(salesOrders)
    .where(and(eq(salesOrders.id, orderId), eq(salesOrders.organizationId, organizationId)));
}

export async function getSalesOrderSummary(organizationId: string) {
  const totalOrdersResult = await db
    .select({ count: count() })
    .from(salesOrders)
    .where(eq(salesOrders.organizationId, organizationId));
    
  const draftOrdersResult = await db
    .select({ count: count() })
    .from(salesOrders)
    .where(and(
      eq(salesOrders.organizationId, organizationId),
      eq(salesOrders.status, 'draft')
    ));
    
  const confirmedOrdersResult = await db
    .select({ count: count() })
    .from(salesOrders)
    .where(and(
      eq(salesOrders.organizationId, organizationId),
      eq(salesOrders.status, 'confirmed')
    ));

  const totalValueResult = await db
    .select({ totalValue: sum(salesOrders.totalAmount) })
    .from(salesOrders)
    .where(eq(salesOrders.organizationId, organizationId));

  return {
    totalOrders: totalOrdersResult[0]?.count || 0,
    draftOrders: draftOrdersResult[0]?.count || 0,
    confirmedOrders: confirmedOrdersResult[0]?.count || 0,
    totalValue: parseFloat(totalValueResult[0]?.totalValue || '0'),
  };
}