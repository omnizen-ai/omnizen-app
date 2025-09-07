import { ApiResponse, withAuth, withErrorHandler } from '@/lib/api/base';
import { 
  getInvoices,
  createInvoiceWithAutoNumber,
  getInvoiceStats
} from '@/lib/db/queries/invoices';
import { NextRequest } from 'next/server';

export const GET = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user.organizationId || '11111111-1111-1111-1111-111111111111';
    
    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get('status') || undefined,
      customerId: searchParams.get('customerId') || undefined,
      search: searchParams.get('search') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };
    
    // If requesting stats
    if (searchParams.get('stats') === 'true') {
      const stats = await getInvoiceStats(organizationId);
      return ApiResponse.success(stats);
    }
    
    const invoicesData = await getInvoices(organizationId, filters);
    return ApiResponse.success(invoicesData);
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const body = await request.json();
    const organizationId = session.user.organizationId || '11111111-1111-1111-1111-111111111111';
    const workspaceId = session.user.workspaceId || '22222222-2222-2222-2222-222222222222';
    
    // Validate required fields (invoiceNumber is now optional - will be auto-generated)
    if (!body.customerId || !body.issueDate || !body.dueDate || !body.totalAmount) {
      return ApiResponse.badRequest('Missing required fields: customerId, issueDate, dueDate, totalAmount');
    }
    
    const invoice = await createInvoiceWithAutoNumber({
      ...body,
      organizationId,
      workspaceId,
      userId: session.user?.id, // For audit tracking
      status: body.status || 'draft',
      currencyCode: body.currencyCode || 'USD',
      subtotal: body.subtotal || body.totalAmount,
      taxAmount: body.taxAmount || '0',
      discountAmount: body.discountAmount || '0',
    });
    
    return ApiResponse.success(invoice, 201);
  });
});