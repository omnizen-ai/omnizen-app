import { NextRequest } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { db } from '@/lib/db';
import { currencies } from '@/lib/db/schema/finance/accounts';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Schema for currency creation
const createCurrencySchema = z.object({
  code: z.string().min(3).max(3),
  symbol: z.string().min(1),
  name: z.string().min(1),
  decimals: z.number().default(2),
  isActive: z.boolean().default(true),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    
    // Fetch currencies for the organization
    const orgCurrencies = await db
      .select()
      .from(currencies)
      .where(
        and(
          eq(currencies.organizationId, organizationId),
          eq(currencies.isActive, true)
        )
      )
      .orderBy(currencies.code);

    return ApiResponse.success(orgCurrencies);
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';
    
    const body = await request.json();
    const validatedData = createCurrencySchema.parse(body);
    
    // Create new currency
    const [newCurrency] = await db
      .insert(currencies)
      .values({
        ...validatedData,
        organizationId,
      })
      .returning();

    return ApiResponse.success(newCurrency, 201);
  });
});