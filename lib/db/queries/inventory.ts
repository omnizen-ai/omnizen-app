import { db } from '@/lib/db';
import {
  warehouses,
  inventoryLevels,
  stockMoves,
  inventoryAdjustments,
  products,
  type Warehouse,
  type InventoryLevel,
  type StockMove,
  type InventoryAdjustment,
} from '@/lib/db/schema/index';
import { eq, desc, and, gte, lte, sql, or, like, asc } from 'drizzle-orm';

// Get all warehouses
export async function getWarehouses(organizationId: string) {
  const warehouseList = await db
    .select()
    .from(warehouses)
    .where(
      and(
        eq(warehouses.organizationId, organizationId),
        eq(warehouses.isActive, true)
      )
    )
    .orderBy(asc(warehouses.name));
  
  return warehouseList || [];
}

// Get inventory levels with product info
export async function getInventoryLevels(
  organizationId: string,
  filters?: {
    warehouseId?: string;
    productId?: string;
    lowStock?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }
) {
  const conditions: any[] = [eq(inventoryLevels.organizationId, organizationId)];
  
  if (filters?.warehouseId) {
    conditions.push(eq(inventoryLevels.warehouseId, filters.warehouseId));
  }
  
  if (filters?.productId) {
    conditions.push(eq(inventoryLevels.productId, filters.productId));
  }
  
  if (filters?.lowStock) {
    conditions.push(sql`${inventoryLevels.quantityOnHand} <= ${inventoryLevels.reorderPoint}`);
  }
  
  let query = db
    .select({
      inventory: inventoryLevels,
      product: products,
      warehouse: warehouses,
    })
    .from(inventoryLevels)
    .leftJoin(products, eq(inventoryLevels.productId, products.id))
    .leftJoin(warehouses, eq(inventoryLevels.warehouseId, warehouses.id))
    .where(and(...conditions))
    .orderBy(desc(inventoryLevels.updatedAt));
  
  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }
  
  const result = await query;
  return result || [];
}

// Create inventory level
export async function createInventoryLevel(data: Omit<InventoryLevel, 'id' | 'createdAt' | 'updatedAt'>) {
  const [inventory] = await db
    .insert(inventoryLevels)
    .values(data)
    .returning();
  return inventory;
}

// Update inventory level
export async function updateInventoryLevel(
  id: string,
  organizationId: string,
  data: Partial<Omit<InventoryLevel, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>>
) {
  const [inventory] = await db
    .update(inventoryLevels)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(inventoryLevels.id, id),
        eq(inventoryLevels.organizationId, organizationId)
      )
    )
    .returning();
  return inventory;
}

// Get stock moves
export async function getStockMoves(
  organizationId: string,
  filters?: {
    warehouseId?: string;
    productId?: string;
    moveType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
) {
  const conditions: any[] = [eq(stockMoves.organizationId, organizationId)];
  
  if (filters?.warehouseId) {
    conditions.push(
      or(
        eq(stockMoves.sourceWarehouseId, filters.warehouseId),
        eq(stockMoves.destinationWarehouseId, filters.warehouseId)
      )
    );
  }
  
  if (filters?.productId) {
    conditions.push(eq(stockMoves.productId, filters.productId));
  }
  
  if (filters?.moveType) {
    conditions.push(eq(stockMoves.moveType, filters.moveType as any));
  }
  
  if (filters?.startDate) {
    conditions.push(gte(stockMoves.moveDate, filters.startDate));
  }
  
  if (filters?.endDate) {
    conditions.push(lte(stockMoves.moveDate, filters.endDate));
  }
  
  let query = db
    .select({
      move: stockMoves,
      product: products,
      sourceWarehouse: warehouses,
    })
    .from(stockMoves)
    .leftJoin(products, eq(stockMoves.productId, products.id))
    .leftJoin(warehouses, eq(stockMoves.sourceWarehouseId, warehouses.id))
    .where(and(...conditions))
    .orderBy(desc(stockMoves.moveDate));
  
  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }
  
  const result = await query;
  return result || [];
}

