import { db } from '@/lib/db';
import { 
  bills, 
  billLines,
  paymentAllocations,
  contacts,
  type Bill,
  type BillLine,
  type Contact
} from '@/lib/db/schema/index';
import { eq, desc, and, gte, lte, sql, or, like } from 'drizzle-orm';

// Get all bills with vendor information
export async function getBills(
  organizationId: string,
  filters?: {
    status?: string;
    vendorId?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    limit?: number;
    offset?: number;
  }
) {
  let query = db
    .select({
      bill: bills,
      vendor: contacts,
    })
    .from(bills)
    .leftJoin(contacts, eq(bills.vendorId, contacts.id))
    .where(eq(bills.organizationId, organizationId))
    .orderBy(desc(bills.billDate));

  // Apply filters
  const conditions: any[] = [eq(bills.organizationId, organizationId)];
  
  if (filters?.status) {
    conditions.push(eq(bills.status, filters.status as any));
  }
  
  if (filters?.vendorId) {
    conditions.push(eq(bills.vendorId, filters.vendorId));
  }
  
  if (filters?.startDate) {
    conditions.push(gte(bills.billDate, filters.startDate));
  }
  
  if (filters?.endDate) {
    conditions.push(lte(bills.billDate, filters.endDate));
  }
  
  if (filters?.search) {
    conditions.push(
      or(
        like(bills.billNumber, `%${filters.search}%`),
        like(bills.vendorInvoiceNumber, `%${filters.search}%`)
      )
    );
  }
  
  if (conditions.length > 1) {
    query = query.where(and(...conditions)) as any;
  }
  
  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }
  
  const result = await query;
  return result || [];
}

export async function getBillById(id: string, organizationId: string) {
  const [bill] = await db
    .select({
      bill: bills,
      vendor: contacts,
    })
    .from(bills)
    .leftJoin(contacts, eq(bills.vendorId, contacts.id))
    .where(
      and(
        eq(bills.id, id),
        eq(bills.organizationId, organizationId)
      )
    );
  
  if (!bill) return null;
  
  // Get bill lines
  const lines = await db
    .select()
    .from(billLines)
    .where(eq(billLines.billId, id));
  
  return {
    ...bill.bill,
    vendor: bill.vendor,
    lines
  };
}

export async function createBill(data: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) {
  const [bill] = await db
    .insert(bills)
    .values({
      ...data,
      balanceDue: data.totalAmount,
      paidAmount: '0',
    })
    .returning();
  return bill;
}

export async function updateBill(
  id: string, 
  organizationId: string,
  data: Partial<Omit<Bill, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>>
) {
  const [bill] = await db
    .update(bills)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(bills.id, id),
        eq(bills.organizationId, organizationId)
      )
    )
    .returning();
  return bill;
}

export async function deleteBill(id: string, organizationId: string) {
  await db
    .delete(bills)
    .where(
      and(
        eq(bills.id, id),
        eq(bills.organizationId, organizationId)
      )
    );
}

// Get bill summary statistics
export async function getBillStats(organizationId: string) {
  const result = await db
    .select({
      totalOutstanding: sql<number>`
        COALESCE(SUM(CASE WHEN status IN ('approved', 'partially_paid') THEN ${bills.balanceDue} ELSE 0 END), 0)
      `,
      totalOverdue: sql<number>`
        COALESCE(SUM(CASE WHEN status IN ('approved', 'partially_paid') AND ${bills.dueDate} < NOW() THEN ${bills.balanceDue} ELSE 0 END), 0)
      `,
      totalDraft: sql<number>`
        COALESCE(SUM(CASE WHEN status = 'draft' THEN ${bills.totalAmount} ELSE 0 END), 0)
      `,
      count: sql<number>`COUNT(*)`,
    })
    .from(bills)
    .where(eq(bills.organizationId, organizationId));
  
  return result[0] || {
    totalOutstanding: 0,
    totalOverdue: 0,
    totalDraft: 0,
    count: 0
  };
}

// Record payment for a bill
export async function recordBillPayment(
  billId: string,
  organizationId: string,
  amount: string,
  paymentDate: Date,
  paymentMethod?: string,
  reference?: string
) {
  return await db.transaction(async (tx) => {
    // Get current bill
    const [bill] = await tx
      .select()
      .from(bills)
      .where(
        and(
          eq(bills.id, billId),
          eq(bills.organizationId, organizationId)
        )
      );
    
    if (!bill) throw new Error('Bill not found');
    
    const paidAmount = parseFloat(bill.paidAmount || '0') + parseFloat(amount);
    const balanceDue = parseFloat(bill.totalAmount) - paidAmount;
    
    // Update bill
    const [updatedBill] = await tx
      .update(bills)
      .set({
        paidAmount: paidAmount.toFixed(2),
        balanceDue: balanceDue.toFixed(2),
        status: balanceDue <= 0 ? 'paid' : 'partially_paid',
        updatedAt: new Date(),
      })
      .where(eq(bills.id, billId))
      .returning();
    
    return updatedBill;
  });
}