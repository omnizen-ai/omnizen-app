import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

config({
  path: '.env.local',
});

const runMigrate = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined');
  }

  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
  const db = drizzle(connection);

  console.log('⏳ Running migrations...');

  const start = Date.now();
  
  try {
    // Step 1: Create schemas first (required for tables and views)
    console.log('📁 Creating schemas...');
    await connection`CREATE SCHEMA IF NOT EXISTS core`;
    await connection`CREATE SCHEMA IF NOT EXISTS finance`;
    await connection`CREATE SCHEMA IF NOT EXISTS ai`;
    await connection`CREATE SCHEMA IF NOT EXISTS semantic`;
    console.log('✅ Schemas created/verified');
    
    // Step 2: Set search path for migrations
    await connection`SET search_path TO public, core, finance, ai, semantic`;
    
    // Step 3: Run Drizzle migrations (tables, columns, indexes only)
    console.log('📊 Creating tables...');
    await migrate(db, { migrationsFolder: './lib/db/migrations' });
    console.log('✅ Tables created');
    
    // Step 4: Note about Supabase migrations
    console.log('');
    console.log('ℹ️  Tables and schemas are ready.');
    console.log('📝 To complete setup with RLS and views, run:');
    console.log('   pnpm supabase:migrate:local  (for local dev)');
    console.log('   pnpm supabase:migrate:prod   (for production)');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
  
  const end = Date.now();

  console.log('');
  console.log('✅ Database schema migrations completed in', end - start, 'ms');
  
  await connection.end();
  process.exit(0);
};

runMigrate().catch((err) => {
  console.error('❌ Migration failed');
  console.error(err);
  process.exit(1);
});
