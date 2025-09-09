import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { searchEntities, getAvailableEntityTypes, type UserContext } from '@/lib/db/entity-search';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get('entityType');
    const searchTerm = searchParams.get('searchTerm');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get authenticated session
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Use session data for user context (RLS will handle filtering)
    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID not found in session' },
        { status: 400 }
      );
    }

    const userContext: UserContext = {
      userId: session.user.id,
      orgId: organizationId,
      workspaceId: session.user.workspaceId,
      role: session.user.role || 'user'
    };

    if (entityType === 'types') {
      // Return available entity types
      const entityTypes = getAvailableEntityTypes();
      return NextResponse.json({ success: true, data: entityTypes });
    }

    if (!entityType || !searchTerm) {
      return NextResponse.json(
        { success: false, error: 'entityType and searchTerm are required' },
        { status: 400 }
      );
    }

    const results = await searchEntities(entityType, searchTerm, userContext, limit);
    
    return NextResponse.json({
      success: true,
      data: results,
      count: results.length
    });

  } catch (error) {
    console.error('[EntitySearch API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Search failed' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { entityTypes, searchTerm, limit = 10 } = await request.json();

    // Get authenticated session
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Use session data for user context (RLS will handle filtering)
    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID not found in session' },
        { status: 400 }
      );
    }

    const userContext: UserContext = {
      userId: session.user.id,
      orgId: organizationId,
      workspaceId: session.user.workspaceId,
      role: session.user.role || 'user'
    };

    if (!entityTypes || !searchTerm) {
      return NextResponse.json(
        { success: false, error: 'entityTypes and searchTerm are required' },
        { status: 400 }
      );
    }

    // Search multiple entity types
    const allResults = [];
    for (const entityType of entityTypes) {
      const results = await searchEntities(entityType, searchTerm, userContext, limit);
      allResults.push(...results.map(r => ({ ...r, entityType })));
    }

    return NextResponse.json({
      success: true,
      data: allResults,
      count: allResults.length
    });

  } catch (error) {
    console.error('[EntitySearch API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Search failed' 
      },
      { status: 500 }
    );
  }
}