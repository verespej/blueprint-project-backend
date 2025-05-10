// These configs are for drizzle-kit. It doesn't affect the drizzle module's
// behavior in the app. Thus, it's mostly just used for generating and running
// migrations.

import fs from 'fs';
import path from 'path';

import { defineConfig } from 'drizzle-kit';

const dbPath = path.resolve('.local_data/db.sqlite3');
const dbDirPath = path.dirname(dbPath);
if (!fs.existsSync(dbDirPath)) {
  fs.mkdirSync(dbDirPath, { recursive: true });
}

export default defineConfig({
  dialect: "sqlite",
  dbCredentials: { // local
    url: dbPath,
  },
  migrations: {
    table: 'migrations',
  },
  out: './src/db/migrations',
  schema: './src/db/schema',
});
