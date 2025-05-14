import { and, count, eq, gte, lt } from 'drizzle-orm';

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
import { getAutomatedActionUserId } from '#src/modules/system-users';
import { startOfDate } from '#src/utils/dates';
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
): Promise<string | null> {
  if (actionType === SUBMISSION_RULE_ACTION_TYPES.ASSIGN_ASSESSMENT) {
    const assessment = await db
      .select({ id: assessmentsTable.id, name: assessmentsTable.name })
      .from(assessmentsTable)
      .where(eq(assessmentsTable.id, actionValue))
      .get();
    if (!assessment) {
      throw new Error('No matching assessment');
    }

    // TODO: Should we copy the provider from the original assignment?
    const providerId = await getAutomatedActionUserId();
    const patientId = assessmentInstance.patientId;
    const assessmentId = assessment.id;
    const slug = generateSlug();
    const sentAt = new Date();

    // Limit the number of times a given assessment is automatically assigned
    // to a given patient to once per day.
    const sentAtDayRangeStart = startOfDate(sentAt).toISOString();
    const sentAtDayRangeEnd = startOfDate(sentAt, 1).toISOString();
    const duplicatesQueryResult = await db
      .select({ count: count() })
      .from(assessmentInstancesTable)
      .where(
        and(
          eq(assessmentInstancesTable.providerId, providerId),
          eq(assessmentInstancesTable.patientId, patientId),
          eq(assessmentInstancesTable.assessmentId, assessmentId),
          gte(assessmentInstancesTable.sentAt, sentAtDayRangeStart),
          lt(assessmentInstancesTable.sentAt, sentAtDayRangeEnd),
        ),
      )
      .get();
    const alreadySent = duplicatesQueryResult!.count > 0;
    if (alreadySent) {
      return null;
    }

    // TODO: Handle possibility of slug collision
    await db.insert(assessmentInstancesTable)
      .values({
        providerId,
        patientId,
        assessmentId,
        slug,
        sentAt: sentAt.toISOString(),
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
      if (actionResult != null) { // Note: Null-ish (i.e. !=) intentional
        returnValues.push(actionResult);
      }
    }
  }

  return Array.from(new Set(returnValues));
}

// Exports only for testing
export const _testExports = {
  applyFilter,
  evalScore,
  getScore,
  performAction,
};
