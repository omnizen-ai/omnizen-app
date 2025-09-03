import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { QueryEvolutionService } from '@/lib/ai/query-evolution';
import { z } from 'zod';

const analyticsQuerySchema = z.object({
  workspaceId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  intent: z.enum(['read', 'write', 'analyze', 'search', 'report', 'admin', 'unknown']).optional(),
  complexity: z.enum(['simple', 'moderate', 'complex', 'advanced']).optional(),
  groupBy: z.enum(['day', 'week', 'month', 'intent', 'complexity', 'workspace']).optional().default('day'),
});

async function getAnalytics(request: NextRequest): Promise<ApiResponse<any>> {
  const { organizationId } = request as any;
  
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validatedParams = analyticsQuerySchema.parse(queryParams);
    const queryEvolution = new QueryEvolutionService();
    
    const analytics = await queryEvolution.getQueryAnalytics(organizationId, validatedParams);

    return NextResponse.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    
    if (error instanceof z.ZodError) {
      return ApiResponse.badRequest('Invalid query parameters', error.errors);
    }

    return ApiResponse.error(error instanceof Error ? error.message : 'Failed to fetch analytics');
  }
}

export const GET = withAuth(withErrorHandler(getAnalytics));