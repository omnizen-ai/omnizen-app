#!/bin/bash

# Reset database with correct migration order
# 1. Reset Supabase (with minimal migrations)
# 2. Run Drizzle migrations to create tables
# 3. Apply Supabase migrations that depend on tables

set -e

echo "🔄 Resetting database with correct migration order..."

# Backup current Supabase migrations
if [ -d "supabase/migrations" ]; then
  echo "📦 Backing up Supabase migrations..."
  mv supabase/migrations supabase/migrations.backup
fi

# Create empty migrations folder
mkdir -p supabase/migrations

# Step 1: Reset Supabase with empty migrations
echo "🏗️  Resetting Supabase database..."
supabase db reset --local

# Step 2: Run Drizzle migrations to create all tables
echo "📊 Running Drizzle migrations..."
pnpm db:migrate

# Step 3: Restore and apply Supabase migrations
echo "🔙 Restoring Supabase migrations..."
rm -rf supabase/migrations
mv supabase/migrations.backup supabase/migrations

echo "📝 Applying Supabase migrations..."
pnpm supabase:migrate:local

echo "✅ Database reset completed with correct migration order!"