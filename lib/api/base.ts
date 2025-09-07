import { auth } from '@/app/(auth)/auth';
import { NextResponse } from 'next/server';
import { withRLSContext, RLSContext, RLSApiResponse, withRLSTransaction } from './rls-middleware';

export type ApiError = {
  code: string;
  message: string;
  details?: any;
};

// Export RLS-enhanced response class as the main ApiResponse
export const ApiResponse = RLSApiResponse;

// Export RLS types for external use
export type { RLSContext };
export { withRLSTransaction };

/**
 * Legacy auth wrapper for backward compatibility
 * @deprecated Use withRLSContext instead for new APIs
 */
export async function withAuth<T>(
  handler: (session: any) => Promise<T>
): Promise<T | NextResponse> {
  const session = await auth();
  
  if (!session?.user) {
    return ApiResponse.unauthorized() as any;
  }
  
  return handler(session);
}

/**
 * Enhanced auth wrapper that provides RLS context
 * Use this for new APIs that need database access
 */
export const withRLS = withRLSContext;

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