// Create stock move
export async function createStockMove(data: Omit<StockMove, 'id' | 'createdAt' | 'updatedAt'>) {
  return await db.transaction(async (tx) => {
    // Create the stock move
    const [move] = await tx
      .insert(stockMoves)
      .values(data)
      .returning();
    
    // Update inventory levels based on move type
    if (data.moveType === 'receipt' || data.moveType === 'adjustment_in') {
      // Increase inventory at destination
      if (data.destinationWarehouseId) {
        const [existingLevel] = await tx
          .select()
          .from(inventoryLevels)
          .where(
            and(
              eq(inventoryLevels.warehouseId, data.destinationWarehouseId),
              eq(inventoryLevels.productId, data.productId)
            )
          );
        
        if (existingLevel) {
          await tx
            .update(inventoryLevels)
            .set({
              quantityOnHand: sql`${inventoryLevels.quantityOnHand} + ${data.quantity}`,
              quantityAvailable: sql`${inventoryLevels.quantityAvailable} + ${data.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(inventoryLevels.id, existingLevel.id));
        }
      }
    } else if (data.moveType === 'shipment' || data.moveType === 'adjustment_out') {
      // Decrease inventory at source
      if (data.sourceWarehouseId) {
        const [existingLevel] = await tx
          .select()
          .from(inventoryLevels)
          .where(
            and(
              eq(inventoryLevels.warehouseId, data.sourceWarehouseId),
              eq(inventoryLevels.productId, data.productId)
            )
          );
        
        if (existingLevel) {
          await tx
            .update(inventoryLevels)
            .set({
              quantityOnHand: sql`${inventoryLevels.quantityOnHand} - ${data.quantity}`,
              quantityAvailable: sql`${inventoryLevels.quantityAvailable} - ${data.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(inventoryLevels.id, existingLevel.id));
        }
      }
    } else if (data.moveType === 'transfer') {
      // Decrease at source, increase at destination
      if (data.sourceWarehouseId) {
        const [sourceLevel] = await tx
          .select()
          .from(inventoryLevels)
          .where(
            and(
              eq(inventoryLevels.warehouseId, data.sourceWarehouseId),
              eq(inventoryLevels.productId, data.productId)
            )
          );
        
        if (sourceLevel) {
          await tx
            .update(inventoryLevels)
            .set({
              quantityOnHand: sql`${inventoryLevels.quantityOnHand} - ${data.quantity}`,
              quantityAvailable: sql`${inventoryLevels.quantityAvailable} - ${data.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(inventoryLevels.id, sourceLevel.id));
        }
      }
      
      if (data.destinationWarehouseId) {
        const [destLevel] = await tx
          .select()
          .from(inventoryLevels)
          .where(
            and(
              eq(inventoryLevels.warehouseId, data.destinationWarehouseId),
              eq(inventoryLevels.productId, data.productId)
            )
          );
        
        if (destLevel) {
          await tx
            .update(inventoryLevels)
            .set({
              quantityOnHand: sql`${inventoryLevels.quantityOnHand} + ${data.quantity}`,
              quantityAvailable: sql`${inventoryLevels.quantityAvailable} + ${data.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(inventoryLevels.id, destLevel.id));
        }
      }
    }
    
    return move;
  });
}

// Get inventory summary
export async function getInventorySummary(organizationId: string) {
  const result = await db
    .select({
      totalItems: sql<number>`COUNT(DISTINCT ${inventoryLevels.productId})`,
      totalQuantity: sql<number>`COALESCE(SUM(${inventoryLevels.quantityOnHand}), 0)`,
      totalValue: sql<number>`COALESCE(SUM(${inventoryLevels.quantityOnHand} * ${inventoryLevels.averageCost}), 0)`,
      lowStockItems: sql<number>`COUNT(CASE WHEN ${inventoryLevels.quantityOnHand} <= ${inventoryLevels.reorderPoint} THEN 1 END)`,
      outOfStockItems: sql<number>`COUNT(CASE WHEN ${inventoryLevels.quantityOnHand} = 0 THEN 1 END)`,
    })
    .from(inventoryLevels)
    .where(eq(inventoryLevels.organizationId, organizationId));
  
  const warehouseCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(warehouses)
    .where(
      and(
        eq(warehouses.organizationId, organizationId),
        eq(warehouses.isActive, true)
      )
    );
  
  return {
    ...(result[0] || {
      totalItems: 0,
      totalQuantity: 0,
      totalValue: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
    }),
    warehouseCount: warehouseCount[0]?.count || 0,
  };
}