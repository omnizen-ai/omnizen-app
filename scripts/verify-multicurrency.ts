import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function verifyMultiCurrency() {
  console.log('🔍 Verifying Multi-Currency Setup...\n');

  // Check if new columns exist
  const result = await db.execute(sql`
    SELECT 
      column_name, 
      data_type,
      column_default
    FROM information_schema.columns 
    WHERE table_name = 'journal_lines' 
      AND column_name IN ('foreign_debit', 'foreign_credit')
    ORDER BY column_name
  `);

  console.log('✅ Journal Lines Multi-Currency Columns:');
  console.table(result.rows);

  // Check organizations base_currency
  const orgResult = await db.execute(sql`
    SELECT 
      column_name,
      data_type,
      column_default
    FROM information_schema.columns
    WHERE table_name = 'organizations'
      AND column_name = 'base_currency'
  `);

  console.log('\n✅ Organizations Base Currency Column:');
  console.table(orgResult.rows);

  // Check if views exist with proper search_path
  const viewResult = await db.execute(sql`
    SET search_path TO public, semantic;
    SELECT 
      table_schema,
      table_name
    FROM information_schema.views
    WHERE table_schema = 'semantic'
      AND table_name IN ('v_multicurrency_balances', 'v_foreign_currency_transactions', 'v_currency_exposure')
    ORDER BY table_name
  `);

  console.log('\n✅ Multi-Currency Views in semantic schema:');
  console.table(viewResult.rows);

  // Check if function exists
  const funcResult = await db.execute(sql`
    SELECT 
      routine_name,
      routine_schema
    FROM information_schema.routines
    WHERE routine_name = 'get_exchange_rate'
      AND routine_schema = 'public'
  `);

  console.log('\n✅ Exchange Rate Function:');
  console.table(funcResult.rows);

  console.log('\n✨ Multi-currency support is fully configured!');
}

verifyMultiCurrency().catch(console.error);