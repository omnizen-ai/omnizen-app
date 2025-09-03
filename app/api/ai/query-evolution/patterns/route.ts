import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { QueryEvolutionService } from '@/lib/ai/query-evolution';
import { z } from 'zod';

const patternQuerySchema = z.object({
  businessDomain: z.string().optional(),
  minUsageCount: z.number().min(0).optional().default(1),
  minConfidence: z.number().min(0).max(1).optional().default(0.5),
  isActive: z.boolean().optional().default(true),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

const createPatternSchema = z.object({
  patternName: z.string().min(1).max(255),
  patternTemplate: z.string().min(1),
  patternDescription: z.string().optional(),
  businessDomain: z.string().optional(),
  useCases: z.array(z.string()).optional().default([]),
  parameters: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string().optional(),
    required: z.boolean().optional().default(false)
  })).optional().default([]),
});

async function getPatterns(request: NextRequest): Promise<ApiResponse<any>> {
  const { organizationId } = request as any;
  
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      businessDomain: searchParams.get('businessDomain') || undefined,
      minUsageCount: parseInt(searchParams.get('minUsageCount') || '1'),
      minConfidence: parseFloat(searchParams.get('minConfidence') || '0.5'),
      isActive: searchParams.get('isActive') !== 'false',
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    const validatedParams = patternQuerySchema.parse(queryParams);
    const queryEvolution = new QueryEvolutionService();
    
    const patterns = await queryEvolution.getQueryPatterns(organizationId, validatedParams);
    const totalCount = await queryEvolution.getPatternCount(organizationId, validatedParams);

    return NextResponse.json({
      success: true,
      data: {
        patterns,
        pagination: {
          total: totalCount,
          limit: validatedParams.limit,
          offset: validatedParams.offset,
          hasMore: validatedParams.offset + patterns.length < totalCount
        }
      }
    });

  } catch (error) {
    console.error('Get patterns error:', error);
    
    if (error instanceof z.ZodError) {
      return ApiResponse.badRequest('Invalid query parameters', error.errors);
    }

    return ApiResponse.error(error instanceof Error ? error.message : 'Failed to fetch patterns');
  }
}

async function createPattern(request: NextRequest): Promise<ApiResponse<any>> {
  const { organizationId, session } = request as any;

  try {
    const body = await request.json();
    const patternData = createPatternSchema.parse(body);

    const queryEvolution = new QueryEvolutionService();
    const pattern = await queryEvolution.createQueryPattern(organizationId, patternData);

    return NextResponse.json({
      success: true,
      data: pattern
    }, { status: 201 });

  } catch (error) {
    console.error('Create pattern error:', error);
    
    if (error instanceof z.ZodError) {
      return ApiResponse.badRequest('Invalid pattern data', error.errors);
    }

    return ApiResponse.error(error instanceof Error ? error.message : 'Failed to create pattern');
  }
}

export const GET = withAuth(withErrorHandler(getPatterns));
export const POST = withAuth(withErrorHandler(createPattern));