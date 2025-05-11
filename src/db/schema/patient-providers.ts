import { InferModel } from 'drizzle-orm';
import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { idFieldSchema } from './common/id-fields';
import { timestampFieldsSchemas } from './common/timestamp-fields';
import { usersTable } from './users';

/* Patient-providers table
 *
 * Connection establishing a user (patient) as a patient of another user (provider).
 *
 * Fields:
 *
 *  id: A unique ID identifying the record. Text formatted as a UUIDv4.
 *
 *  patientId: The ID of the user who's a patient of the provider. Text reference to a user ID.
 *  providerId: The ID of the user who's the provider. Text reference to a user ID.
 *
 *  onboardedAt: When the patient was added to the provider's caseload. Text formatted as an ISO8601 string.
 *  offboardedAt: When the patient was removed from the provider's caseload. Text formatted as an ISO8601 string.
 *
 *  createdAt: When this record was created. Text formatted as an ISO8601 string.
 *  updatedAt: When this record was last udpated. Text formatted as an ISO8601 string.
 *
 */

export const patientProvidersTable = sqliteTable('patient_providers', {
  id: idFieldSchema().notNull().primaryKey(),

  patientId: text('patient_id').notNull().references(() => usersTable.id),
  providerId: text('provider_id').notNull().references(() => usersTable.id),

  onboardedAt: text('onboarded_at').notNull(),
  offboardedAt: text('offboarded_at'),

  ...timestampFieldsSchemas,
}, (table) => {
  return {
    patientIdx: index('patient_providers_patient_idx').on(table.patientId),
    providerIdx: index('patient_providers_provider_idx').on(table.providerId),
  }
});

export type TypPatientProvider = InferModel<typeof patientProvidersTable, 'select'>;
