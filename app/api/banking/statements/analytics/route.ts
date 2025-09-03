import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { bankingStatementProcessor } from '@/lib/ai/banking-statement-processor';
import { z } from 'zod';

const analyticsQuerySchema = z.object({
  days: z.number().min(1).max(365).optional().default(30),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';

    try {
      const { searchParams } = new URL(request.url);
      const queryParams = {
        days: parseInt(searchParams.get('days') || '30'),
      };

      const validatedParams = analyticsQuerySchema.parse(queryParams);
      const stats = await bankingStatementProcessor.getProcessingStats(organizationId, validatedParams.days);

      return NextResponse.json({
        success: true,
        data: {
          ...stats,
          period: `${validatedParams.days} days`,
          generatedAt: new Date().toISOString(),
        }
      });

    } catch (error) {
      console.error('Statement analytics error:', error);
      
      if (error instanceof z.ZodError) {
        return ApiResponse.badRequest('Invalid query parameters', error.errors);
      }

      return ApiResponse.error(error instanceof Error ? error.message : 'Failed to fetch analytics');
    }
  });
});