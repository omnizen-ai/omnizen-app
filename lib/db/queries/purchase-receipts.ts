import { db } from '@/lib/db';
import {
  purchaseReceipts,
  receiptLines,
  purchaseOrders,
  contacts,
  products,
  warehouses,
  type PurchaseReceipt,
  type ReceiptLine,
} from '@/lib/db/schema/index';
import { eq, desc, and, gte, lte, sql, or, like, asc } from 'drizzle-orm';

// Get all purchase receipts with filters
export async function getPurchaseReceipts(
  organizationId: string,
  filters?: {
    purchaseOrderId?: string;
    warehouseId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    limit?: number;
    offset?: number;
  }
) {
  const conditions: any[] = [eq(purchaseReceipts.organizationId, organizationId)];
  
  if (filters?.purchaseOrderId) {
    conditions.push(eq(purchaseReceipts.purchaseOrderId, filters.purchaseOrderId));
  }
  
  if (filters?.warehouseId) {
    conditions.push(eq(purchaseReceipts.warehouseId, filters.warehouseId));
  }
  
  if (filters?.status) {
    conditions.push(eq(purchaseReceipts.status, filters.status as any));
  }
  
  if (filters?.startDate) {
    conditions.push(gte(purchaseReceipts.receiptDate, filters.startDate));
  }
  
  if (filters?.endDate) {
    conditions.push(lte(purchaseReceipts.receiptDate, filters.endDate));
  }
  
  if (filters?.search) {
    conditions.push(
      or(
        like(purchaseReceipts.receiptNumber, `%${filters.search}%`),
        like(purchaseReceipts.notes, `%${filters.search}%`),
        like(purchaseReceipts.referenceNumber, `%${filters.search}%`)
      )
    );
  }
  
  let query = db
    .select({
      receipt: purchaseReceipts,
      purchaseOrder: purchaseOrders,
      vendor: {
        id: contacts.id,
        displayName: contacts.displayName,
        companyName: contacts.companyName,
      },
      warehouse: {
        id: warehouses.id,
        name: warehouses.name,
        code: warehouses.code,
      },
    })
    .from(purchaseReceipts)
    .leftJoin(purchaseOrders, eq(purchaseReceipts.purchaseOrderId, purchaseOrders.id))
    .leftJoin(contacts, eq(purchaseOrders.vendorId, contacts.id))
    .leftJoin(warehouses, eq(purchaseReceipts.warehouseId, warehouses.id))
    .where(and(...conditions))
    .orderBy(desc(purchaseReceipts.receiptDate), desc(purchaseReceipts.createdAt));
  
  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }
  
  const result = await query;
  return result || [];
}

// Get purchase receipt by ID
export async function getPurchaseReceiptById(receiptId: string, organizationId: string) {
  const [receipt] = await db
    .select({
      receipt: purchaseReceipts,
      purchaseOrder: purchaseOrders,
      vendor: {
        id: contacts.id,
        displayName: contacts.displayName,
        companyName: contacts.companyName,
      },
      warehouse: {
        id: warehouses.id,
        name: warehouses.name,
        code: warehouses.code,
      },
    })
    .from(purchaseReceipts)
    .leftJoin(purchaseOrders, eq(purchaseReceipts.purchaseOrderId, purchaseOrders.id))
    .leftJoin(contacts, eq(purchaseOrders.vendorId, contacts.id))
    .leftJoin(warehouses, eq(purchaseReceipts.warehouseId, warehouses.id))
    .where(
      and(
        eq(purchaseReceipts.id, receiptId),
        eq(purchaseReceipts.organizationId, organizationId)
      )
    );
  
  return receipt || null;
}

// Create purchase receipt
export async function createPurchaseReceipt(data: Omit<PurchaseReceipt, 'id' | 'createdAt' | 'updatedAt'>) {
  const [receipt] = await db
    .insert(purchaseReceipts)
    .values(data)
    .returning();
  return receipt;
}

// Update purchase receipt
export async function updatePurchaseReceipt(
  receiptId: string,
  organizationId: string,
  data: Partial<Omit<PurchaseReceipt, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>>
) {
  const [receipt] = await db
    .update(purchaseReceipts)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(purchaseReceipts.id, receiptId),
        eq(purchaseReceipts.organizationId, organizationId)
      )
    )
    .returning();
  return receipt;
}

// Delete purchase receipt
export async function deletePurchaseReceipt(receiptId: string, organizationId: string) {
  // Delete receipt lines first (foreign key constraint)
  await db
    .delete(receiptLines)
    .where(eq(receiptLines.receiptId, receiptId));

  await db
    .delete(purchaseReceipts)
    .where(
      and(
        eq(purchaseReceipts.id, receiptId),
        eq(purchaseReceipts.organizationId, organizationId)
      )
    );
}

// Get receipt lines for a receipt
export async function getReceiptLines(receiptId: string) {
  const lines = await db
    .select({
      line: receiptLines,
      product: {
        id: products.id,
        name: products.name,
        sku: products.sku,
      },
    })
    .from(receiptLines)
    .leftJoin(products, eq(receiptLines.productId, products.id))
    .where(eq(receiptLines.receiptId, receiptId))
    .orderBy(asc(receiptLines.lineNumber));
  
  return lines || [];
}

// Create receipt line
export async function createReceiptLine(data: Omit<ReceiptLine, 'id' | 'createdAt' | 'updatedAt'>) {
  const [line] = await db
    .insert(receiptLines)
    .values(data)
    .returning();
  return line;
}

// Update receipt line
export async function updateReceiptLine(
  lineId: string,
  data: Partial<Omit<ReceiptLine, 'id' | 'receiptId' | 'createdAt' | 'updatedAt'>>
) {
  const [line] = await db
    .update(receiptLines)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(receiptLines.id, lineId))
    .returning();
  return line;
}

// Delete receipt line
export async function deleteReceiptLine(lineId: string) {
  await db
    .delete(receiptLines)
    .where(eq(receiptLines.id, lineId));
}

// Get purchase receipts summary
export async function getPurchaseReceiptSummary(organizationId: string) {
  const result = await db
    .select({
      totalReceipts: sql<number>`COUNT(*)`,
      pendingReceipts: sql<number>`COUNT(CASE WHEN status = 'pending' THEN 1 END)`,
      receivedReceipts: sql<number>`COUNT(CASE WHEN status = 'received' THEN 1 END)`,
      acceptedReceipts: sql<number>`COUNT(CASE WHEN status = 'accepted' THEN 1 END)`,
    })
    .from(purchaseReceipts)
    .where(eq(purchaseReceipts.organizationId, organizationId));
  
  return result[0] || {
    totalReceipts: 0,
    pendingReceipts: 0,
    receivedReceipts: 0,
    acceptedReceipts: 0,
  };
}