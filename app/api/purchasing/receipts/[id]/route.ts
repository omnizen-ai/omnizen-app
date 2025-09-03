import { NextRequest } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { 
  getPurchaseReceiptById,
  updatePurchaseReceipt,
  deletePurchaseReceipt 
} from '@/lib/db/queries/purchase-receipts';
import { z } from 'zod';

// Schema for purchase receipt update
const updatePurchaseReceiptSchema = z.object({
  purchaseOrderId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  receiptNumber: z.string().optional(),
  receiptDate: z.string().datetime().optional(),
  status: z.enum(['pending', 'partial', 'completed', 'cancelled']).optional(),
  totalQuantity: z.string().optional(),
  totalAmount: z.string().optional(),
  notes: z.string().optional(),
  referenceNumber: z.string().optional(),
  receivedBy: z.string().uuid().optional(),
  inspectedBy: z.string().uuid().optional(),
  inspectionNotes: z.string().optional(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    const { id } = await params;
    
    const receipt = await getPurchaseReceiptById(id, organizationId);
    
    if (!receipt) {
      return ApiResponse.error('Purchase receipt not found', 404);
    }
    
    return ApiResponse.success(receipt);
  });
});

export const PUT = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    const { id } = await params;
    
    const body = await request.json();
    const validatedData = updatePurchaseReceiptSchema.parse(body);
    
    const receipt = await updatePurchaseReceipt(id, organizationId, {
      ...validatedData,
      receiptDate: validatedData.receiptDate ? new Date(validatedData.receiptDate) : undefined,
    } as any);
    
    if (!receipt) {
      return ApiResponse.error('Purchase receipt not found', 404);
    }
    
    return ApiResponse.success(receipt);
  });
});

export const DELETE = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    const { id } = await params;
    
    // First check if the purchase receipt exists
    const existing = await getPurchaseReceiptById(id, organizationId);
    
    if (!existing) {
      return ApiResponse.error('Purchase receipt not found', 404);
    }
    
    await deletePurchaseReceipt(id, organizationId);
    
    return ApiResponse.success({ message: 'Purchase receipt deleted successfully' });
  });
});