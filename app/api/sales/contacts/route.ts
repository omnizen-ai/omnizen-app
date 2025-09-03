import { NextRequest } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { 
  getContacts, 
  createContact, 
  updateContact, 
  deleteContact, 
  getSalesSummary 
} from '@/lib/db/queries/sales';

export const GET = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const type = searchParams.get('type') || undefined;
    const status = searchParams.get('status');
    const summary = searchParams.get('summary');

    // If summary is requested, return sales summary
    if (summary === 'true') {
      const summaryData = await getSalesSummary(organizationId);
      return ApiResponse.success(summaryData);
    }

    const result = await getContacts(organizationId, {
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
    
    const contactData = {
      ...body,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newContact = await createContact(contactData);
    return ApiResponse.success(newContact, 201);
  });
});

export const PUT = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return ApiResponse.badRequest('Contact ID required');
    }

    const updatedContact = await updateContact(id, organizationId, updateData);

    if (!updatedContact) {
      return ApiResponse.notFound('Contact not found');
    }

    return ApiResponse.success(updatedContact);
  });
});

export const DELETE = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return ApiResponse.badRequest('Contact ID required');
    }

    const deletedContact = await deleteContact(id, organizationId);

    if (!deletedContact) {
      return ApiResponse.notFound('Contact not found');
    }

    return ApiResponse.success({ success: true });
  });
});