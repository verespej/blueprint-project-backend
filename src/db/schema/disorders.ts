import { sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

import { idFieldSchema } from './common/id-fields';
import { timestampFieldsSchemas } from './common/timestamp-fields';

/* Disorders table
 *
 * Details for disorders.
 *
 * Fields:
 *
 *  id: A unique ID identifying the record. Text formatted as a UUIDv4.
 *
 *  name: The name of the disorder. Text.
 *  displayName: The display name of the disorder. Text.
 *
 *  createdAt: When this record was created. Text formatted as an ISO8601 string.
 *  updatedAt: When this record was last udpated. Text formatted as an ISO8601 string.
 *
 */

export const disordersTable = sqliteTable('disorders', {
  id: idFieldSchema().notNull().primaryKey(),

  name: text().notNull(),
  displayName: text('display_name'),

  ...timestampFieldsSchemas,
}, (table) => {
  return {
    uniqueNameIdx: unique('disorders_name_uniq_idx').on(table.name),
  };
});

export type TypDisorder = {
  id: string;

  name: string;
  displayName?: string | null;

  createdAt: string;
  updatedAt: string;
};
