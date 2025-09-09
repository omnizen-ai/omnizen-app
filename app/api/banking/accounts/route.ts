import { NextRequest } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { 
  getBankAccounts, 
  createBankAccount 
} from '@/lib/db/queries/banking';
import { bankAccounts } from '@/lib/db/schema/index';
import { z } from 'zod';

// Schema for bank account creation
const createBankAccountSchema = z.object({
  accountName: z.string().min(1),
  accountNumber: z.string().optional(),
  accountType: z.enum(['checking', 'savings', 'credit_card', 'cash', 'loan', 'merchant', 'investment']),
  bankName: z.string().optional(),
  bankBranch: z.string().optional(),
  routingNumber: z.string().optional(),
  swiftCode: z.string().optional(),
  iban: z.string().optional(),
  currencyCode: z.string().default('USD'),
  glAccountId: z.string().uuid(),
  currentBalance: z.string().default('0'),
  availableBalance: z.string().default('0'),
  isDefault: z.boolean().default(false),
  allowPayments: z.boolean().default(true),
  allowDeposits: z.boolean().default(true),
  requireReconciliation: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId;
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID not found in session');
    }
    
    const accounts = await getBankAccounts(organizationId);
    return ApiResponse.success(accounts);
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId;
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID not found in session');
    }
    const workspaceId = session.user?.workspaceId || null;
    
    const body = await request.json();
    const validatedData = createBankAccountSchema.parse(body);
    
    const account = await createBankAccount({
      ...validatedData,
      organizationId,
      workspaceId,
    } as any);
    
    return ApiResponse.success(account, 201);
  });
});