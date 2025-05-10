import { integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

import { assessmentSectionsTable } from './assessment-sections';
import { disordersTable } from './disorders';
import { idFieldSchema } from './common/id-fields';
import { timestampFieldsSchemas } from './common/timestamp-fields';

/* Assessment section questions table
 *
 * The questions forming a section of an assessment.
 *
 * Fields:
 *
 *  id: A unique ID identifying the record. Text formatted as a UUIDv4.
 *
 *  assessmentSectionId: The assessment section the question's part of. Text reference to an assessment section ID.
 *  title: The text of the question. Text.
 *  disorderId: The disorder the question's associated with. Text reference to a disorder ID.
 *
 *  displayOrder: The rank order in which to display the question in UIs. Integer.
 *
 *  createdAt: When this record was created. Text formatted as an ISO8601 string.
 *  updatedAt: When this record was last udpated. Text formatted as an ISO8601 string.
 *
 */

export const assessmentSectionQuestionsTable = sqliteTable('assessment_section_questions', {
  id: idFieldSchema().notNull().primaryKey(),

  assessmentSectionId: text('assessment_section_id').notNull().references(() => assessmentSectionsTable.id),
  title: text().notNull(),
  disorderId: text('disorder_id').notNull().references(() => disordersTable.id),

  displayOrder: integer().notNull(),

  ...timestampFieldsSchemas,
}, (table) => {
  return {
    assessmentSectionAndTitleUniqIdx: unique('assessment_section_questions_assessment_section_title_uniq_idx').on(
      table.assessmentSectionId,
      table.title,
    ),
  };
});

export type TypAssessmentSectionQuestion = {
  id: string;

  assessmentSectionId: string;
  title: string;
  disorderId: string;

  displayOrder: number;

  createdAt: string;
  updatedAt: string;
};
