import { NextRequest } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { 
  getContacts, 
  createContact, 
  getSalesSummary 
} from '@/lib/db/queries/sales';
import { z } from 'zod';

// Schema for contact creation
const createContactSchema = z.object({
  displayName: z.string().min(1),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  website: z.string().optional(),
  fax: z.string().optional(),
  type: z.enum(['customer', 'vendor', 'both']).default('customer'),
  customerType: z.enum(['individual', 'business']).default('individual'),
  isActive: z.boolean().default(true),
  taxId: z.string().optional(),
  taxExempt: z.boolean().default(false),
  creditLimit: z.string().default('0'),
  paymentTerms: z.string().optional(),
  priceLevel: z.string().optional(),
  defaultDiscountPercent: z.string().default('0'),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
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
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const type = searchParams.get('type') || undefined;
    const status = searchParams.get('status');
    const summary = searchParams.get('summary');

    // If summary is requested, return sales summary
    if (summary === 'true') {
      const summaryData = await getSalesSummary(organizationId);
      return ApiResponse.success(summaryData);
    }

    const result = await getContacts(organizationId, {
      type,
      isActive: status === 'active' ? true : status === 'inactive' ? false : undefined,
      search,
    });

    return ApiResponse.success(result);
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    const workspaceId = session.user?.workspaceId || null;
    
    const body = await request.json();
    const validatedData = createContactSchema.parse(body);
    
    const contact = await createContact({
      ...validatedData,
      organizationId,
      workspaceId,
    } as any);
    
    return ApiResponse.success(contact, 201);
  });
});

