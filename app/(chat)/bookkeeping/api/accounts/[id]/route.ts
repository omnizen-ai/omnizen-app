import { ApiResponse, withAuth, withErrorHandler } from '@/lib/api/base';
import { 
  getChartOfAccountById, 
  updateChartOfAccount,
  deleteChartOfAccount,
  getAccountBalance
} from '@/lib/db/queries/accounting';
import { NextRequest } from 'next/server';

interface RouteParams {
  params: {
    id: string;
  };
}

export const GET = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user.organizationId || '11111111-1111-1111-1111-111111111111';
    const { id } = params;
    
    const account = await getChartOfAccountById(id, organizationId);
    
    if (!account) {
      return ApiResponse.notFound('Account not found');
    }
    
    // Include balance information
    const balance = await getAccountBalance(id, organizationId);
    
    return ApiResponse.success({
      ...account,
      ...balance,
    });
  });
});

export const PUT = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user.organizationId || '11111111-1111-1111-1111-111111111111';
    const { id } = params;
    const body = await request.json();
    
    const account = await updateChartOfAccount(id, organizationId, body);
    
    if (!account) {
      return ApiResponse.notFound('Account not found');
    }
    
    return ApiResponse.success(account);
  });
});

export const DELETE = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user.organizationId || '11111111-1111-1111-1111-111111111111';
    const { id } = params;
    
    await deleteChartOfAccount(id, organizationId);
    
    return ApiResponse.success({ message: 'Account deleted successfully' });
  });
});