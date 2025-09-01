import { createClient } from '@supabase/supabase-js';
import { auth } from '@/app/(auth)/auth';
import { cookies } from 'next/headers';
import type { Session } from 'next-auth';
import type { Database } from '@/lib/supabase/types';

// Types
interface SupabaseAuthContext {
  userId: string;
  organizationId: string;
  workspaceId?: string;
  permissions: string[];
  role: string;
}

interface BridgedSession extends Session {
  supabaseToken?: string;
  organizationId?: string;
  workspaceId?: string;
}

/**
 * Authentication Bridge
 * Synchronizes NextAuth sessions with Supabase for RLS and API access
 */
export class AuthBridge {
  private static instance: AuthBridge;
  private supabaseAdmin: ReturnType<typeof createClient<Database>>;

  private constructor() {
    // Initialize Supabase Admin client for service role operations
    this.supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  static getInstance(): AuthBridge {
    if (!AuthBridge.instance) {
      AuthBridge.instance = new AuthBridge();
    }
    return AuthBridge.instance;
  }

  /**
   * Generate a Supabase-compatible JWT from NextAuth session
   */
  async generateSupabaseToken(session: Session): Promise<string> {
    if (!session.user?.id) {
      throw new Error('No user ID in session');
    }

    // Get user's organization and permissions from database
    const { data: memberData } = await this.supabaseAdmin
      .from('organization_members')
      .select('organization_id, role, permissions, allowed_workspaces')
      .eq('user_id', session.user.id)
      .single();

    if (!memberData) {
      throw new Error('User not associated with any organization');
    }

    // Create custom JWT claims for Supabase RLS
    const claims = {
      sub: session.user.id,
      email: session.user.email,
      org_id: memberData.organization_id,
      role: memberData.role,
      permissions: memberData.permissions || {},
      allowed_workspaces: memberData.allowed_workspaces,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
    };

    // Sign the token using Supabase's JWT secret
    const jwt = await this.signJWT(claims);
    return jwt;
  }

  /**
   * Sign a JWT with Supabase's secret
   */
  private async signJWT(payload: any): Promise<string> {
    // In production, use a proper JWT library like jose
    const { SignJWT } = await import('jose');
    const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!);
    
    const jwt = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);
    
