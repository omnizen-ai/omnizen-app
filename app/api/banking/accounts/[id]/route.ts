import { NextRequest } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { 
  getBankAccountById,
  updateBankAccount,
  deleteBankAccount 
} from '@/lib/db/queries/banking';
import { z } from 'zod';

// Schema for bank account update
const updateBankAccountSchema = z.object({
  accountName: z.string().min(1).optional(),
  accountNumber: z.string().optional(),
  accountType: z.enum(['checking', 'savings', 'credit_card', 'cash', 'loan', 'merchant', 'investment']).optional(),
  bankName: z.string().optional(),
  bankBranch: z.string().optional(),
  routingNumber: z.string().optional(),
  swiftCode: z.string().optional(),
  iban: z.string().optional(),
  currencyCode: z.string().optional(),
  glAccountId: z.string().uuid().optional(),
  currentBalance: z.string().optional(),
  availableBalance: z.string().optional(),
  isDefault: z.boolean().optional(),
  allowPayments: z.boolean().optional(),
  allowDeposits: z.boolean().optional(),
  requireReconciliation: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId;
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID not found in session');
    }
    const { id } = await params;
    
    const account = await getBankAccountById(id, organizationId);
    
    if (!account) {
      return ApiResponse.error('Bank account not found', 404);
    }
    
    return ApiResponse.success(account);
  });
});

export const PUT = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId;
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID not found in session');
    }
    const { id } = await params;
    
    const body = await request.json();
    const validatedData = updateBankAccountSchema.parse(body);
    
    const account = await updateBankAccount(id, organizationId, validatedData);
    
    if (!account) {
      return ApiResponse.error('Bank account not found', 404);
    }
    
    return ApiResponse.success(account);
  });
});

export const DELETE = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId;
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID not found in session');
    }
    const { id } = await params;
    
    await deleteBankAccount(id, organizationId);
    
    return ApiResponse.success({ message: 'Bank account deleted successfully' });
  });
});