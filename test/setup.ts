import { resolve } from 'path';

import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

// Env var import MUST come BEFORE other local imports.
import '#config/env';

import { db, MIGRATIONS_TABLE_NAME } from '#src/db';

const migrationsFolder = resolve(__dirname, '../src/db/migrations');
migrate(db, { migrationsFolder, migrationsTable: MIGRATIONS_TABLE_NAME });
