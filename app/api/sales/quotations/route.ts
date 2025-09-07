import { NextRequest } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { 
  getQuotations, 
  createQuotationWithAutoNumber,
  getQuotationsSummary
} from '@/lib/db/queries/quotations';
import { z } from 'zod';

// Schema for quotation creation
const createQuotationSchema = z.object({
  customerId: z.string().uuid(),
  quotationNumber: z.string().optional(),
  quotationDate: z.string().date(),
  validUntil: z.string().date(),
  status: z.enum(['draft', 'pending', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'converted', 'cancelled']).default('draft'),
  subtotal: z.string().default('0'),
  taxAmount: z.string().default('0'),
  discountAmount: z.string().default('0'),
  discountPercent: z.string().default('0'),
  total: z.string().default('0'),
  paymentTerms: z.string().optional(),
  deliveryTerms: z.string().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  billingAddress: z.object({
    street1: z.string().default(''),
    street2: z.string().default(''),
    city: z.string().default(''),
    state: z.string().default(''),
    postalCode: z.string().default(''),
    country: z.string().default(''),
  }).default({
    street1: '',
    street2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  }),
  shippingAddress: z.object({
    street1: z.string().default(''),
    street2: z.string().default(''),
    city: z.string().default(''),
    state: z.string().default(''),
    postalCode: z.string().default(''),
    country: z.string().default(''),
  }).default({
    street1: '',
    street2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  }),
  referenceNumber: z.string().optional(),
  customerPo: z.string().optional(),
  tags: z.array(z.string()).default([]),
  customFields: z.record(z.any()).default({}),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId') || undefined;
    const status = searchParams.get('status') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const validityDateFrom = searchParams.get('validityDateFrom') || undefined;
    const validityDateTo = searchParams.get('validityDateTo') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const summary = searchParams.get('summary');

    // If summary is requested, return quotations summary
    if (summary === 'true') {
      const summaryData = await getQuotationsSummary(organizationId);
      return ApiResponse.success(summaryData);
    }

    const result = await getQuotations(organizationId, {
      customerId,
      status,
      dateFrom,
      dateTo,
      validityDateFrom,
      validityDateTo,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return ApiResponse.success(result);
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    const workspaceId = session.user?.workspaceId || null;
    const userId = session.user?.id || null;
    
    const body = await request.json();
    const validatedData = createQuotationSchema.parse(body);
    
    const quotation = await createQuotationWithAutoNumber({
      ...validatedData,
      organizationId,
      workspaceId,
      createdBy: userId,
      quotationDate: validatedData.quotationDate,
      validUntil: validatedData.validUntil,
      userId, // For audit tracking
    } as any);
    
    return ApiResponse.success(quotation, 201);
  });
});