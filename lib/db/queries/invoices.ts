import { db } from '@/lib/db';
import { 
  invoices, 
  invoiceLines,
  paymentAllocations,
  contacts,
  type Invoice,
  type InvoiceLine,
  type Contact
} from '@/lib/db/schema/index';
import { eq, desc, and, gte, lte, sql, or, like } from 'drizzle-orm';

// Get all invoices with customer information
export async function getInvoices(
  organizationId: string,
  filters?: {
    status?: string;
    customerId?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    limit?: number;
    offset?: number;
  }
) {
  let query = db
    .select({
      invoice: invoices,
      customer: contacts,
    })
    .from(invoices)
    .leftJoin(contacts, eq(invoices.customerId, contacts.id))
    .where(eq(invoices.organizationId, organizationId))
    .orderBy(desc(invoices.issueDate));

  // Apply filters
  const conditions: any[] = [eq(invoices.organizationId, organizationId)];
  
  if (filters?.status) {
    conditions.push(eq(invoices.status, filters.status as any));
  }
  
  if (filters?.customerId) {
    conditions.push(eq(invoices.customerId, filters.customerId));
  }
  
  if (filters?.startDate) {
    conditions.push(gte(invoices.issueDate, filters.startDate));
  }
  
  if (filters?.endDate) {
    conditions.push(lte(invoices.issueDate, filters.endDate));
  }
  
  if (filters?.search) {
    conditions.push(
      or(
        like(invoices.invoiceNumber, `%${filters.search}%`),
        like(invoices.poNumber, `%${filters.search}%`)
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

export async function getInvoiceById(id: string, organizationId: string) {
  const [invoice] = await db
    .select({
      invoice: invoices,
      customer: contacts,
    })
    .from(invoices)
    .leftJoin(contacts, eq(invoices.customerId, contacts.id))
    .where(
      and(
        eq(invoices.id, id),
        eq(invoices.organizationId, organizationId)
      )
    );
  
  if (!invoice) return null;
  
  // Get invoice lines
  const lines = await db
    .select()
    .from(invoiceLines)
    .where(eq(invoiceLines.invoiceId, id));
  
  return {
    ...invoice.invoice,
    customer: invoice.customer,
    lines
  };
}

export async function createInvoice(data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) {
  const [invoice] = await db
    .insert(invoices)
    .values({
      ...data,
      balanceDue: data.totalAmount,
      paidAmount: '0',
    })
    .returning();
  return invoice;
}

export async function updateInvoice(
  id: string, 
  organizationId: string,
  data: Partial<Omit<Invoice, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>>
) {
  const [invoice] = await db
    .update(invoices)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(invoices.id, id),
        eq(invoices.organizationId, organizationId)
      )
    )
    .returning();
  return invoice;
}

export async function deleteInvoice(id: string, organizationId: string) {
  await db
    .delete(invoices)
    .where(
      and(
        eq(invoices.id, id),
        eq(invoices.organizationId, organizationId)
      )
    );
}

// Get invoice summary statistics
export async function getInvoiceStats(organizationId: string) {
  const result = await db
    .select({
      totalOutstanding: sql<number>`
        COALESCE(SUM(CASE WHEN status IN ('sent', 'viewed', 'partially_paid') THEN ${invoices.balanceDue} ELSE 0 END), 0)
      `,
      totalOverdue: sql<number>`
        COALESCE(SUM(CASE WHEN status IN ('sent', 'viewed', 'partially_paid') AND ${invoices.dueDate} < NOW() THEN ${invoices.balanceDue} ELSE 0 END), 0)
      `,
      totalDraft: sql<number>`
        COALESCE(SUM(CASE WHEN status = 'draft' THEN ${invoices.totalAmount} ELSE 0 END), 0)
      `,
      count: sql<number>`COUNT(*)`,
    })
    .from(invoices)
    .where(eq(invoices.organizationId, organizationId));
  
  return result[0] || {
    totalOutstanding: 0,
    totalOverdue: 0,
    totalDraft: 0,
    count: 0
  };
}

// Record payment for an invoice
export async function recordInvoicePayment(
  invoiceId: string,
  organizationId: string,
  amount: string,
  paymentDate: Date,
  paymentMethod?: string,
  reference?: string
) {
  return await db.transaction(async (tx) => {
    // Get current invoice
    const [invoice] = await tx
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.id, invoiceId),
          eq(invoices.organizationId, organizationId)
        )
      );
    
    if (!invoice) throw new Error('Invoice not found');
    
    const paidAmount = parseFloat(invoice.paidAmount || '0') + parseFloat(amount);
    const balanceDue = parseFloat(invoice.totalAmount) - paidAmount;
    
    // Update invoice
    const [updatedInvoice] = await tx
      .update(invoices)
      .set({
        paidAmount: paidAmount.toFixed(2),
        balanceDue: balanceDue.toFixed(2),
        status: balanceDue <= 0 ? 'paid' : 'partially_paid',
        paidAt: balanceDue <= 0 ? new Date() : invoice.paidAt,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId))
      .returning();
    
    return updatedInvoice;
  });
}

// Mark invoice as sent
export async function markInvoiceAsSent(id: string, organizationId: string) {
  const [invoice] = await db
    .update(invoices)
    .set({
      status: 'sent',
      sentAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(invoices.id, id),
        eq(invoices.organizationId, organizationId),
        eq(invoices.status, 'draft')
      )
    )
    .returning();
  return invoice;
}