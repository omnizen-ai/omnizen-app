import { NextRequest } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { 
  getSalesOrders, 
  createSalesOrder, 
  updateSalesOrder, 
  deleteSalesOrder,
  getSalesOrderSummary
} from '@/lib/db/queries/sales-orders';

export const GET = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const customerId = searchParams.get('customerId') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const search = searchParams.get('search') || undefined;
    const summary = searchParams.get('summary');

    // If summary is requested, return sales order summary
    if (summary === 'true') {
      const summaryData = await getSalesOrderSummary(organizationId);
      return ApiResponse.success(summaryData);
    }

    const result = await getSalesOrders(organizationId, {
      status,
      customerId,
      dateFrom,
      dateTo,
      search,
    });

    return ApiResponse.success(result);
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    const body = await request.json();
    const { lines, ...orderData } = body;
    
    const salesOrderData = {
      ...orderData,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newOrder = await createSalesOrder(salesOrderData);

    // TODO: Handle order lines creation when salesOrderLines query functions are added
    
    return ApiResponse.success(newOrder, 201);
  });
});

export const PUT = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    const body = await request.json();
    const { id, lines, ...updateData } = body;

    if (!id) {
      return ApiResponse.badRequest('Sales Order ID required');
    }

    const updatedOrder = await updateSalesOrder(id, organizationId, updateData);

    if (!updatedOrder) {
      return ApiResponse.notFound('Sales Order not found');
    }

    return ApiResponse.success(updatedOrder);
  });
});

export const DELETE = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return ApiResponse.badRequest('Sales Order ID required');
    }

    const deletedOrder = await deleteSalesOrder(id, organizationId);

    if (!deletedOrder) {
      return ApiResponse.notFound('Sales Order not found');
    }

    return ApiResponse.success({ success: true });
  });
});