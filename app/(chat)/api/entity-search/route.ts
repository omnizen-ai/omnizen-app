import { NextRequest, NextResponse } from 'next/server';
import { searchEntities, getAvailableEntityTypes, type UserContext } from '@/lib/db/entity-search';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get('entityType');
    const searchTerm = searchParams.get('searchTerm');
    const limit = parseInt(searchParams.get('limit') || '10');

    // For now, use mock user context until we have proper auth
    // In production, this would come from the authenticated session
    const mockUserContext: UserContext = {
      userId: 'demo-user',
      orgId: 'demo-org', 
      workspaceId: 'demo-workspace',
      role: 'admin'
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

    const results = await searchEntities(entityType, searchTerm, mockUserContext, limit);
    
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

    // Mock user context
    const mockUserContext: UserContext = {
      userId: 'demo-user',
      orgId: 'demo-org',
      workspaceId: 'demo-workspace', 
      role: 'admin'
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
      const results = await searchEntities(entityType, searchTerm, mockUserContext, limit);
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