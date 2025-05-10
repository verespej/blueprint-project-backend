import { index, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

import { assessmentInstancesTable } from './assessment-instances';
import { assessmentSectionAnswersTable } from './assessment-section-answers';
import { assessmentSectionQuestionsTable } from './assessment-section-questions';
import { idFieldSchema } from './common/id-fields';
import { timestampFieldsSchemas } from './common/timestamp-fields';

/* Assessment instance responses table
 *
 * Patient responses to questions for an assigned assessment.
 *
 * Fields:
 *
 *  id: A unique ID identifying the record. Text formatted as a UUIDv4.
 *
 *  assessmentInstanceId: The assessment instance the response is for. Text reference to an assessment instance ID.
 *  questionId: The assessment question the response answers. Text reference to a question ID.
 *  answerId: The answer the user selected in response to the question. Text reference to an answer ID.
 *
 *  createdAt: When this record was created. Text formatted as an ISO8601 string.
 *  updatedAt: When this record was last udpated. Text formatted as an ISO8601 string.
 *
 */

export const assessmentInstanceResponsesTable = sqliteTable('assessment_instance_responses', {
  id: idFieldSchema().notNull().primaryKey(),

  assessmentInstanceId: text('assessment_instance_id').notNull().references(() => assessmentInstancesTable.id),
  questionId: text('question_id').notNull().references(() => assessmentSectionQuestionsTable.id),
  answerId: text('answer_id').references(() => assessmentSectionAnswersTable.id),

  ...timestampFieldsSchemas,
}, (table) => {
  return {
    assessmentInstanceQuestionUniqIdx: unique('assessment_instance_responses_assessment_instance_question_uniq_idx').on(
      table.assessmentInstanceId,
      table.questionId,
    ),
    questionIdx: index('assessment_instance_responses_question_idx').on(table.questionId),
  };
});

export type TypAssessmentResponse = {
  id: string;

  assessmentInstanceId: string;
  questionId: string;
  answerId: string;

  createdAt: string;
  updatedAt: string;
};
