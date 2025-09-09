import { NextRequest } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { 
  getInventoryLevels,
  createInventoryLevel,
  getInventorySummary
} from '@/lib/db/queries/inventory';
import { z } from 'zod';

// Schema for inventory level creation
const createInventoryLevelSchema = z.object({
  warehouseId: z.string().uuid(),
  productId: z.string().uuid(),
  quantityOnHand: z.string().default('0'),
  quantityAvailable: z.string().default('0'),
  quantityReserved: z.string().default('0'),
  reorderPoint: z.string().optional(),
  reorderQuantity: z.string().optional(),
  unitCost: z.string().optional(),
  lastCountDate: z.string().or(z.date()).optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId;
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID not found in session');
    }
    
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const productId = searchParams.get('productId') || undefined;
    const lowStock = searchParams.get('lowStock') === 'true';
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const summary = searchParams.get('summary');
    
    // If summary is requested, return inventory summary
    if (summary === 'true') {
      const summaryData = await getInventorySummary(organizationId);
      return ApiResponse.success(summaryData);
    }
    
    const inventoryData = await getInventoryLevels(organizationId, {
      warehouseId,
      productId,
      lowStock,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
    
    return ApiResponse.success(inventoryData);
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
    const validatedData = createInventoryLevelSchema.parse(body);
    
    const inventory = await createInventoryLevel({
      ...validatedData,
      organizationId,
      workspaceId,
      lastCountDate: validatedData.lastCountDate ? new Date(validatedData.lastCountDate) : null,
    } as any);
    
    return ApiResponse.success(inventory, 201);
  });
});