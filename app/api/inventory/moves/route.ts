import { NextRequest } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { 
  getStockMoves,
  createStockMove 
} from '@/lib/db/queries/inventory';
import { z } from 'zod';

// Schema for stock move creation
const createStockMoveSchema = z.object({
  productId: z.string().uuid(),
  moveType: z.enum(['receipt', 'shipment', 'transfer', 'adjustment_in', 'adjustment_out', 'production', 'consumption']),
  quantity: z.string(),
  moveDate: z.string().or(z.date()).transform((val) => new Date(val)),
  sourceWarehouseId: z.string().uuid().optional().nullable(),
  destinationWarehouseId: z.string().uuid().optional().nullable(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const productId = searchParams.get('productId') || undefined;
    const moveType = searchParams.get('moveType') || undefined;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    
    const moves = await getStockMoves(organizationId, {
      warehouseId,
      productId,
      moveType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
    
    return ApiResponse.success(moves);
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    const workspaceId = session.user?.workspaceId || null;
    
    const body = await request.json();
    const validatedData = createStockMoveSchema.parse(body);
    
    const move = await createStockMove({
      ...validatedData,
      organizationId,
      workspaceId,
      moveDate: validatedData.moveDate,
      createdBy: session.user?.id || null,
    } as any);
    
    return ApiResponse.success(move, 201);
  });
});