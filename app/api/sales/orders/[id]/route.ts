import { NextRequest } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { 
  getSalesOrderById,
  updateSalesOrder,
  deleteSalesOrder 
} from '@/lib/db/queries/sales-orders';
import { z } from 'zod';

// Schema for sales order update
const updateSalesOrderSchema = z.object({
  customerId: z.string().uuid().optional(),
  orderNumber: z.string().optional(),
  orderDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  expectedShipDate: z.string().datetime().optional(),
  status: z.enum(['draft', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'completed']).optional(),
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
  purchaseOrderNumber: z.string().optional(),
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
    
    const order = await getSalesOrderById(id, organizationId);
    
    if (!order) {
      return ApiResponse.error('Sales order not found', 404);
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
    const validatedData = updateSalesOrderSchema.parse(body);
    
    const order = await updateSalesOrder(id, organizationId, validatedData);
    
    if (!order) {
      return ApiResponse.error('Sales order not found', 404);
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
    
    // First check if the sales order exists
    const existing = await getSalesOrderById(id, organizationId);
    
    if (!existing) {
      return ApiResponse.error('Sales order not found', 404);
    }
    
    await deleteSalesOrder(id, organizationId);
    
    return ApiResponse.success({ message: 'Sales order deleted successfully' });
  });
});