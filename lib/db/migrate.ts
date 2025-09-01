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
    // Create schemas first
    await connection`CREATE SCHEMA IF NOT EXISTS core`;
    await connection`CREATE SCHEMA IF NOT EXISTS finance`;
    await connection`CREATE SCHEMA IF NOT EXISTS ai`;
    await connection`CREATE SCHEMA IF NOT EXISTS semantic`;
    console.log('✅ Schemas created/verified');
    
    // Set search path
    await connection`SET search_path TO public, core, finance, ai, semantic`;
    
    // Run Drizzle migrations
    await migrate(db, { migrationsFolder: './lib/db/migrations' });
    
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
  
  const end = Date.now();

  console.log('✅ Migrations completed in', end - start, 'ms');
  
  await connection.end();
  process.exit(0);
};

runMigrate().catch((err) => {
  console.error('❌ Migration failed');
  console.error(err);
  process.exit(1);
});
