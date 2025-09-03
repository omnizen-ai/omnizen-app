import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { documentProcessor, type ProcessingOptions, type FileInfo } from '@/lib/ai/document-processor';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db';
import { documentsTable } from '@/lib/db/schema/documents/documents';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

// Supabase client for file storage
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const uploadSchema = z.object({
  workspaceId: z.string().uuid().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  generateEmbeddings: z.boolean().optional().default(true),
  performOCR: z.boolean().optional().default(true),
  chunkSize: z.number().min(100).max(2000).optional().default(1000),
  chunkOverlap: z.number().min(0).max(500).optional().default(200),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = request.headers.get('x-organization-id') || session.user.organizationId;
    if (!organizationId) {
      return ApiResponse.badRequest('Organization ID required');
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const optionsJson = formData.get('options') as string;

    if (!file) {
      return ApiResponse.badRequest('No file provided');
    }

    // Validate file size (50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      return ApiResponse.error('File too large. Maximum size is 50MB', 'FILE_TOO_LARGE', 413);
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      return ApiResponse.badRequest('Unsupported file type. Supported: PDF, DOCX, XLSX, CSV, TXT, Images');
    }

    // Parse and validate options
    let options: ProcessingOptions;
    try {
      const parsedOptions = optionsJson ? JSON.parse(optionsJson) : {};
      const validatedOptions = uploadSchema.parse(parsedOptions);
      
      options = {
        ...validatedOptions,
        organizationId,
        userId: session.user.id,
      };
    } catch (error) {
      return ApiResponse.badRequest('Invalid options format');
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload file to Supabase Storage
    const fileExtension = file.name.split('.').pop() || 'bin';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const storagePath = `documents/${organizationId}/${fileName}`;

    const { data: storageData, error: storageError } = await supabase.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (storageError) {
      console.error('Storage upload error:', storageError);
      return NextResponse.json({ 
        error: 'Failed to upload file' 
      }, { status: 500 });
    }

    // Get public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath);

    // Process document (extract text, generate embeddings, etc.)
    const processingStartTime = Date.now();
    const processingResult = await documentProcessor.processDocument(buffer, file.name, options);
    const processingTime = Date.now() - processingStartTime;

    if (!processingResult.success) {
      // Clean up uploaded file if processing failed
      await supabase.storage.from('documents').remove([storagePath]);
      
      return NextResponse.json({ 
        error: processingResult.error || 'Document processing failed' 
      }, { status: 500 });
    }

    // Return processing results
    return NextResponse.json({
      success: true,
      documentId: processingResult.documentId,
      fileName: file.name,
      fileSize: file.size,
      textLength: processingResult.textLength,
      chunks: processingResult.chunks,
      processingTime,
      storageUrl: publicUrlData.publicUrl,
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const fileType = searchParams.get('fileType');
    const category = searchParams.get('category');

    // Build query conditions
    const conditions = [eq(documentsTable.organizationId, organizationId)];
    
    if (status) {
      conditions.push(eq(documentsTable.status, status));
    }
    if (fileType) {
      conditions.push(eq(documentsTable.fileType, fileType));
    }
    if (category) {
      conditions.push(eq(documentsTable.category, category));
    }

    let documents;
    try {
      documents = await db
        .select({
          id: documentsTable.id,
          title: documentsTable.title,
          file_name: documentsTable.fileName,
          file_type: documentsTable.fileType,
          file_size: documentsTable.fileSize,
          status: documentsTable.status,
          category: documentsTable.category,
          tags: documentsTable.tags,
          text_length: documentsTable.textLength,
          created_at: documentsTable.createdAt,
          updated_at: documentsTable.updatedAt,
          processed_at: documentsTable.processedAt,
        })
        .from(documentsTable)
        .where(and(...conditions))
        .orderBy(desc(documentsTable.createdAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      console.error('Database error:', error);
      return ApiResponse.error('Failed to fetch documents');
    }

    return NextResponse.json({
      documents,
      pagination: {
        limit,
        offset,
        hasMore: documents.length === limit,
      },
    });
  });
});