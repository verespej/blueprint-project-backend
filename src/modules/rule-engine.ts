import { eq } from 'drizzle-orm';
import { isNil } from 'lodash';

import {
  ASSESSMENT_SECTION_ANSWER_VALUE_TYPES,
  assessmentInstanceResponsesTable,
  assessmentInstancesTable,
  assessmentSectionAnswersTable,
  assessmentSectionQuestionsTable,
  assessmentsTable,
  db,
  submissionRulesTable,
  SUBMISSION_RULE_ACTION_TYPES,
  SUBMISSION_RULE_EVAL_OPS,
  SUBMISSION_RULE_FILTER_TYPES,
  SUBMISSION_RULE_SCORE_OPS,
  type TypAssessmentInstance,
  type TypAssessmentSectionAnswer,
  type TypSubmissionRule,
  type TypSubmissionRuleActionType,
  type TypSubmissionRuleEvalOp,
  type TypSubmissionRuleScoreOp,
} from '#src/db';
import { generateSlug } from '#src/utils/slugs';

type ApplyFilterParamAssessmentResponseMap = {
  [SUBMISSION_RULE_FILTER_TYPES.QUESTION_DOMAIN]: { disorderId: string };
};
function applyFilter<T extends keyof ApplyFilterParamAssessmentResponseMap>(
  filterType: T,
  filterValue: string,
  assessmentResponseData: ApplyFilterParamAssessmentResponseMap[T],
): boolean {
  if (filterType === SUBMISSION_RULE_FILTER_TYPES.QUESTION_DOMAIN) {
    if (!('disorderId' in assessmentResponseData)) {
      throw new Error('Data missing required field: disorderId');
    }
    return assessmentResponseData.disorderId === filterValue;
  }

  throw new Error('Unrecognized filter');
}

function getScore(
  scoreOperation: TypSubmissionRuleScoreOp,
  assessmentResponseDatas: Pick<TypAssessmentSectionAnswer, 'value' | 'valueType'>[],
): number {
  if (scoreOperation === SUBMISSION_RULE_SCORE_OPS.SUM) {
    return assessmentResponseDatas.reduce((agg, responseData) => {
      if (responseData.valueType !== ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER) {
        // TODO: Provide more detail about what data resulted in this error
        throw new Error("Can't sum non-numeric values");
      }
      return agg + parseFloat(responseData.value);
    }, 0);
  }

  throw new Error('Unrecognized scoring operation');
}

function evalScore(
  evalOperation: TypSubmissionRuleEvalOp,
  score: number,
  evalValue: string,
): boolean {
  const parsedEvalValue = parseFloat(evalValue);

  if (evalOperation === SUBMISSION_RULE_EVAL_OPS.EQUAL) {
    return score === parsedEvalValue;
  }
  if (evalOperation === SUBMISSION_RULE_EVAL_OPS.GREATER_THAN) {
    return score > parsedEvalValue;
  }
  if (evalOperation === SUBMISSION_RULE_EVAL_OPS.GREATER_THAN_OR_EQUAL) {
    return score >= parsedEvalValue;
  }
  if (evalOperation === SUBMISSION_RULE_EVAL_OPS.LESS_THAN) {
    return score < parsedEvalValue;
  }
  if (evalOperation === SUBMISSION_RULE_EVAL_OPS.LESS_THAN_OR_EQUAL) {
    return score <= parsedEvalValue;
  }

  throw new Error('Unrecognized eval operation');
}

async function performAction(
  actionType: TypSubmissionRuleActionType,
  actionValue: string,
  assessmentInstance: Pick<TypAssessmentInstance, 'patientId' | 'providerId'>,
): Promise<string> {
  if (actionType === SUBMISSION_RULE_ACTION_TYPES.ASSIGN_ASSESSMENT) {
    const assessment = await db
      .select({ id: assessmentsTable.id, name: assessmentsTable.name })
      .from(assessmentsTable)
      .where(eq(assessmentsTable.id, actionValue))
      .get();
    if (!assessment) {
      throw new Error('No matching assessment');
    }

    // TODO: Hanlde possibility of slug collision
    await db.insert(assessmentInstancesTable)
      .values({
        providerId: assessmentInstance.providerId,
        patientId: assessmentInstance.patientId,
        assessmentId: assessment.id,
        slug: generateSlug(),
        sentAt: new Date().toISOString(),
      });

    return assessment.name;
  }

  throw new Error('Unrecognized action');
}

export async function runRules(
  assessmentInstance: Pick<TypAssessmentInstance, 'assessmentId' | 'id' | 'patientId' | 'providerId'>,
): Promise<string[]> {
  // Get applicable rules
  const rules = await db.select()
    .from(submissionRulesTable)
    .where(eq(submissionRulesTable.assessmentId, assessmentInstance.assessmentId))
    .all() as TypSubmissionRule[];
  if (rules.length < 1) {
    return [];
  }

  // Get assessment responses
  const responses = await db
    .select({
      id: assessmentInstanceResponsesTable.id,
      disorderId: assessmentSectionQuestionsTable.disorderId,
      valueType: assessmentSectionAnswersTable.valueType,
      value: assessmentSectionAnswersTable.value,
    })
    .from(assessmentInstanceResponsesTable)
    .innerJoin(assessmentSectionQuestionsTable, eq(assessmentInstanceResponsesTable.questionId, assessmentSectionQuestionsTable.id))
    .innerJoin(assessmentSectionAnswersTable, eq(assessmentInstanceResponsesTable.answerId, assessmentSectionAnswersTable.id))
    .where(eq(assessmentInstanceResponsesTable.assessmentInstanceId, assessmentInstance.id))
    .all();

  // Apply rules
  const returnValues: string[] = [];
  for (const rule of rules) {
    const selectedResponses = responses.filter(
      r => applyFilter(rule.filterType, rule.filterValue, r)
    );
    const score = getScore(rule.scoreOperation, selectedResponses);
    const doAction = evalScore(rule.evalOperation, score, rule.evalValue);

    if (doAction) {
      const actionResult = await performAction(
        rule.actionType,
        rule.actionValue,
        assessmentInstance,
      );
      if (!isNil(actionResult)) {
        returnValues.push(actionResult);
      }
    }
  }

  return returnValues;
}

// Exports only for testing
export const _testExports = {
  applyFilter,
  evalScore,
  getScore,
  performAction,
};
