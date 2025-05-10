import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { assessmentSectionsTable } from './assessment-sections';
import { idFieldSchema } from './common/id-fields';
import { timestampFieldsSchemas } from './common/timestamp-fields';

/* Assessment section answers table
 *
 * Possible answers to the questions in a given section of an assessment.
 *
 * Fields:
 *
 *  id: A unique ID identifying the record. Text formatted as a UUIDv4.
 *
 *  assessmentSectionId: The assessment section the answer applies to. Text reference to an assessment section ID.
 *  title: The text label of the answer. Text.
 *  valueType: How the value should be interpreted. Text equal to "text" or "number".
 *  value: The value of the answer. Text.
 *
 *  displayOrder: The rank order in which to display the question in UIs. Integer.
 *
 *  createdAt: When this record was created. Text formatted as an ISO8601 string.
 *  updatedAt: When this record was last udpated. Text formatted as an ISO8601 string.
 *
 */

// Note: I don't like that we force a section to have a single set of
// answers. I'd prefer to have answers associated with each question.
// This would create redundancy, but provide more flexibility in
// creation and customization of assessments.

export const assessmentSectionAnswersTable = sqliteTable('assessment_section_answers', {
  id: idFieldSchema().notNull().primaryKey(),

  assessmentSectionId: text('assessment_section_id').notNull().references(() => assessmentSectionsTable.id),
  title: text().notNull(),
  valueType: text().notNull(),
  value: text().notNull(),

  displayOrder: integer().notNull(),

  ...timestampFieldsSchemas,
}, (table) => {
  return {
    assessmentSectionTitleUniqIdx: index('assessment_section_answers_assessment_section_title_uniq_idx').on(
      table.assessmentSectionId,
      table.title,
    ),
  };
});

export const ASSESSMENT_SECTION_ANSWER_VALUE_TYPES = {
  NUMBER: 'number',
  TEXT: 'text',
} as const;

export type TypAssessmentSectionAnswerValueType = typeof ASSESSMENT_SECTION_ANSWER_VALUE_TYPES[
  keyof typeof ASSESSMENT_SECTION_ANSWER_VALUE_TYPES
];

export type TypAssessmentSectionAnswer = {
  id: string;

  assessmentSectionId: string;
  title: string;
  valueType: TypAssessmentSectionAnswerValueType;
  value: string;

  displayOrder: number;

  createdAt: string;
  updatedAt: string;
};
