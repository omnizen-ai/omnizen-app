import { NextRequest } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { 
  getBankTransactions,
  createBankTransaction,
  getCashFlowSummary 
} from '@/lib/db/queries/banking';
import { z } from 'zod';

// Schema for bank transaction creation
const createBankTransactionSchema = z.object({
  bankAccountId: z.string().uuid(),
  transactionDate: z.string().or(z.date()).transform((val) => new Date(val)),
  transactionType: z.enum(['deposit', 'withdrawal', 'transfer', 'fee', 'interest', 'adjustment', 'opening_balance']),
  amount: z.string(),
  bankReferenceNumber: z.string().optional(),
  checkNumber: z.string().optional(),
  payee: z.string().optional(),
  description: z.string().optional(),
  memo: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isReconciled: z.boolean().default(false),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    
    const { searchParams } = new URL(request.url);
    const bankAccountId = searchParams.get('bankAccountId') || undefined;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const transactionType = searchParams.get('type') || undefined;
    const isReconciled = searchParams.get('reconciled');
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const summary = searchParams.get('summary');
    
    // If summary is requested, return cash flow summary
    if (summary === 'true') {
      const summaryData = await getCashFlowSummary(
        organizationId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
      return ApiResponse.success(summaryData);
    }
    
    const transactions = await getBankTransactions(organizationId, {
      bankAccountId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      transactionType,
      isReconciled: isReconciled ? isReconciled === 'true' : undefined,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
    
    return ApiResponse.success(transactions);
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    
    const body = await request.json();
    const validatedData = createBankTransactionSchema.parse(body);
    
    const transaction = await createBankTransaction({
      ...validatedData,
      organizationId,
      runningBalance: null,
      reconciledDate: null,
      reconciliationId: null,
      paymentId: null,
      journalEntryId: null,
      importBatchId: null,
      isDuplicate: false,
      tags: validatedData.tags ? JSON.stringify(validatedData.tags) : null,
    } as any);
    
    return ApiResponse.success(transaction, 201);
  });
});