import { ApiResponse, withAuth, withErrorHandler } from '@/lib/api/base';
import { 
  getBillById,
  updateBill,
  deleteBill,
  recordBillPayment
} from '@/lib/db/queries/bills';
import { NextRequest } from 'next/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export const GET = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user.organizationId || '11111111-1111-1111-1111-111111111111';
    const { id } = await params;
    
    const bill = await getBillById(id, organizationId);
    
    if (!bill) {
      return ApiResponse.notFound('Bill not found');
    }
    
    return ApiResponse.success(bill);
  });
});

export const PUT = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user.organizationId || '11111111-1111-1111-1111-111111111111';
    const { id } = await params;
    const body = await request.json();
    
    const bill = await updateBill(id, organizationId, body);
    
    if (!bill) {
      return ApiResponse.notFound('Bill not found');
    }
    
    return ApiResponse.success(bill);
  });
});

export const DELETE = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user.organizationId || '11111111-1111-1111-1111-111111111111';
    const { id } = await params;
    
    await deleteBill(id, organizationId);
    
    return ApiResponse.success({ message: 'Bill deleted successfully' });
  });
});

export const POST = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user.organizationId || '11111111-1111-1111-1111-111111111111';
    const { id } = await params;
    const body = await request.json();
    
    // Handle payment recording
    if (body.action === 'record-payment') {
      if (!body.amount || !body.paymentDate) {
        return ApiResponse.badRequest('Missing required payment fields');
      }
      
      const updatedBill = await recordBillPayment(
        id,
        organizationId,
        body.amount,
        new Date(body.paymentDate),
        body.paymentMethod,
        body.reference
      );
      
      return ApiResponse.success(updatedBill);
    }
    
    return ApiResponse.badRequest('Invalid action');
  });
});