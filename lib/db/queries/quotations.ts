import { db } from '@/lib/db';
import {
  salesQuotations,
  quotationLines,
  contacts,
  products,
  taxCodes,
  type SalesQuotation,
  type QuotationLine,
} from '@/lib/db/schema/index';
import { generateDocumentNumber } from '@/lib/db/document-numbering';
import { eq, desc, and, gte, lte, sql, or, like, asc } from 'drizzle-orm';

// Get all quotations with filters
export async function getQuotations(
  organizationId: string,
  filters?: {
    customerId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    validityDateFrom?: string;
    validityDateTo?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }
) {
  const conditions: any[] = [eq(salesQuotations.organizationId, organizationId)];
  
  if (filters?.customerId) {
    conditions.push(eq(salesQuotations.customerId, filters.customerId));
  }
  
  if (filters?.status) {
    conditions.push(eq(salesQuotations.status, filters.status as any));
  }
  
  if (filters?.dateFrom) {
    conditions.push(gte(salesQuotations.quotationDate, filters.dateFrom));
  }
  
  if (filters?.dateTo) {
    conditions.push(lte(salesQuotations.quotationDate, filters.dateTo));
  }
  
  if (filters?.validityDateFrom) {
    conditions.push(gte(salesQuotations.validUntil, filters.validityDateFrom));
  }
  
  if (filters?.validityDateTo) {
    conditions.push(lte(salesQuotations.validUntil, filters.validityDateTo));
  }
  
  if (filters?.search) {
    conditions.push(
      or(
        like(salesQuotations.quotationNumber, `%${filters.search}%`),
        like(salesQuotations.notes, `%${filters.search}%`),
        like(salesQuotations.referenceNumber, `%${filters.search}%`),
        like(salesQuotations.customerPo, `%${filters.search}%`)
      )
    );
  }
  
  let query = db
    .select({
      quotation: salesQuotations,
      customer: {
        id: contacts.id,
        displayName: contacts.displayName,
        companyName: contacts.companyName,
        email: contacts.email,
      },
    })
    .from(salesQuotations)
    .leftJoin(contacts, eq(salesQuotations.customerId, contacts.id))
    .where(and(...conditions))
    .orderBy(desc(salesQuotations.quotationDate), desc(salesQuotations.createdAt));
  
  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }
  
  const result = await query;
  return result || [];
}

// Get quotation by ID
export async function getQuotationById(quotationId: string, organizationId: string) {
  const [quotation] = await db
    .select({
      quotation: salesQuotations,
      customer: {
        id: contacts.id,
        displayName: contacts.displayName,
        companyName: contacts.companyName,
        email: contacts.email,
        phone: contacts.phone,
        billingAddress: contacts.billingAddress,
        shippingAddress: contacts.shippingAddress,
      },
    })
    .from(salesQuotations)
    .leftJoin(contacts, eq(salesQuotations.customerId, contacts.id))
    .where(
      and(
        eq(salesQuotations.id, quotationId),
        eq(salesQuotations.organizationId, organizationId)
      )
    );
  
  return quotation || null;
}

// Create quotation (backward compatible - requires quotationNumber)
export async function createQuotation(data: Omit<SalesQuotation, 'id' | 'createdAt' | 'updatedAt'>) {
  const [quotation] = await db
    .insert(salesQuotations)
    .values(data)
    .returning();
  return quotation;
}

// Create quotation with auto-numbering (use this for new integrations)
export async function createQuotationWithAutoNumber(
  data: Omit<SalesQuotation, 'id' | 'createdAt' | 'updatedAt' | 'quotationNumber'> & { 
    quotationNumber?: string,
    userId?: string  // For audit tracking
  }
) {
  try {
    // Auto-generate quotation number if not provided
    let quotationNumber = data.quotationNumber;
    if (!quotationNumber) {
      quotationNumber = await generateDocumentNumber(
        data.organizationId, 
        'quotation',
        data.userId
      );
    }

    const [quotation] = await db
      .insert(salesQuotations)
      .values({
        ...data,
        quotationNumber,
      })
      .returning();
    return quotation;
  } catch (error) {
    // Handle unique constraint violations gracefully
    if (error instanceof Error && error.message.includes('unique constraint')) {
      throw new Error(`Quotation number already exists. Please try again or provide a manual number.`);
    }
    throw error;
  }
}

// Update quotation
export async function updateQuotation(
  quotationId: string,
  organizationId: string,
  data: Partial<Omit<SalesQuotation, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>>
) {
  const [quotation] = await db
    .update(salesQuotations)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(salesQuotations.id, quotationId),
        eq(salesQuotations.organizationId, organizationId)
      )
    )
    .returning();
  return quotation;
}

// Delete quotation
export async function deleteQuotation(quotationId: string, organizationId: string) {
  // Delete quotation lines first (foreign key constraint)
  await db
    .delete(quotationLines)
    .where(eq(quotationLines.quotationId, quotationId));

  await db
    .delete(salesQuotations)
    .where(
      and(
        eq(salesQuotations.id, quotationId),
        eq(salesQuotations.organizationId, organizationId)
      )
    );
}

