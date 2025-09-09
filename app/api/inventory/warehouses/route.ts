import { NextRequest } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { getWarehouses } from '@/lib/db/queries/inventory';

export const GET = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId;
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID not found in session');
    }
    
    const warehouses = await getWarehouses(organizationId);
    return ApiResponse.success(warehouses);
  });
});