import { ApiResponse, withAuth, withErrorHandler } from '@/lib/api/base';
import { 
  getChartOfAccounts, 
  createChartOfAccount 
} from '@/lib/db/queries/accounting';
import { NextRequest } from 'next/server';

export const GET = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    // Use a proper UUID for testing - in production this would come from session
    const organizationId = session.user.organizationId || '11111111-1111-1111-1111-111111111111';
    
    const accounts = await getChartOfAccounts(organizationId);
    return ApiResponse.success(accounts);
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const body = await request.json();
    const organizationId = session.user.organizationId || '11111111-1111-1111-1111-111111111111';
    const workspaceId = session.user.workspaceId || '22222222-2222-2222-2222-222222222222';
    
    // Validate required fields
    if (!body.code || !body.name || !body.type) {
      return ApiResponse.badRequest('Missing required fields: code, name, type');
    }
    
    const account = await createChartOfAccount({
      ...body,
      organizationId,
      workspaceId,
      currentBalance: body.currentBalance || '0.00',
      normalBalance: body.normalBalance || 'debit',
      currencyCode: body.currencyCode || 'USD',
      isPostable: body.isPostable ?? true,
      isActive: body.isActive ?? true,
      isSystemAccount: false,
    });
    
    return ApiResponse.success(account, 201);
  });
});