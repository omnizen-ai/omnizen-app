import { NextRequest } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { getContacts, createContact, updateContact, deleteContact } from '@/lib/db/queries/sales';

export const GET = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const summary = searchParams.get('summary');

    // If summary is requested, return vendor summary
    if (summary === 'true') {
      const vendors = await getContacts(organizationId, {
        type: 'vendor',
        isActive: undefined,
        search: undefined,
      });
      
      const summaryData = {
        totalVendors: vendors.length,
        activeVendors: vendors.filter(v => v.isActive).length,
        recentVendors: vendors.filter(v => {
          const createdAt = new Date(v.createdAt);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return createdAt >= thirtyDaysAgo;
        }).length,
        totalPurchases: 0, // TODO: Calculate from purchase orders
      };
      
      return ApiResponse.success(summaryData);
    }

    const result = await getContacts(organizationId, {
      type: 'vendor',
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
    
    const vendorData = {
      ...body,
      type: 'vendor' as const,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newVendor = await createContact(vendorData);
    return ApiResponse.success(newVendor, 201);
  });
});

export const PUT = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return ApiResponse.badRequest('Vendor ID required');
    }

    const updatedVendor = await updateContact(id, organizationId, updateData);

    if (!updatedVendor) {
      return ApiResponse.notFound('Vendor not found');
    }

    return ApiResponse.success(updatedVendor);
  });
});

export const DELETE = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return ApiResponse.badRequest('Vendor ID required');
    }

    const deletedVendor = await deleteContact(id, organizationId);

    if (!deletedVendor) {
      return ApiResponse.notFound('Vendor not found');
    }

    return ApiResponse.success({ success: true });
  });
});