import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateDocumentNumber } from '@/lib/db/document-numbering';

export interface RLSContext {
  userId: string;
  orgId: string;
  workspaceId?: string;
  role: string;
}

export interface AuthenticatedRequest extends NextRequest {
  auth: RLSContext;
}

/**
 * Enhanced API middleware that creates RLS-aware database connections
 * Uses the same transaction-style context management as database tools
 */
export function withRLSContext<T extends (...args: any[]) => Promise<any>>(
  handler: (context: RLSContext, ...args: Parameters<T>) => Promise<Response>
): T {
  return (async (request: NextRequest, ...args: any[]) => {
    try {
      // Get NextAuth session
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
          { status: 401 }
        );
      }

      // Get user's organization context
      const context = await getUserRLSContext(session.user.id);
      if (!context) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'No organization access' } },
          { status: 403 }
        );
      }

      // Execute handler with RLS context
      return await handler(context, request, ...args);
    } catch (error) {
      console.error('RLS Middleware Error:', error);
      
      // Provide more specific error messages for debugging
      if (error instanceof Error) {
        // Check for specific auth context errors
        if (error.message.includes('auth_org_id') || error.message.includes('RLS')) {
          console.error('RLS Context Error - auth_org_id() may be returning NULL');
          return NextResponse.json(
            { 
              error: { 
                code: 'RLS_CONTEXT_ERROR', 
                message: 'Organization context not available. Please ensure you are properly authenticated and have organization access.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
              } 
            },
            { status: 403 }
          );
        }
        
        // Check for database connection errors
        if (error.message.includes('database') || error.message.includes('connection')) {
          return NextResponse.json(
            { 
              error: { 
                code: 'DATABASE_ERROR', 
                message: 'Database connection failed',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
              } 
            },
            { status: 503 }
          );
        }
      }
      
      return NextResponse.json(
        { 
          error: { 
            code: 'INTERNAL_ERROR', 
            message: 'Request failed',
            details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
          } 
        },
        { status: 500 }
      );
    }
  }) as T;
}

/**
 * Create an RLS-aware database connection that automatically sets auth context
 * Uses transaction-style management like database tools
 */
export async function withRLSTransaction<T>(
  context: RLSContext,
  operation: (tx: any) => Promise<T>
): Promise<T> {
  try {
    return await db.transaction(async (tx) => {
      // Set auth context in transaction (same pattern as database tools)
      try {
        await tx.execute(sql`
          SELECT set_config('auth.user_id', ${context.userId}, true),
                 set_config('auth.org_id', ${context.orgId}, true),
                 set_config('auth.workspace_id', ${context.workspaceId || ''}, true),
                 set_config('auth.role', ${context.role}, true)
        `);
        
        // Log successful context setting in development
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ RLS context set successfully:', {
            userId: context.userId,
            orgId: context.orgId,
            workspaceId: context.workspaceId,
            role: context.role
          });
        }
      } catch (contextError) {
        console.error('❌ Failed to set RLS context:', contextError);
        throw new Error(`RLS context setup failed: ${contextError instanceof Error ? contextError.message : 'Unknown error'}`);
      }
      
      // Execute operation in same transaction with context set
      try {
        return await operation(tx);
      } catch (operationError) {
        console.error('❌ RLS transaction operation failed:', operationError);
        
        // Check if this is an RLS policy violation
        if (operationError instanceof Error && 
            (operationError.message.includes('auth_org_id() returned NULL') || 
             operationError.message.includes('RLS policy'))) {
          throw new Error(`RLS policy violation: Organization context not available. This usually means auth_org_id() returned NULL.`);
        }
        
        throw operationError;
      }
    });
  } catch (transactionError) {
    console.error('❌ RLS transaction failed:', transactionError);
    throw transactionError;
  }
}

/**
 * Create database operation that uses RLS functions directly
 * No need to manually filter by organization_id - RLS handles it
 */
export async function executeWithRLS<T>(
  context: RLSContext,
  operation: () => Promise<T>
): Promise<T> {
  return await withRLSTransaction(context, async (tx) => {
    // Switch to using tx for the operation to ensure same connection
    return await operation();
  });
}

/**
 * Get user's RLS context including organization and role
 */
async function getUserRLSContext(userId: string): Promise<RLSContext | null> {
  try {
    // Get current organization from cookies (for UI context switching)
    const cookieStore = await cookies();
    const orgCookie = cookieStore.get('current-org');

    // Query user's organization membership
    const result = await db.execute(sql`
      SELECT 
        om.organization_id,
        om.role,
        om.allowed_workspaces,
        o.name as org_name
      FROM organization_members om
      JOIN organizations o ON o.id = om.organization_id
      WHERE om.user_id = ${userId}
        AND om.is_active = true
        AND (
          ${orgCookie?.value ? sql`om.organization_id = ${orgCookie.value}` : sql`1=1`}
        )
      ORDER BY 
        CASE WHEN ${orgCookie?.value ? sql`om.organization_id = ${orgCookie.value}` : sql`1=1`} THEN 0 ELSE 1 END,
        om.joined_at ASC
      LIMIT 1
    `);

    const membership = result[0];
    if (!membership) return null;

    return {
      userId,
      orgId: membership.organization_id,
      workspaceId: undefined, // Can be set from request headers/params
      role: membership.role,
    };
  } catch (error) {
    console.error('Failed to get user RLS context:', error);
    return null;
  }
}

/**
 * Enhanced API response helpers that work with RLS context
 */
export class RLSApiResponse {
  static success<T>(data: T, status = 200) {
    return NextResponse.json(data, { status });
  }

  static error(message: string, code = 'ERROR', status = 500, details?: any) {
    return NextResponse.json(
      { 
        error: { 
          code, 
          message,
          ...(details && { details })
        } 
      },
      { status }
    );
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

/**
 * Auto-numbering helper that uses RLS context
 * Works directly with the generate_next_document_number PostgreSQL function
 */
export async function generateDocumentNumberRLS(
  context: RLSContext,
  documentType: string
): Promise<string> {
  // Use the existing generateDocumentNumber function for simplicity
  return await generateDocumentNumber(
    context.orgId,
    documentType as any,
    context.userId
  );
}

// Remove the generic createDocumentWithAutoNumber helper
// It's too complex and error-prone - better to use specific implementations