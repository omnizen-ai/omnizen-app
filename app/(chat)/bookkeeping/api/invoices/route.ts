import { ApiResponse, withAuth, withErrorHandler } from '@/lib/api/base';
import { 
  getInvoices,
  createInvoiceWithAutoNumber,
  getInvoiceStats
} from '@/lib/db/queries/invoices';
import { NextRequest } from 'next/server';

export const GET = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    // Require organization ID from session - no fallbacks
    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID not found in session');
    }
    
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
    
    // Require organization ID and workspace ID from session - no fallbacks
    const organizationId = session.user.organizationId;
    const workspaceId = session.user.workspaceId;
    
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID not found in session');
    }
    if (!workspaceId) {
      return ApiResponse.badRequest('Workspace ID not found in session');
    }
    
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