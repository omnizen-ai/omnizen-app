# Supabase Migration Plan

## Overview
Atomic migration from current setup to Supabase while:
- Keeping Drizzle ORM for database operations
- Using Supabase for authentication
- Using Supabase for file storage
- Maintaining backward compatibility during migration

## Migration Phases

### Phase 1: Database Migration ✅ Ready to Start
**Goal**: Connect Drizzle to Supabase PostgreSQL

1. Update database connection
2. Run existing migrations on Supabase
3. Test all database queries
4. Verify data persistence

### Phase 2: Authentication Migration
**Goal**: Replace NextAuth with Supabase Auth

1. Create Supabase auth utilities
2. Build auth adapter layer
3. Migrate session management
4. Update protected routes
5. Test auth flows

### Phase 3: Storage Migration
**Goal**: Replace Vercel Blob with Supabase Storage

1. Setup storage buckets
2. Create storage utilities
3. Migrate file upload logic
4. Update file retrieval
5. Test file operations

### Phase 4: Cleanup
**Goal**: Remove old dependencies and code

1. Remove NextAuth dependencies
2. Remove Vercel Blob code
3. Update environment variables
4. Final testing

## Testing Strategy

Each phase will have:
- Unit tests for new utilities
- Integration tests for migrated features
- Rollback procedures if needed
- Feature flags for gradual rollout

## Current State
- ✅ Supabase local instance running
- ✅ Packages installed (@supabase/ssr, @supabase/supabase-js)
- ⏳ Ready to start Phase 1

## Next Steps
1. Start with Phase 1 (Database)
2. Test thoroughly before moving to Phase 2
3. Keep old code working during migration
4. Use feature flags for production rollout