import { NextRequest } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { 
  getWarehouses, 
  createWarehouse, 
  updateWarehouse, 
  deleteWarehouse,
  getWarehouseSummary
} from '@/lib/db/queries/warehouses';

export const GET = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const type = searchParams.get('type') || undefined;
    const status = searchParams.get('status') || undefined;
    const summary = searchParams.get('summary');

    // If summary is requested, return warehouse summary
    if (summary === 'true') {
      const summaryData = await getWarehouseSummary(organizationId);
      return ApiResponse.success(summaryData);
    }

    const result = await getWarehouses(organizationId, {
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
    const body = await request.json();
    
    const warehouseData = {
      ...body,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newWarehouse = await createWarehouse(warehouseData);
    return ApiResponse.success(newWarehouse, 201);
  });
});

export const PUT = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return ApiResponse.badRequest('Warehouse ID required');
    }

    const updatedWarehouse = await updateWarehouse(id, organizationId, updateData);

    if (!updatedWarehouse) {
      return ApiResponse.notFound('Warehouse not found');
    }

    return ApiResponse.success(updatedWarehouse);
  });
});

export const DELETE = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return ApiResponse.badRequest('Warehouse ID required');
    }

    const deletedWarehouse = await deleteWarehouse(id, organizationId);

    if (!deletedWarehouse) {
      return ApiResponse.notFound('Warehouse not found');
    }

    return ApiResponse.success({ success: true });
  });
});