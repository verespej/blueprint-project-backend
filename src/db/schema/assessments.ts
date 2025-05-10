import { index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

import { idFieldSchema } from './common/id-fields';
import { timestampFieldsSchemas } from './common/timestamp-fields';
import { disordersTable } from './disorders';

/* Assessments table
 *
 * A collection of assessment questions a provider may administer to patients.
 * An assessment is divided into sections, each containing a portion of the
 * questions that compose the entire assessment.
 *
 * Fields:
 *
 *  id: A unique ID identifying the record. Text formatted as a UUIDv4.
 *
 *  name: The code name for the assessment, usually an acronym. Text.
 *  fullName: The full (non-code) name of the assessment. Text.
 *  displayName: A friendly name for the assessment, to display in UIs. Text.
 *  disorderId: The disorder the assessment's generally associated with. Text reference to a disorder ID.
 *
 *  locked: Whether the assessment (and any of its features) is no longer allowed to be changed.
 *
 *  createdAt: When this record was created. Text formatted as an ISO8601 string.
 *  updatedAt: When this record was last udpated. Text formatted as an ISO8601 string.
 *
 */

// Note: A given assessment may have multiple versions. To create a new
// version, we should just create a duplicate assessment with a version
// suffix in the name. As soon as an assessment's been sent to a client,
// the assessment shouldn't change from that point on. When that happens,
// the locked field should be set to "true".

export const assessmentsTable = sqliteTable('assessments', {
  id: idFieldSchema().notNull().primaryKey(),

  name: text().notNull(),
  fullName: text('full_name').notNull(),
  displayName: text('display_name'),
  disorderId: text('disorder_id').notNull().references(() => disordersTable.id),

  locked: integer({ mode: 'boolean' }).notNull(),

  ...timestampFieldsSchemas,
}, (table) => {
  return {
    disorderIdx: index('assessments_disorder_idx').on(table.disorderId),
    fullNameUniqIdx: unique('assessments_full_name_uniq_uniq_idx').on(table.fullName),
    nameUniqIdx: unique('assessments_name_uniq_idx').on(table.name),
  };
});

export type TypAssessment = {
  id: string;

  name: string;
  fullName: string;
  displayName?: string | null;
  disorderId: string;

  locked: boolean; // Stored as int in DB

  createdAt: string;
  updatedAt: string;
};
