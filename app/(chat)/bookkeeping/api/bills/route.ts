import { ApiResponse, withAuth, withErrorHandler } from '@/lib/api/base';
import { 
  getBills,
  createBill,
  getBillStats
} from '@/lib/db/queries/bills';
import { NextRequest } from 'next/server';

export const GET = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user.organizationId || '11111111-1111-1111-1111-111111111111';
    
    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get('status') || undefined,
      vendorId: searchParams.get('vendorId') || undefined,
      search: searchParams.get('search') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };
    
    // If requesting stats
    if (searchParams.get('stats') === 'true') {
      const stats = await getBillStats(organizationId);
      return ApiResponse.success(stats);
    }
    
    const billsData = await getBills(organizationId, filters);
    return ApiResponse.success(billsData);
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const body = await request.json();
    const organizationId = session.user.organizationId || '11111111-1111-1111-1111-111111111111';
    const workspaceId = session.user.workspaceId || '22222222-2222-2222-2222-222222222222';
    
    // Validate required fields
    if (!body.billNumber || !body.vendorId || !body.billDate || !body.dueDate || !body.totalAmount) {
      return ApiResponse.badRequest('Missing required fields');
    }
    
    const bill = await createBill({
      ...body,
      organizationId,
      workspaceId,
      status: body.status || 'draft',
      currencyCode: body.currencyCode || 'USD',
      subtotal: body.subtotal || body.totalAmount,
      taxAmount: body.taxAmount || '0',
      discountAmount: body.discountAmount || '0',
    });
    
    return ApiResponse.success(bill, 201);
  });
});