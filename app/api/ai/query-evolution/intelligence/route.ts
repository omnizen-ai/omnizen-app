import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { QueryEvolutionService } from '@/lib/ai/query-evolution';
import { z } from 'zod';

const intelligenceQuerySchema = z.object({
  workspaceId: z.string().uuid().optional(),
  intent: z.enum(['read', 'write', 'analyze', 'search', 'report', 'admin', 'unknown']).optional(),
  complexity: z.enum(['simple', 'moderate', 'complex', 'advanced']).optional(),
  minExecutionCount: z.number().min(1).optional().default(1),
  minConfidence: z.number().min(0).max(1).optional().default(0),
  isActive: z.boolean().optional().default(true),
  sortBy: z.enum(['last_used', 'execution_count', 'confidence_score', 'success_rate', 'avg_execution_time']).optional().default('last_used'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

const searchQuerySchema = z.object({
  query: z.string().min(1),
  similarityThreshold: z.number().min(0.1).max(1.0).optional().default(0.7),
  limit: z.number().min(1).max(50).optional().default(10),
});

const feedbackSchema = z.object({
  queryIntelligenceId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  accuracy: z.number().min(1).max(5).optional(),
  performance: z.number().min(1).max(5).optional(),
  relevance: z.number().min(1).max(5).optional(),
  comments: z.string().optional(),
  suggestedImprovements: z.string().optional(),
  sessionContext: z.record(z.any()).optional(),
});

async function getQueryIntelligence(request: NextRequest): Promise<ApiResponse<any>> {
  const { organizationId } = request as any;
  
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Parse numeric and boolean values
    if (queryParams.minExecutionCount) queryParams.minExecutionCount = parseInt(queryParams.minExecutionCount);
    if (queryParams.minConfidence) queryParams.minConfidence = parseFloat(queryParams.minConfidence);
    if (queryParams.isActive) queryParams.isActive = queryParams.isActive !== 'false';
    if (queryParams.limit) queryParams.limit = parseInt(queryParams.limit);
    if (queryParams.offset) queryParams.offset = parseInt(queryParams.offset);

    const validatedParams = intelligenceQuerySchema.parse(queryParams);
    const queryEvolution = new QueryEvolutionService();
    
    const intelligence = await queryEvolution.getQueryIntelligence(organizationId, validatedParams);
    const totalCount = await queryEvolution.getIntelligenceCount(organizationId, validatedParams);

    return NextResponse.json({
      success: true,
      data: {
        intelligence,
        pagination: {
          total: totalCount,
          limit: validatedParams.limit,
          offset: validatedParams.offset,
          hasMore: validatedParams.offset + intelligence.length < totalCount
        }
      }
    });

  } catch (error) {
    console.error('Get query intelligence error:', error);
    
    if (error instanceof z.ZodError) {
      return ApiResponse.badRequest('Invalid query parameters', error.errors);
    }

    return ApiResponse.error(error instanceof Error ? error.message : 'Failed to fetch query intelligence');
  }
}

async function searchSimilarQueries(request: NextRequest): Promise<ApiResponse<any>> {
  const { organizationId } = request as any;

  try {
    const body = await request.json();
    const { query, similarityThreshold, limit } = searchQuerySchema.parse(body);

    const queryEvolution = new QueryEvolutionService();
    const results = await queryEvolution.findSimilarQueries(organizationId, query, {
      similarityThreshold,
      limit
    });

    return NextResponse.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Search similar queries error:', error);
    
    if (error instanceof z.ZodError) {
      return ApiResponse.badRequest('Invalid search parameters', error.errors);
    }

    return ApiResponse.error(error instanceof Error ? error.message : 'Failed to search similar queries');
  }
}

async function submitFeedback(request: NextRequest): Promise<ApiResponse<any>> {
  const { organizationId, session } = request as any;

  try {
    const body = await request.json();
    const feedbackData = feedbackSchema.parse(body);

    const queryEvolution = new QueryEvolutionService();
    const feedback = await queryEvolution.submitQueryFeedback(
      organizationId,
      session.user.id,
      feedbackData
    );

    return NextResponse.json({
      success: true,
      data: feedback
    }, { status: 201 });

  } catch (error) {
    console.error('Submit feedback error:', error);
    
    if (error instanceof z.ZodError) {
      return ApiResponse.badRequest('Invalid feedback data', error.errors);
    }

    return ApiResponse.error(error instanceof Error ? error.message : 'Failed to submit feedback');
  }
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';

    try {
      const { searchParams } = new URL(request.url);
      const queryId = searchParams.get('queryId');
      const limit = parseInt(searchParams.get('limit') || '20');
      const includeMetrics = searchParams.get('metrics') === 'true';
      
      const queryEvolution = new QueryEvolutionService();
      
      if (queryId) {
        const intelligence = await queryEvolution.getQueryIntelligence(queryId, organizationId);
        return NextResponse.json({
          success: true,
          data: intelligence
        });
      } else {
        const recentQueries = await queryEvolution.getRecentQueries(organizationId, {
          limit,
          includeMetrics
        });
        
        return NextResponse.json({
          success: true,
          data: {
            queries: recentQueries,
            pagination: {
              limit,
              hasMore: recentQueries.length === limit
            }
          }
        });
      }

    } catch (error) {
      console.error('Get query intelligence error:', error);
      return ApiResponse.error(error instanceof Error ? error.message : 'Failed to get query intelligence');
    }
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';

    try {
      const body = await request.json();
      const { query, options } = searchSimilarSchema.parse(body);
      
      const queryEvolution = new QueryEvolutionService();
      const similarQueries = await queryEvolution.findSimilarQueries(organizationId, query, options);
      
      return NextResponse.json({
        success: true,
        data: {
          originalQuery: query,
          similarQueries,
          searchOptions: options
        }
      });

    } catch (error) {
      console.error('Search similar queries error:', error);
      
      if (error instanceof z.ZodError) {
        return ApiResponse.badRequest('Invalid search parameters', error.errors);
      }

      return ApiResponse.error(error instanceof Error ? error.message : 'Failed to search similar queries');
    }
  });
});

export const PUT = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    try {
      const body = await request.json();
      const feedback = queryFeedbackSchema.parse(body);
      
      const queryEvolution = new QueryEvolutionService();
      const result = await queryEvolution.submitQueryFeedback(feedback);
      
      return NextResponse.json({
        success: true,
        data: {
          message: 'Feedback submitted successfully',
          feedbackId: result.feedbackId
        }
      });

    } catch (error) {
      console.error('Submit feedback error:', error);
      
      if (error instanceof z.ZodError) {
        return ApiResponse.badRequest('Invalid feedback format', error.errors);
      }

      return ApiResponse.error(error instanceof Error ? error.message : 'Failed to submit feedback');
    }
  });
});