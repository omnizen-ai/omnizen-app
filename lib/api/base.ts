import { auth } from '@/app/(auth)/auth';
import { NextResponse } from 'next/server';

export type ApiError = {
  code: string;
  message: string;
  details?: any;
};

export class ApiResponse {
  static success<T>(data: T, status = 200) {
    return NextResponse.json(data, { status });
  }

  static error(message: string, code = 'ERROR', status = 500, details?: any) {
    const error: ApiError = {
      code,
      message,
      ...(details && { details }),
    };
    return NextResponse.json({ error }, { status });
  }

  static unauthorized(message = 'Unauthorized') {
    return this.error(message, 'UNAUTHORIZED', 401);
  }

  static forbidden(message = 'Forbidden') {
    return this.error(message, 'FORBIDDEN', 403);
  }

  static notFound(message = 'Not found') {
    return this.error(message, 'NOT_FOUND', 404);
  }

  static badRequest(message = 'Bad request', details?: any) {
    return this.error(message, 'BAD_REQUEST', 400, details);
  }
}

export async function withAuth<T>(
  handler: (session: any) => Promise<T>
): Promise<T | NextResponse> {
  const session = await auth();
  
  if (!session?.user) {
    return ApiResponse.unauthorized() as any;
  }
  
  return handler(session);
}

export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API Error:', error);
      
      if (error instanceof Error) {
        return ApiResponse.error(error.message);
      }
      
      return ApiResponse.error('An unexpected error occurred');
    }
  }) as T;
}