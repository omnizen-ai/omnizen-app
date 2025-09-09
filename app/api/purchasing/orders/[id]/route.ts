import { NextRequest } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { 
  getPurchaseOrderById,
  updatePurchaseOrder,
  deletePurchaseOrder 
} from '@/lib/db/queries/purchase-orders';
import { z } from 'zod';

// Schema for purchase order update
const updatePurchaseOrderSchema = z.object({
  vendorId: z.string().uuid().optional(),
  orderNumber: z.string().optional(),
  orderDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  expectedDeliveryDate: z.string().datetime().optional(),
  status: z.enum(['draft', 'pending', 'confirmed', 'shipped', 'received', 'cancelled', 'completed']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  paymentTerms: z.string().optional(),
  paymentDueDate: z.string().datetime().optional(),
  shippingMethod: z.string().optional(),
  shippingCost: z.string().optional(),
  taxAmount: z.string().optional(),
  discountAmount: z.string().optional(),
  discountPercent: z.string().optional(),
  subtotal: z.string().optional(),
  total: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  terms: z.string().optional(),
  referenceNumber: z.string().optional(),
  vendorOrderNumber: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
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
    const organizationId = session.user?.organizationId;
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID not found in session');
    }
    const { id } = await params;
    
    const order = await getPurchaseOrderById(id, organizationId);
    
    if (!order) {
      return ApiResponse.error('Purchase order not found', 404);
    }
    
    return ApiResponse.success(order);
  });
});

export const PUT = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId;
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID not found in session');
    }
    const { id } = await params;
    
    const body = await request.json();
    const validatedData = updatePurchaseOrderSchema.parse(body);
    
    const order = await updatePurchaseOrder(id, organizationId, validatedData);
    
    if (!order) {
      return ApiResponse.error('Purchase order not found', 404);
    }
    
    return ApiResponse.success(order);
  });
});

export const DELETE = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId;
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID not found in session');
    }
    const { id } = await params;
    
    // First check if the purchase order exists
    const existing = await getPurchaseOrderById(id, organizationId);
    
    if (!existing) {
      return ApiResponse.error('Purchase order not found', 404);
    }
    
    await deletePurchaseOrder(id, organizationId);
    
    return ApiResponse.success({ message: 'Purchase order deleted successfully' });
  });
});