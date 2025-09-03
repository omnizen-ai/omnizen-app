import { NextRequest, NextResponse } from 'next/server';
import { withAuth, withErrorHandler, ApiResponse } from '@/lib/api/base';
import { bankingStatementProcessor, type StatementParsingResult } from '@/lib/ai/banking-statement-processor';
import { z } from 'zod';

const processStatementSchema = z.object({
  bankAccountId: z.string().uuid().optional(),
  autoCreateTransactions: z.boolean().optional().default(false),
  autoMatchContacts: z.boolean().optional().default(true),
  confidenceThreshold: z.number().min(0).max(1).optional().default(0.7),
  validateBalances: z.boolean().optional().default(true),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  return withAuth(async (session) => {
    const organizationId = session.user?.organizationId || '11111111-1111-1111-1111-111111111111';

    try {
      // Parse multipart form data
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const optionsJson = formData.get('options') as string;

      if (!file) {
        return ApiResponse.badRequest('No file provided');
      }

      // Validate file type (PDF only for now)
      if (file.type !== 'application/pdf') {
        return ApiResponse.badRequest('Only PDF files are supported for statement processing');
      }

      // Validate file size (10MB limit)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_FILE_SIZE) {
        return ApiResponse.error('File too large. Maximum size is 10MB', 'FILE_TOO_LARGE', 413);
      }

      // Parse and validate options
      let options: any;
      try {
        const parsedOptions = optionsJson ? JSON.parse(optionsJson) : {};
        options = processStatementSchema.parse(parsedOptions);
      } catch (error) {
        return ApiResponse.badRequest('Invalid options format', error instanceof z.ZodError ? error.errors : undefined);
      }

      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Process the statement
      console.log(`Processing banking statement: ${file.name} (${file.size} bytes)`);
      const result = await bankingStatementProcessor.processStatement(
        organizationId,
        buffer,
        file.name,
        options
      );

      if (!result.success) {
        return ApiResponse.error(result.error || 'Statement processing failed');
      }

      // Return processing results
      return NextResponse.json({
        success: true,
        data: {
          ...result,
          fileName: file.name,
          fileSize: file.size,
          processedBy: session.user.id,
          processedAt: new Date().toISOString(),
        }
      });

    } catch (error) {
      console.error('Statement processing error:', error);
      return ApiResponse.error(error instanceof Error ? error.message : 'Internal server error');
    }
  });
});