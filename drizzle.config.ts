// These configs are for drizzle-kit. It doesn't affect the drizzle module's
// behavior in the running app. It's mostly just used for generating and
// running migrations.

import { defineConfig } from 'drizzle-kit';

import '#config/env';

import { MIGRATIONS_TABLE_NAME } from '#src/db/constants';

if (!process.env.DB_URL || process.env.DB_URL.length < 1) {
  throw new Error('DB_URL env var is required');
}

export default defineConfig({
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DB_URL,
  },
  migrations: {
    table: MIGRATIONS_TABLE_NAME,
  },
  out: './src/db/migrations',
  schema: './src/db/schema',
});