// Get quotation lines for a quotation
export async function getQuotationLines(quotationId: string) {
  const lines = await db
    .select({
      line: quotationLines,
      product: {
        id: products.id,
        name: products.name,
        sku: products.sku,
      },
      taxCode: {
        id: taxCodes.id,
        code: taxCodes.code,
        rate: taxCodes.rate,
      },
    })
    .from(quotationLines)
    .leftJoin(products, eq(quotationLines.productId, products.id))
    .leftJoin(taxCodes, eq(quotationLines.taxCodeId, taxCodes.id))
    .where(eq(quotationLines.quotationId, quotationId))
    .orderBy(asc(quotationLines.lineNumber));
  
  return lines || [];
}

// Create quotation line
export async function createQuotationLine(data: Omit<QuotationLine, 'id' | 'createdAt'>) {
  const [line] = await db
    .insert(quotationLines)
    .values(data)
    .returning();
  return line;
}

// Update quotation line
export async function updateQuotationLine(
  lineId: string,
  data: Partial<Omit<QuotationLine, 'id' | 'quotationId' | 'createdAt'>>
) {
  const [line] = await db
    .update(quotationLines)
    .set(data)
    .where(eq(quotationLines.id, lineId))
    .returning();
  return line;
}

// Delete quotation line
export async function deleteQuotationLine(lineId: string) {
  await db
    .delete(quotationLines)
    .where(eq(quotationLines.id, lineId));
}

// Convert quotation to sales order
export async function convertQuotationToOrder(quotationId: string, organizationId: string, orderData: any) {
  // This would create a sales order from the quotation
  // Implementation depends on the sales order creation logic
  // For now, just mark the quotation as converted
  const [quotation] = await db
    .update(salesQuotations)
    .set({
      status: 'converted',
      convertedAt: new Date(),
      convertedToOrderId: orderData.orderId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(salesQuotations.id, quotationId),
        eq(salesQuotations.organizationId, organizationId)
      )
    )
    .returning();
  
  return quotation;
}

// Mark quotation as sent
export async function markQuotationAsSent(quotationId: string, organizationId: string) {
  const [quotation] = await db
    .update(salesQuotations)
    .set({
      status: 'sent',
      sentAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(salesQuotations.id, quotationId),
        eq(salesQuotations.organizationId, organizationId)
      )
    )
    .returning();
  
  return quotation;
}

// Mark quotation as viewed
export async function markQuotationAsViewed(quotationId: string, organizationId: string) {
  const [quotation] = await db
    .update(salesQuotations)
    .set({
      status: 'viewed',
      viewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(salesQuotations.id, quotationId),
        eq(salesQuotations.organizationId, organizationId)
      )
    )
    .returning();
  
  return quotation;
}

// Accept quotation
export async function acceptQuotation(quotationId: string, organizationId: string) {
  const [quotation] = await db
    .update(salesQuotations)
    .set({
      status: 'accepted',
      acceptedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(salesQuotations.id, quotationId),
        eq(salesQuotations.organizationId, organizationId)
      )
    )
    .returning();
  
  return quotation;
}

// Reject quotation
export async function rejectQuotation(quotationId: string, organizationId: string) {
  const [quotation] = await db
    .update(salesQuotations)
    .set({
      status: 'rejected',
      rejectedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(salesQuotations.id, quotationId),
        eq(salesQuotations.organizationId, organizationId)
      )
    )
    .returning();
  
  return quotation;
}

// Get quotations summary
export async function getQuotationsSummary(organizationId: string) {
  const result = await db
    .select({
      totalQuotations: sql<number>`COUNT(*)`,
      draftQuotations: sql<number>`COUNT(CASE WHEN status = 'draft' THEN 1 END)`,
      sentQuotations: sql<number>`COUNT(CASE WHEN status = 'sent' THEN 1 END)`,
      acceptedQuotations: sql<number>`COUNT(CASE WHEN status = 'accepted' THEN 1 END)`,
      rejectedQuotations: sql<number>`COUNT(CASE WHEN status = 'rejected' THEN 1 END)`,
      convertedQuotations: sql<number>`COUNT(CASE WHEN status = 'converted' THEN 1 END)`,
      totalValue: sql<number>`COALESCE(SUM(${salesQuotations.total}), 0)`,
      potentialValue: sql<number>`COALESCE(SUM(CASE WHEN status IN ('sent', 'viewed') THEN ${salesQuotations.total} ELSE 0 END), 0)`,
    })
    .from(salesQuotations)
    .where(eq(salesQuotations.organizationId, organizationId));
  
  return result[0] || {
    totalQuotations: 0,
    draftQuotations: 0,
    sentQuotations: 0,
    acceptedQuotations: 0,
    rejectedQuotations: 0,
    convertedQuotations: 0,
    totalValue: 0,
    potentialValue: 0,
  };
}