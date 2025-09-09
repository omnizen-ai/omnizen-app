import { NextRequest } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { 
  getPurchaseReceipts, 
  createPurchaseReceipt,
  getPurchaseReceiptSummary
} from '@/lib/db/queries/purchase-receipts';
import { z } from 'zod';

// Schema for purchase receipt creation
const createPurchaseReceiptSchema = z.object({
  purchaseOrderId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  receiptNumber: z.string().optional(),
  receiptDate: z.string().datetime(),
  status: z.enum(['pending', 'partial', 'completed', 'cancelled']).default('pending'),
  totalQuantity: z.string().default('0'),
  totalAmount: z.string().default('0'),
  notes: z.string().optional(),
  referenceNumber: z.string().optional(),
  receivedBy: z.string().uuid().optional(),
  inspectedBy: z.string().uuid().optional(),
  inspectionNotes: z.string().optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId;
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID not found in session');
    }
    
    const searchParams = request.nextUrl.searchParams;
    const purchaseOrderId = searchParams.get('purchaseOrderId') || undefined;
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const status = searchParams.get('status') || undefined;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const summary = searchParams.get('summary');

    // If summary is requested, return purchase receipt summary
    if (summary === 'true') {
      const summaryData = await getPurchaseReceiptSummary(organizationId);
      return ApiResponse.success(summaryData);
    }

    const result = await getPurchaseReceipts(organizationId, {
      purchaseOrderId,
      warehouseId,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
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
    const userId = session.user?.id || null;
    
    const body = await request.json();
    const validatedData = createPurchaseReceiptSchema.parse(body);
    
    const receipt = await createPurchaseReceipt({
      ...validatedData,
      organizationId,
      workspaceId,
      receivedBy: validatedData.receivedBy || userId,
      receiptDate: new Date(validatedData.receiptDate),
    } as any);
    
    return ApiResponse.success(receipt, 201);
  });
});