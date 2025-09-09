import { NextRequest } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { getContacts, createContact } from '@/lib/db/queries/sales';
import { z } from 'zod';

// Schema for vendor creation (vendors are contacts with type='vendor')
const createVendorSchema = z.object({
  displayName: z.string().min(1),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  website: z.string().optional(),
  fax: z.string().optional(),
  type: z.enum(['vendor', 'both']).default('vendor'),
  customerType: z.enum(['individual', 'business']).default('business'),
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
    const organizationId = session.user?.organizationId;
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID not found in session');
    }
    
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const summary = searchParams.get('summary');

    // If summary is requested, return vendor summary
    if (summary === 'true') {
      const vendors = await getContacts(organizationId, {
        type: 'vendor',
        isActive: undefined,
        search: undefined,
      });
      
      const summaryData = {
        totalVendors: vendors.length,
        activeVendors: vendors.filter(v => v.isActive).length,
        recentVendors: vendors.filter(v => {
          const createdAt = new Date(v.createdAt);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return createdAt >= thirtyDaysAgo;
        }).length,
        totalPurchases: 0, // TODO: Calculate from purchase orders
      };
      
      return ApiResponse.success(summaryData);
    }

    const result = await getContacts(organizationId, {
      type: 'vendor',
      isActive: status === 'active' ? true : status === 'inactive' ? false : undefined,
      search,
    });

    return ApiResponse.success(result);
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId;
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID not found in session');
    }
    const workspaceId = session.user?.workspaceId || null;
    
    const body = await request.json();
    const validatedData = createVendorSchema.parse(body);
    
    const vendor = await createContact({
      ...validatedData,
      organizationId,
      workspaceId,
    } as any);
    
    return ApiResponse.success(vendor, 201);
  });
});

