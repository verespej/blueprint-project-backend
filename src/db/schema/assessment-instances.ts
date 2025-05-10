import { index, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

import { idFieldSchema } from './common/id-fields';
import { timestampFieldsSchemas } from './common/timestamp-fields';
import { assessmentsTable } from './assessments';
import { usersTable } from './users';

/* Assessments instances table
 *
 * An instance of an assessment sent to a patient by a provider.
 *
 * Fields:
 *
 *  id: A unique ID identifying the record. Text formatted as a UUIDv4.
 *
 *  providerId: The provider who's sending this assessment instance. Text reference to a user ID.
 *  patientId: The patient the provider is sending this assessment instance to. Text reference to a user ID.
 *  assessmentId: The assessment the provider is sending the patient to complete. Text reference to an assessment ID.
 *  slug: An identifier that can be used to form a URL to send to the patient as well as look up this assessment instance. Text.
 *  sentAt: When the provider sent this assessment instance to the patient. Text formatted as an ISO8601 string.
 *
 *  createdAt: When this record was created. Text formatted as an ISO8601 string.
 *  updatedAt: When this record was last udpated. Text formatted as an ISO8601 string.
 *
 */

export const assessmentInstancesTable = sqliteTable('assessment_instances', {
  id: idFieldSchema().notNull().primaryKey(),

  providerId: text('provider_id').notNull().references(() => usersTable.id),
  patientId: text('patient_id').notNull().references(() => usersTable.id),
  assessmentId: text('assessment_id').notNull().references(() => assessmentsTable.id),
  slug: text().notNull(),
  sentAt: text('sent_at'),

  ...timestampFieldsSchemas,
}, (table) => {
  return {
    assessmentIdx: index('assessment_instances_assessment_idx').on(table.assessmentId),
    patientIdx: index('assessment_instances_patient_idx').on(table.patientId),
    providerIdx: index('assessment_instances_provider_idx').on(table.providerId),
    slugUniqIdx: unique('assessment_instances_slug_uniq_idx').on(table.slug),
  };
});

export type TypAssessmentInstance = {
  id: string;

  providerId: string;
  patientId: string;
  assessmentId: string;
  slug: string;
  sentAt?: string | null;

  createdAt: string;
  updatedAt: string;
};
