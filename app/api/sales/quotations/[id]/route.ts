import { NextRequest } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { 
  getQuotationById,
  updateQuotation,
  deleteQuotation 
} from '@/lib/db/queries/quotations';
import { z } from 'zod';

// Schema for quotation update
const updateQuotationSchema = z.object({
  customerId: z.string().uuid().optional(),
  quotationNumber: z.string().optional(),
  quotationDate: z.string().date().optional(),
  validUntil: z.string().date().optional(),
  status: z.enum(['draft', 'pending', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'converted', 'cancelled']).optional(),
  subtotal: z.string().optional(),
  taxAmount: z.string().optional(),
  discountAmount: z.string().optional(),
  discountPercent: z.string().optional(),
  total: z.string().optional(),
  paymentTerms: z.string().optional(),
  deliveryTerms: z.string().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  billingAddress: z.object({
    street1: z.string().optional(),
    street2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  shippingAddress: z.object({
    street1: z.string().optional(),
    street2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  referenceNumber: z.string().optional(),
  customerPo: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    const { id } = await params;
    
    const quotation = await getQuotationById(id, organizationId);
    
    if (!quotation) {
      return ApiResponse.error('Quotation not found', 404);
    }
    
    return ApiResponse.success(quotation);
  });
});

export const PUT = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    const { id } = await params;
    
    const body = await request.json();
    const validatedData = updateQuotationSchema.parse(body);
    
    const quotation = await updateQuotation(id, organizationId, {
      ...validatedData,
      quotationDate: validatedData.quotationDate || undefined,
      validUntil: validatedData.validUntil || undefined,
    } as any);
    
    if (!quotation) {
      return ApiResponse.error('Quotation not found', 404);
    }
    
    return ApiResponse.success(quotation);
  });
});

export const DELETE = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    const { id } = await params;
    
    // First check if the quotation exists
    const existing = await getQuotationById(id, organizationId);
    
    if (!existing) {
      return ApiResponse.error('Quotation not found', 404);
    }
    
    await deleteQuotation(id, organizationId);
    
    return ApiResponse.success({ message: 'Quotation deleted successfully' });
  });
});