import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({
  path: '.env.local',
});

export default defineConfig({
  schema: [
    './lib/db/schema.ts', // Legacy schema for backward compatibility
    './lib/db/schema/core/*.ts',
    './lib/db/schema/finance/*.ts',
    './lib/db/schema/ai/*.ts',
    './lib/db/schema/erp/*.ts',
    './lib/db/schema/semantic/*.ts',
    './lib/db/schema/personal/*.ts',
  ],
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // biome-ignore lint: Forbidden non-null assertion.
    url: process.env.POSTGRES_URL!,
  },
  tablesFilter: ['*'],
  verbose: true,
  strict: true,
});
