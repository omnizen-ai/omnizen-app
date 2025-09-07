import { ApiResponse, withRLS, withErrorHandler, withRLSTransaction } from '@/lib/api/base';
import { 
  getBills,
  createBillWithAutoNumber,
  getBillStats
} from '@/lib/db/queries/bills';
import { NextRequest } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

export const GET = withErrorHandler(
  withRLS(async (context, request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    
    // Parse filters from query params
    const filters = {
      status: searchParams.get('status') || undefined,
      vendorId: searchParams.get('vendorId') || undefined,
      search: searchParams.get('search') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };
    
    // If requesting stats, use RLS-aware query
    if (searchParams.get('stats') === 'true') {
      const stats = await withRLSTransaction(context, async (tx) => {
        // Query directly with RLS functions - no need to pass organizationId
        const result = await tx.execute(sql`
          SELECT 
            COALESCE(SUM(CASE WHEN status IN ('approved', 'partially_paid') THEN balance_due ELSE 0 END), 0) as total_outstanding,
            COALESCE(SUM(CASE WHEN status IN ('approved', 'partially_paid') AND due_date < NOW() THEN balance_due ELSE 0 END), 0) as total_overdue,
            COALESCE(SUM(CASE WHEN status = 'draft' THEN total_amount ELSE 0 END), 0) as total_draft,
            COUNT(*) as count
          FROM bills 
          WHERE organization_id = auth_org_id() -- RLS function handles org filtering
        `);
        return result[0] || { total_outstanding: 0, total_overdue: 0, total_draft: 0, count: 0 };
      });
      return ApiResponse.success(stats);
    }
    
    // Use the existing getBills function - much safer and tested
    const billsData = await getBills(context.orgId, filters);
    
    return ApiResponse.success(billsData);
  })
);

export const POST = withErrorHandler(
  withRLS(async (context, request: NextRequest) => {
    const body = await request.json();
    
    // Validate required fields (billNumber is now optional - will be auto-generated)
    if (!body.vendorId || !body.billDate || !body.dueDate || !body.totalAmount) {
      return ApiResponse.badRequest('Missing required fields: vendorId, billDate, dueDate, totalAmount');
    }
    
    // Create bill using existing function - much safer than raw SQL
    const bill = await createBillWithAutoNumber({
      vendorId: body.vendorId,
      billDate: body.billDate,
      dueDate: body.dueDate,
      totalAmount: body.totalAmount,
      subtotal: body.subtotal || body.totalAmount,
      taxAmount: body.taxAmount || '0',
      discountAmount: body.discountAmount || '0',
      status: body.status || 'draft',
      currencyCode: body.currencyCode || 'USD',
      vendorInvoiceNumber: body.vendorInvoiceNumber || null,
      notes: body.notes || null,
      organizationId: context.orgId,  // From RLS context
      workspaceId: context.workspaceId || '22222222-2222-2222-2222-222222222222',
      billNumber: body.billNumber,    // Optional - will be auto-generated
      userId: context.userId,         // For audit tracking
    });
    
    return ApiResponse.success(bill, 201);
  })
);