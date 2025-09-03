import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { documentStorage } from '@/lib/storage/document-storage';

async function getBucketsInfo(request: NextRequest): Promise<ApiResponse<any>> {
  try {
    const buckets = documentStorage.getAvailableBuckets();
    
    return NextResponse.json({
      success: true,
      data: {
        buckets: buckets.map(({ name, config }) => ({
          name,
          public: config.public,
          allowedMimeTypes: config.allowedMimeTypes,
          maxFileSize: config.maxFileSize,
          maxFileSizeMB: Math.round(config.maxFileSize / (1024 * 1024)),
          retentionDays: config.retentionDays,
        })),
        total: buckets.length,
      }
    });

  } catch (error) {
    console.error('Buckets info error:', error);
    return ApiResponse.error(error instanceof Error ? error.message : 'Failed to fetch buckets info');
  }
}

export const GET = withAuth(withErrorHandler(getBucketsInfo));