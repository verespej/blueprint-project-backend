import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { assessmentsTable } from './assessments';
import { idFieldSchema } from './common/id-fields';
import { timestampFieldsSchemas } from './common/timestamp-fields';

/* Assessment sections table
 *
 * A section of a given assessment. An assessment section contains a subset
 * of questions from the assessment. Questions in a given assessment section
 * share common metadata characteristics.
 *
 * Fields:
 *
 *  id: A unique ID identifying the record. Text formatted as a UUIDv4.
 *
 *  assessmentId: The assessment the section's part of. Text reference to an assessment ID.
 *  type: The type of questions in this section of the assessment. Text equal to "standard" (the only valid value, for now).
 *  title: The title to display in UIs for this section of the assessment. Text.
 *
 *  createdAt: When this record was created. Text formatted as an ISO8601 string.
 *  updatedAt: When this record was last udpated. Text formatted as an ISO8601 string.
 *
 */

export const assessmentSectionsTable = sqliteTable('assessment_sections', {
  id: idFieldSchema().notNull().primaryKey(),

  assessmentId: text('assessment_id').notNull().references(() => assessmentsTable.id),
  type: text().notNull(),
  title: text().notNull(),

  ...timestampFieldsSchemas,
}, (table) => {
  return {
    assessmentIdx: index('assessment_sections_assessment_idx').on(table.assessmentId),
  };
});

export const ASSESSMENT_SECTION_TYPES = {
  STANDARD: 'standard',
} as const;

export type TypAssessmentSectionType = typeof ASSESSMENT_SECTION_TYPES[
  keyof typeof ASSESSMENT_SECTION_TYPES
];

export type TypAssessmentSection = {
  id: string;

  assessmentId: string;
  type: TypAssessmentSectionType;
  title: string;

  createdAt: string;
  updatedAt: string;
};
