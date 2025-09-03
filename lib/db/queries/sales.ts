import { db } from '../index';
import { contacts, products, salesOrders, salesOrderLines } from '../schema/index';
import { eq, and, like, or, desc, gte, lte, count, sum, sql } from 'drizzle-orm';

// Contact queries
export async function getContacts(
  organizationId: string,
  filters?: {
    type?: string;
    isActive?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }
) {
  try {
    // Simple query first to test
    const result = await db
      .select()
      .from(contacts)
      .where(eq(contacts.organizationId, organizationId))
      .orderBy(desc(contacts.createdAt))
      .limit(10);
    
    return result || [];
  } catch (error) {
    console.error('Error in getContacts:', error);
    return [];
  }
}

export async function getContactById(contactId: string, organizationId: string) {
  const result = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.id, contactId), eq(contacts.organizationId, organizationId)))
    .limit(1);
  
  return result[0] || null;
}

export async function createContact(data: typeof contacts.$inferInsert) {
  const result = await db.insert(contacts).values(data).returning();
  return result[0];
}

export async function updateContact(contactId: string, organizationId: string, data: Partial<typeof contacts.$inferInsert>) {
  const result = await db
    .update(contacts)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(contacts.id, contactId), eq(contacts.organizationId, organizationId)))
    .returning();
  
  return result[0];
}

export async function deleteContact(contactId: string, organizationId: string) {
  await db
    .delete(contacts)
    .where(and(eq(contacts.id, contactId), eq(contacts.organizationId, organizationId)));
}

export async function getSalesSummary(organizationId: string) {
  const totalContactsResult = await db
    .select({ count: count() })
    .from(contacts)
    .where(eq(contacts.organizationId, organizationId));
    
  const customersResult = await db
    .select({ count: count() })
    .from(contacts)
    .where(and(
      eq(contacts.organizationId, organizationId),
      eq(contacts.type, 'customer')
    ));
    
  const activeCustomersResult = await db
    .select({ count: count() })
    .from(contacts)
    .where(and(
      eq(contacts.organizationId, organizationId),
      eq(contacts.type, 'customer'),
      eq(contacts.isActive, true)
    ));

  return {
    totalContacts: totalContactsResult[0]?.count || 0,
    totalCustomers: customersResult[0]?.count || 0,
    activeCustomers: activeCustomersResult[0]?.count || 0,
    totalOrders: 0, // TODO: Add when orders table is implemented
    totalOrderValue: 0, // TODO: Add when orders table is implemented
  };
}

// Product queries
export async function getProducts(
  organizationId: string,
  filters?: {
    type?: string;
    category?: string;
    isActive?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }
) {
  try {
    // Simple query first to test
    const result = await db
      .select()
      .from(products)
      .where(eq(products.organizationId, organizationId))
      .orderBy(desc(products.createdAt))
      .limit(10);
    
    return result || [];
  } catch (error) {
    console.error('Error in getProducts:', error);
    return [];
  }
}

export async function getProductById(productId: string, organizationId: string) {
  const result = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.organizationId, organizationId)))
    .limit(1);
  
  return result[0] || null;
}

export async function createProduct(data: typeof products.$inferInsert) {
  const result = await db.insert(products).values(data).returning();
  return result[0];
}

export async function updateProduct(productId: string, organizationId: string, data: Partial<typeof products.$inferInsert>) {
  const result = await db
    .update(products)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(products.id, productId), eq(products.organizationId, organizationId)))
    .returning();
  
  return result[0];
}

export async function deleteProduct(productId: string, organizationId: string) {
  await db
    .delete(products)
    .where(and(eq(products.id, productId), eq(products.organizationId, organizationId)));
}

export async function getProductSummary(organizationId: string) {
  const totalProductsResult = await db
    .select({ count: count() })
    .from(products)
    .where(eq(products.organizationId, organizationId));
    
  const activeProductsResult = await db
    .select({ count: count() })
    .from(products)
    .where(and(
      eq(products.organizationId, organizationId),
      eq(products.isActive, true)
    ));
    
  const categoriesResult = await db
    .select({ category: products.category })
    .from(products)
    .where(and(
      eq(products.organizationId, organizationId),
      sql`${products.category} IS NOT NULL AND ${products.category} != ''`
    ))
    .groupBy(products.category);
    
  const totalValueResult = await db
    .select({ totalValue: sum(products.salePrice) })
    .from(products)
    .where(and(
      eq(products.organizationId, organizationId),
      eq(products.isActive, true)
    ));

  return {
    totalProducts: totalProductsResult[0]?.count || 0,
    activeProducts: activeProductsResult[0]?.count || 0,
    categories: categoriesResult.length || 0,
    totalValue: parseFloat(totalValueResult[0]?.totalValue || '0'),
  };
}

// Sales Order queries
export async function getSalesOrders(
  organizationId: string,
  filters?: {
    status?: string;
    customerId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }
) {
  // Simple query without joins first
  const result = await db
    .select()
    .from(salesOrders)
    .where(eq(salesOrders.organizationId, organizationId))
    .orderBy(desc(salesOrders.createdAt))
    .limit(10);
  
  return result || [];
}

export async function getSalesOrderById(orderId: string, organizationId: string) {
  const result = await db
    .select({
      order: salesOrders,
      customer: {
        id: contacts.id,
        name: contacts.displayName,
        email: contacts.email,
        companyName: contacts.companyName,
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

  const result = await db
    .delete(salesOrders)
    .where(and(eq(salesOrders.id, orderId), eq(salesOrders.organizationId, organizationId)))
    .returning();
  
  return result[0];
}