import { db } from '../index';
import { warehouses } from '../schema/index';
import { eq, and, like, or, desc, count } from 'drizzle-orm';

// Warehouse queries
export async function getWarehouses(
  organizationId: string,
  filters?: {
    type?: string;
    isActive?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }
) {
  const conditions: any[] = [eq(warehouses.organizationId, organizationId)];
  
  if (filters?.type) {
    conditions.push(eq(warehouses.type, filters.type as any));
  }
  
  if (filters?.isActive !== undefined) {
    conditions.push(eq(warehouses.isActive, filters.isActive));
  }
  
  if (filters?.search) {
    conditions.push(
      or(
        like(warehouses.name, `%${filters.search}%`),
        like(warehouses.code, `%${filters.search}%`),
        like(warehouses.city, `%${filters.search}%`)
      )
    );
  }
  
  let query = db
    .select()
    .from(warehouses)
    .where(and(...conditions))
    .orderBy(desc(warehouses.createdAt));
  
  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }
  
  const result = await query;
  return result || [];
}

export async function getWarehouseById(warehouseId: string, organizationId: string) {
  const result = await db
    .select()
    .from(warehouses)
    .where(and(eq(warehouses.id, warehouseId), eq(warehouses.organizationId, organizationId)))
    .limit(1);
  
  return result[0] || null;
}

export async function createWarehouse(data: typeof warehouses.$inferInsert) {
  const result = await db.insert(warehouses).values(data).returning();
  return result[0];
}

export async function updateWarehouse(warehouseId: string, organizationId: string, data: Partial<typeof warehouses.$inferInsert>) {
  const result = await db
    .update(warehouses)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(warehouses.id, warehouseId), eq(warehouses.organizationId, organizationId)))
    .returning();
  
  return result[0];
}

export async function deleteWarehouse(warehouseId: string, organizationId: string) {
  const result = await db
    .delete(warehouses)
    .where(and(eq(warehouses.id, warehouseId), eq(warehouses.organizationId, organizationId)))
    .returning();
  
  return result[0];
}

export async function getWarehouseSummary(organizationId: string) {
  const totalWarehousesResult = await db
    .select({ count: count() })
    .from(warehouses)
    .where(eq(warehouses.organizationId, organizationId));
    
  const activeWarehousesResult = await db
    .select({ count: count() })
    .from(warehouses)
    .where(and(
      eq(warehouses.organizationId, organizationId),
      eq(warehouses.isActive, true)
    ));
    
  const mainWarehousesResult = await db
    .select({ count: count() })
    .from(warehouses)
    .where(and(
      eq(warehouses.organizationId, organizationId),
      eq(warehouses.type, 'main')
    ));

  const defaultWarehousesResult = await db
    .select({ count: count() })
    .from(warehouses)
    .where(and(
      eq(warehouses.organizationId, organizationId),
      eq(warehouses.isDefault, true)
    ));

  return {
    totalWarehouses: totalWarehousesResult[0]?.count || 0,
    activeWarehouses: activeWarehousesResult[0]?.count || 0,
    mainWarehouses: mainWarehousesResult[0]?.count || 0,
    defaultWarehouses: defaultWarehousesResult[0]?.count || 0,
  };
}