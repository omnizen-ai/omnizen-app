import { ApiResponse, withAuth, withErrorHandler } from '@/lib/api/base';
import { 
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  recordInvoicePayment,
  markInvoiceAsSent
} from '@/lib/db/queries/invoices';
import { NextRequest } from 'next/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export const GET = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID not found in session');
    }
    const { id } = await params;
    
    const invoice = await getInvoiceById(id, organizationId);
    
    if (!invoice) {
      return ApiResponse.notFound('Invoice not found');
    }
    
    return ApiResponse.success(invoice);
  });
});

export const PUT = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID not found in session');
    }
    const { id } = await params;
    const body = await request.json();
    
    const invoice = await updateInvoice(id, organizationId, body);
    
    if (!invoice) {
      return ApiResponse.notFound('Invoice not found');
    }
    
    return ApiResponse.success(invoice);
  });
});

export const DELETE = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID not found in session');
    }
    const { id } = await params;
    
    await deleteInvoice(id, organizationId);
    
    return ApiResponse.success({ message: 'Invoice deleted successfully' });
  });
});

export const POST = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID not found in session');
    }
    const { id } = await params;
    const body = await request.json();
    
    // Handle different actions
    if (body.action === 'record-payment') {
      if (!body.amount || !body.paymentDate) {
        return ApiResponse.badRequest('Missing required payment fields');
      }
      
      const updatedInvoice = await recordInvoicePayment(
        id,
        organizationId,
        body.amount,
        new Date(body.paymentDate),
        body.paymentMethod,
        body.reference
      );
      
      return ApiResponse.success(updatedInvoice);
    }
    
    if (body.action === 'send') {
      const updatedInvoice = await markInvoiceAsSent(id, organizationId);
      
      if (!updatedInvoice) {
        return ApiResponse.badRequest('Invoice cannot be sent or already sent');
      }
      
      return ApiResponse.success(updatedInvoice);
    }
    
    return ApiResponse.badRequest('Invalid action');
  });
});