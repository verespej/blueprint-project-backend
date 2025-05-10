import { text } from "drizzle-orm/sqlite-core";
import { v4 as uuid } from 'uuid';

export function generateId() {
  return uuid();
}

export function idFieldSchema(name?: string | object, options?: object) {
  if (typeof name === 'object') {
    name = undefined;
    options = name;
  }
  return text(name || '', { length: 36, ...options }).$defaultFn(() => generateId());
}
