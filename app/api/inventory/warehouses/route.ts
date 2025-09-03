import { NextRequest } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { getWarehouses } from '@/lib/db/queries/inventory';

export const GET = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    
    const warehouses = await getWarehouses(organizationId);
    return ApiResponse.success(warehouses);
  });
});