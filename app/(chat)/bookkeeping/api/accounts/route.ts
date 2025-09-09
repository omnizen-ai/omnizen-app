import { ApiResponse, withAuth, withErrorHandler } from '@/lib/api/base';
import { 
  getChartOfAccounts, 
  createChartOfAccount 
} from '@/lib/db/queries/accounting';
import { NextRequest } from 'next/server';

export const GET = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    // Require organization ID from session - no fallbacks
    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID not found in session');
    }
    
    console.log('[Accounts API] Debug info:', {
      sessionUserId: session.user?.id,
      sessionOrgId: session.user?.organizationId,
      usingOrgId: organizationId
    });
    
    const accounts = await getChartOfAccounts(organizationId);
    console.log('[Accounts API] Query result:', { accountCount: accounts?.length || 0, organizationId });
    
    return ApiResponse.success(accounts);
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const body = await request.json();
    
    // Require organization ID and workspace ID from session - no fallbacks
    const organizationId = session.user.organizationId;
    const workspaceId = session.user.workspaceId;
    
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID not found in session');
    }
    if (!workspaceId) {
      return ApiResponse.badRequest('Workspace ID not found in session');
    }
    
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