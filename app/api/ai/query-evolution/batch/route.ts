import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { QueryEvolutionService } from '@/lib/ai/query-evolution';
import { z } from 'zod';

const batchProcessSchema = z.object({
  batchSize: z.number().min(10).max(500).optional().default(100),
  minExecutionCount: z.number().min(1).max(10).optional().default(2),
  similarityThreshold: z.number().min(0.1).max(1.0).optional().default(0.8),
  embeddingModel: z.enum(['text-embedding-3-small', 'text-embedding-3-large']).optional().default('text-embedding-3-small'),
  maxProcessingTime: z.number().min(5000).max(300000).optional().default(30000),
});

async function processBatch(request: NextRequest): Promise<ApiResponse<{ jobId: string; status: string; message: string }>> {
  const { organizationId, session } = request as any;

  try {
    const body = await request.json();
    const config = batchProcessSchema.parse(body);

    const queryEvolution = new QueryEvolutionService();
    const jobId = await queryEvolution.processBatch(organizationId, config);

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        status: 'processing',
        message: 'Batch processing started successfully'
      }
    });

  } catch (error) {
    console.error('Query evolution batch error:', error);
    
    if (error instanceof z.ZodError) {
      return ApiResponse.badRequest('Invalid configuration parameters', error.errors);
    }

    return ApiResponse.error(error instanceof Error ? error.message : 'Failed to start batch processing');
  }
}

async function getBatchStatus(request: NextRequest): Promise<ApiResponse<any>> {
  const { organizationId } = request as any;
  
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const queryEvolution = new QueryEvolutionService();
    
    if (batchId) {
      const status = await queryEvolution.getBatchJobStatus(batchId);
      return NextResponse.json({
        success: true,
        data: status
      });
    } else {
      const jobs = await queryEvolution.getRecentBatchJobs(organizationId, limit);
      return NextResponse.json({
        success: true,
        data: { jobs }
      });
    }

  } catch (error) {
    console.error('Get batch status error:', error);
    return ApiResponse.error(error instanceof Error ? error.message : 'Failed to get batch status');
  }
}

export const POST = withAuth(withErrorHandler(processBatch));
export const GET = withAuth(withErrorHandler(getBatchStatus));