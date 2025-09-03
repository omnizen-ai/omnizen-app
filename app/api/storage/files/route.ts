import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { documentStorage } from '@/lib/storage/document-storage';
import { z } from 'zod';

const listFilesSchema = z.object({
  bucket: z.string(),
  category: z.string().optional(),
  limit: z.number().min(1).max(1000).optional().default(100),
  offset: z.number().min(0).optional().default(0),
  sortBy: z.enum(['name', 'created_at', 'updated_at', 'last_accessed_at']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

const uploadFileSchema = z.object({
  bucket: z.string(),
  category: z.string().optional(),
  overwrite: z.boolean().optional().default(false),
});

async function listFiles(request: NextRequest): Promise<ApiResponse<any>> {
  const { organizationId } = request as any;

  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Parse numeric values
    if (queryParams.limit) queryParams.limit = parseInt(queryParams.limit);
    if (queryParams.offset) queryParams.offset = parseInt(queryParams.offset);

    const validatedParams = listFilesSchema.parse(queryParams);
    
    const result = await documentStorage.listFiles(
      organizationId,
      validatedParams.bucket as any,
      {
        category: validatedParams.category,
        limit: validatedParams.limit,
        offset: validatedParams.offset,
        sortBy: validatedParams.sortBy,
        sortOrder: validatedParams.sortOrder,
      }
    );

    if (!result.success) {
      return ApiResponse.badRequest(result.error);
    }

    return NextResponse.json({
      success: true,
      data: {
        files: result.files,
        pagination: {
          limit: validatedParams.limit,
          offset: validatedParams.offset,
          hasMore: (result.files?.length || 0) === validatedParams.limit,
        },
        bucket: validatedParams.bucket,
        category: validatedParams.category,
      }
    });

  } catch (error) {
    console.error('List files error:', error);
    
    if (error instanceof z.ZodError) {
      return ApiResponse.badRequest('Invalid query parameters', error.errors);
    }

    return ApiResponse.error(error instanceof Error ? error.message : 'Failed to list files');
  }
}

async function uploadFile(request: NextRequest): Promise<ApiResponse<any>> {
  const { organizationId, session } = request as any;

  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const optionsJson = formData.get('options') as string;

    if (!file) {
      return ApiResponse.badRequest('No file provided');
    }

    // Parse and validate options
    let options: any;
    try {
      const parsedOptions = optionsJson ? JSON.parse(optionsJson) : {};
      options = uploadFileSchema.parse(parsedOptions);
    } catch (error) {
      return ApiResponse.badRequest('Invalid options format', error instanceof z.ZodError ? error.errors : undefined);
    }

    // Upload file
    const result = await documentStorage.uploadFile(
      organizationId,
      options.bucket,
      file,
      {
        fileName: file.name,
        contentType: file.type,
        category: options.category,
        userId: session.user.id,
        overwrite: options.overwrite,
        metadata: {
          originalSize: file.size,
          uploadedVia: 'api',
        }
      }
    );

    if (!result.success) {
      return ApiResponse.badRequest(result.error);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        fileName: file.name,
        uploadedBy: session.user.id,
        uploadedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Upload file error:', error);
    return ApiResponse.error(error instanceof Error ? error.message : 'Upload failed');
  }
}

export const GET = withAuth(withErrorHandler(listFiles));
export const POST = withAuth(withErrorHandler(uploadFile));