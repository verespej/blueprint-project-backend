import { InferModel } from 'drizzle-orm';
import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { assessmentsTable } from './assessments';
import { idFieldSchema } from './common/id-fields';
import { timestampFieldsSchemas } from './common/timestamp-fields';

export const SUBMISSION_RULE_FILTER_TYPES = {
  QUESTION_DOMAIN: 'question_domain',
} as const;

export type TypSubmissionRuleFilterType = typeof SUBMISSION_RULE_FILTER_TYPES[
  keyof typeof SUBMISSION_RULE_FILTER_TYPES
];

export const SUBMISSION_RULE_SCORE_OPS = {
  SUM: 'sum',
} as const;

export type TypSubmissionRuleScoreOp = typeof SUBMISSION_RULE_SCORE_OPS[
  keyof typeof SUBMISSION_RULE_SCORE_OPS
];

export const SUBMISSION_RULE_EVAL_OPS = {
  EQUAL: 'eq',
  GREATER_THAN: 'gt',
  GREATER_THAN_OR_EQUAL: 'geq',
  LESS_THAN: 'lt',
  LESS_THAN_OR_EQUAL: 'leq',
} as const;

export type TypSubmissionRuleEvalOp = typeof SUBMISSION_RULE_EVAL_OPS[
  keyof typeof SUBMISSION_RULE_EVAL_OPS
];

export const SUBMISSION_RULE_ACTION_TYPES = {
  ASSIGN_ASSESSMENT: 'assign_assessment',
} as const;

export type TypSubmissionRuleActionType = typeof SUBMISSION_RULE_ACTION_TYPES[
  keyof typeof SUBMISSION_RULE_ACTION_TYPES
];

/* Submission rules table
 *
 * A rule configuration used to:
 *
 *  1. On submission of a specified assessment...
 *  2. Filter the responses in the assessment submission
 *  3. Generate a score on the filtered responses
 *  4. Evaluate whether to take action based on the score
 *  5. If action should be taken, perform a specified action
 *
 * Fields:
 *
 *  id: A unique ID identifying the record. Text formatted as a UUIDv4.
 *
 *  assessmentId: The assessment for which submission trigger this rule. Text reference to an assessment ID.
 *
 *  filterType: The type of filtering to be done on the responses in the submission. Text.
 *  filterValue: The value to use when applying the specified filter type. Text.
 *
 *  scoreOperation: The operation to perform when scoring the filtered responses. Text.
 *
 *  evalOperation: The operation to use to evaluate the score. Text.
 *  evalValue: The value to use when applying the specified eval operation. Text.
 *
 *  actionType: The action to take if the score passes eval. Text.
 *  actionValue: The value to use when applying the action. Text.
 *
 *  createdAt: When this record was created. Text formatted as an ISO8601 string.
 *  updatedAt: When this record was last udpated. Text formatted as an ISO8601 string.
 *
 */

export const submissionRulesTable = sqliteTable('submission_rules', {
  id: idFieldSchema().notNull().primaryKey(),

  assessmentId: text('assessment_id').notNull().references(() => assessmentsTable.id),

  filterType: text('filter_type').$type<TypSubmissionRuleFilterType>().notNull(),
  filterValue: text('filter_value').notNull(),

  scoreOperation: text('score_operation').$type<TypSubmissionRuleScoreOp>().notNull(),

  evalOperation: text('eval_operation').$type<TypSubmissionRuleEvalOp>().notNull(),
  evalValue: text('eval_value').notNull(),

  actionType: text('action_type').$type<TypSubmissionRuleActionType>().notNull(),
  actionValue: text('action_value').notNull(),

  ...timestampFieldsSchemas,
}, (table) => {
  return {
    assessmentIdx: index('assessment_idx').on(table.assessmentId),
  };
});

export type TypSubmissionRule = InferModel<typeof submissionRulesTable, 'select'>;
