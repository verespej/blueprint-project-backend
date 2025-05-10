import { sql } from 'drizzle-orm';
import { text } from "drizzle-orm/sqlite-core";

export function timestampStr(): string {
  const timestamp = new Date();
  return timestamp.toISOString();
}

export function createdAtFieldSchema(name?: string | object, options?: object) {
  if (typeof name === 'object') {
    name = undefined;
    options = name;
  }
  name = name ?? 'created_at';
  return text(name, options).notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`);
}

export function updatedAtFieldSchema(name?: string | object, options?: object) {
  if (typeof name === 'object') {
    name = undefined;
    options = name;
  }
  name = name ?? 'updated_at';
  return text(name, options).notNull().$onUpdate(() => timestampStr());
}

export const timestampFieldsSchemas = {
  createdAt: createdAtFieldSchema(),
  updatedAt: updatedAtFieldSchema(),
};