    return jwt;
  }

  /**
   * Create a Supabase client with NextAuth session context
   */
  async createAuthenticatedClient(session?: Session | null) {
    const currentSession = session || await auth();
    
    if (!currentSession) {
      throw new Error('No authenticated session');
    }

    // Generate Supabase token from NextAuth session
    const supabaseToken = await this.generateSupabaseToken(currentSession);

    // Create client with custom auth
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${supabaseToken}`,
          },
        },
        auth: {
          persistSession: false,
        },
      }
    );

    return supabase;
  }

  /**
   * Set RLS context for the current database session
   */
  async setRLSContext(
    supabase: ReturnType<typeof createClient<Database>>,
    context: SupabaseAuthContext
  ) {
    // Set the organization context for RLS
    const { error: orgError } = await supabase.rpc('set_auth_context', {
      p_user_id: context.userId,
      p_org_id: context.organizationId,
      p_workspace_id: context.workspaceId,
      p_role: context.role,
    });

    if (orgError) {
      throw new Error(`Failed to set RLS context: ${orgError.message}`);
    }

    return true;
  }

  /**
   * Create user in Supabase auth.users during signup
   * This is a one-time operation when a new user registers
   */
  async createSupabaseAuthUser(user: { id: string; email: string; name?: string | null }) {
    // Only create if we have valid user data
    if (!user?.id || !user?.email) {
      console.warn('Cannot create Supabase auth user: Invalid user data');
      return;
    }

    try {
      // Check if user already exists in Supabase auth.users
      const { data: existingAuthUser } = await this.supabaseAdmin.auth.admin.getUserById(user.id);
      
      if (!existingAuthUser?.user) {
        // Create user in Supabase auth system
        const { data: authUser, error: authError } = await this.supabaseAdmin.auth.admin.createUser({
          email: user.email,
          email_confirm: true, // Auto-confirm since they're coming from NextAuth
          user_metadata: {
            name: user.name,
            provider: 'nextauth',
          },
        });

        if (authError) {
          console.error('Failed to create Supabase auth user:', authError);
          return;
        }

        console.log('Created Supabase auth user:', authUser.user?.id);
      }

      // Also ensure user exists in public.User table for application data
      const { data: existingUser } = await this.supabaseAdmin
        .from('User')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingUser) {
        const { error } = await this.supabaseAdmin
          .from('User')
          .insert({
            id: user.id,
            email: user.email,
            name: user.name || null,
          });

        if (error) {
          console.error('Failed to create user in public.User table:', error);
        }
      }
    } catch (error) {
      console.error('Error in createSupabaseAuthUser:', error);
    }
  }

  /**
   * Update user's last active timestamp on login
   */
  async updateLastActive(userId: string) {
    if (!userId) return;

    await this.supabaseAdmin
      .from('User')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', userId);
  }

  /**
   * Get current user's organization context
   */
  async getCurrentContext(session?: Session | null): Promise<SupabaseAuthContext | null> {
    const currentSession = session || await auth();
    
    if (!currentSession?.user?.id) {
      return null;
    }

    // Get current organization from user preferences or cookies
    const cookieStore = await cookies();
    const orgCookie = cookieStore.get('current-org');
    
    const { data } = await this.supabaseAdmin
      .from('organization_members')
      .select(`
        organization_id,
        role,
        permissions,
        allowed_workspaces
      `)
      .eq('user_id', currentSession.user.id)
      .eq('is_active', true)
      .single();

    if (!data) {
      return null;
    }

    return {
      userId: currentSession.user.id,
      organizationId: orgCookie?.value || data.organization_id,
      workspaceId: undefined, // Can be set from UI
      permissions: Object.keys(data.permissions || {}),
      role: data.role,
    };
  }

  /**
   * Middleware to ensure both auth systems are in sync
   */
  async ensureAuthenticated(request: Request) {
    // Check NextAuth session
    const session = await auth();
    
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Create authenticated Supabase client
    try {
      const supabase = await this.createAuthenticatedClient(session);
      const context = await this.getCurrentContext(session);
      
      if (context) {
        await this.setRLSContext(supabase, context);
      }
      
      return { session, supabase, context };
    } catch (error) {
      console.error('Auth bridge error:', error);
      return new Response('Authentication failed', { status: 401 });
    }
  }
}

/**
 * Singleton instance
 */
export const authBridge = AuthBridge.getInstance();

/**
 * Hook for client components
 */
export function useAuthBridge() {
  // This would be implemented as a React hook for client components
  // using NextAuth's useSession and Supabase client
  throw new Error('Client-side implementation needed');
}

/**
 * Server-side helper to get authenticated Supabase client
 */
export async function getAuthenticatedSupabase() {
  const session = await auth();
  if (!session) {
    throw new Error('No authenticated session');
  }
  
  return authBridge.createAuthenticatedClient(session);
}

/**
 * Database function to set auth context (needs to be created in Supabase)
 */
export const SET_AUTH_CONTEXT_SQL = `
CREATE OR REPLACE FUNCTION set_auth_context(
  p_user_id UUID,
  p_org_id UUID,
  p_workspace_id UUID DEFAULT NULL,
  p_role TEXT DEFAULT 'employee'
) RETURNS void AS $$
BEGIN
  -- Set session variables for RLS
  PERFORM set_config('auth.user_id', p_user_id::text, true);
  PERFORM set_config('auth.org_id', p_org_id::text, true);
  PERFORM set_config('auth.workspace_id', COALESCE(p_workspace_id::text, ''), true);
  PERFORM set_config('auth.role', p_role, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function for RLS policies
CREATE OR REPLACE FUNCTION auth_org_id() RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('auth.org_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION auth_user_id() RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('auth.user_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION auth_workspace_id() RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(current_setting('auth.workspace_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION auth_role() RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('auth.role', true);
END;
$$ LANGUAGE plpgsql STABLE;
`;