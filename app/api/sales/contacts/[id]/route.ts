import { NextRequest } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { 
  getContactById,
  updateContact,
  deleteContact 
} from '@/lib/db/queries/sales';
import { z } from 'zod';

// Schema for contact update
const updateContactSchema = z.object({
  displayName: z.string().min(1).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  website: z.string().optional(),
  fax: z.string().optional(),
  type: z.enum(['customer', 'vendor', 'both']).optional(),
  customerType: z.enum(['individual', 'business']).optional(),
  isActive: z.boolean().optional(),
  taxId: z.string().optional(),
  taxExempt: z.boolean().optional(),
  creditLimit: z.string().optional(),
  paymentTerms: z.string().optional(),
  priceLevel: z.string().optional(),
  defaultDiscountPercent: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
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
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    const { id } = await params;
    
    const contact = await getContactById(id, organizationId);
    
    if (!contact) {
      return ApiResponse.error('Contact not found', 404);
    }
    
    return ApiResponse.success(contact);
  });
});

export const PUT = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    const { id } = await params;
    
    const body = await request.json();
    const validatedData = updateContactSchema.parse(body);
    
    const contact = await updateContact(id, organizationId, validatedData);
    
    if (!contact) {
      return ApiResponse.error('Contact not found', 404);
    }
    
    return ApiResponse.success(contact);
  });
});

export const DELETE = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    const { id } = await params;
    
    // First check if the contact exists
    const existing = await getContactById(id, organizationId);
    
    if (!existing) {
      return ApiResponse.error('Contact not found', 404);
    }
    
    await deleteContact(id, organizationId);
    
    return ApiResponse.success({ message: 'Contact deleted successfully' });
  });
});