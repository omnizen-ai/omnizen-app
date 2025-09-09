import { NextRequest } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { 
  getPurchaseOrders, 
  createPurchaseOrder,
  getPurchaseOrderSummary
} from '@/lib/db/queries/purchase-orders';
import { z } from 'zod';

// Schema for purchase order creation
const createPurchaseOrderSchema = z.object({
  vendorId: z.string().uuid(),
  orderNumber: z.string().optional(),
  orderDate: z.string().datetime(),
  dueDate: z.string().datetime().optional(),
  expectedDeliveryDate: z.string().datetime().optional(),
  status: z.enum(['draft', 'pending', 'confirmed', 'shipped', 'received', 'cancelled', 'completed']).default('draft'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  paymentTerms: z.string().optional(),
  paymentDueDate: z.string().datetime().optional(),
  shippingMethod: z.string().optional(),
  shippingCost: z.string().default('0'),
  taxAmount: z.string().default('0'),
  discountAmount: z.string().default('0'),
  discountPercent: z.string().default('0'),
  subtotal: z.string().default('0'),
  total: z.string().default('0'),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  terms: z.string().optional(),
  referenceNumber: z.string().optional(),
  vendorOrderNumber: z.string().optional(),
  tags: z.array(z.string()).default([]),
  customFields: z.record(z.any()).default({}),
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
    const status = searchParams.get('status') || undefined;
    const vendorId = searchParams.get('vendorId') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const search = searchParams.get('search') || undefined;
    const summary = searchParams.get('summary');

    // If summary is requested, return purchase order summary
    if (summary === 'true') {
      const summaryData = await getPurchaseOrderSummary(organizationId);
      return ApiResponse.success(summaryData);
    }

    const result = await getPurchaseOrders(organizationId, {
      status,
      vendorId,
      dateFrom,
      dateTo,
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
    const { lines, ...orderData } = body;
    const validatedData = createPurchaseOrderSchema.parse(orderData);
    
    const order = await createPurchaseOrder({
      ...validatedData,
      organizationId,
      workspaceId,
    } as any);

    // TODO: Handle order lines creation when purchaseOrderLines query functions are added
    
    return ApiResponse.success(order, 201);
  });
});

