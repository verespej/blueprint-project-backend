import { sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

import { idFieldSchema } from './common/id-fields';
import { timestampFieldsSchemas } from './common/timestamp-fields';

/* Users table
 *
 * User accounts for providers and patients.
 *
 * Fields:
 *
 *  id: TA unique ID identifying the record. Text formatted as a UUIDv4.
 *
 *  type: The type of account. Text equal to "provider" or "patient".
 *
 *  givenName: User's given name (i.e. first name or first names). Text.
 *  familyName: User's family name (i.e. last name). Text.
 *
 *  email: The email of the account owner. Text formatted as an email.
 *  password: The password for the account. Text.
 *
 *  createdAt: When this record was created. Text formatted as an ISO8601 string.
 *  updatedAt: When this record was last udpated. Text formatted as an ISO8601 string.
 *
 */

export const usersTable = sqliteTable('users', {
  id: idFieldSchema().notNull().primaryKey(),

  type: text().notNull(),

  givenName: text('given_name').notNull(),
  familyName: text('family_name').notNull(),

  // Note: A couple comments on decisions made for scoping purposes:
  // 1. I'm aware that storing auth data like this isn't safe.
  // 2. I'm aware that people sometimes share email addresses.
  email: text().notNull(),
  password: text().notNull(),

  ...timestampFieldsSchemas,
}, (table) => {
  return {
    emailUniqIdx: unique('users_email_uniq_idx').on(table.email),
  };
});

export const USER_TYPES = {
  PATIENT: 'patient',
  PROVIDER: 'provider',
} as const;

export type TypUserType = typeof USER_TYPES[
  keyof typeof USER_TYPES
];

export type TypUser = {
  id: string;

  type: TypUserType;
  givenName: string;
  familyName: string;

  email: string;
  password: string;

  createdAt: string;
  updatedAt: string;
};
