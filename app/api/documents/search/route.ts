import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { documentProcessor } from '@/lib/ai/document-processor';
import { z } from 'zod';

const searchSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  workspaceId: z.string().uuid().optional(),
  limit: z.number().min(1).max(50).optional().default(10),
  minSimilarity: z.number().min(0).max(1).optional().default(0.7),
  documentTypes: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = request.headers.get('x-organization-id') || session.user.organizationId;
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID required');
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = searchSchema.parse(body);

    // Perform similarity search
    const searchStartTime = Date.now();
    const results = await documentProcessor.searchSimilarDocuments(
      validatedData.query,
      {
        organizationId,
        workspaceId: validatedData.workspaceId,
        limit: validatedData.limit,
        minSimilarity: validatedData.minSimilarity,
        documentTypes: validatedData.documentTypes,
        categories: validatedData.categories,
      }
    );
    const searchTime = Date.now() - searchStartTime;

    return NextResponse.json({
      query: validatedData.query,
      results,
      searchTime,
      metadata: {
        totalResults: results.length,
        minSimilarity: validatedData.minSimilarity,
        searchedTypes: validatedData.documentTypes || 'all',
        searchedCategories: validatedData.categories || 'all',
      },
    });
  });
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = request.headers.get('x-organization-id') || session.user.organizationId;
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID required');
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({
        query: query || '',
        suggestions: [],
      });
    }

    // Get search suggestions
    const results = await documentProcessor.searchSimilarDocuments(query, {
      organizationId,
      limit: 10,
      minSimilarity: 0.5,
    });

    // Extract suggestions from results
    const suggestions = results.slice(0, 5).map(result => ({
      documentId: result.documentId,
      title: result.metadata?.title || result.content.substring(0, 50) + '...',
      snippet: result.content.substring(0, 100) + '...',
      similarity: result.similarity,
      fileType: result.metadata?.fileType,
    }));

    return NextResponse.json({
      query,
      suggestions,
    });
  });
});