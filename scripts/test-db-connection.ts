/**
 * Simple database connection test
 */

import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

console.log('🔍 Testing Database Connection...\n');

async function testConnection() {
  try {
    console.log('Environment variables:');
    console.log('POSTGRES_URL:', process.env.POSTGRES_URL ? 'SET' : 'NOT SET');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
    console.log('');

    console.log('Testing basic query...');
    const result = await db.execute(sql`SELECT current_user, current_database(), version() as pg_version`);
    
    console.log('✅ Database connection successful!');
    console.log('Current user:', (result[0] as any)?.current_user);
    console.log('Current database:', (result[0] as any)?.current_database);
    console.log('PostgreSQL version:', (result[0] as any)?.pg_version?.substring(0, 50) + '...');

    // Test table existence
    console.log('\nTesting table existence...');
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('contacts', 'products', 'invoices')
      ORDER BY table_name
    `);
    
    console.log('Available tables:', Array.isArray(tables) ? tables.map((t: any) => t.table_name) : []);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Full error:', error);
    return false;
  }
}

testConnection().then(success => {
  console.log(`\n🎯 Result: ${success ? 'SUCCESS' : 'FAILED'}`);
  process.exit(success ? 0 : 1);
});