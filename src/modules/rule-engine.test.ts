import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { describe, it, expect, beforeAll } from 'vitest';

import {
  ASSESSMENT_SECTION_ANSWER_VALUE_TYPES,
  assessmentInstancesTable,
  db,
  SUBMISSION_RULE_ACTION_TYPES,
  SUBMISSION_RULE_EVAL_OPS,
  SUBMISSION_RULE_FILTER_TYPES,
  SUBMISSION_RULE_SCORE_OPS,
  type TypAssessment,
  type TypAssessmentInstance,
  // type TypAssessmentResponse,
  type TypAssessmentSection,
  // type TypAssessmentSectionAnswer,
  type TypAssessmentSectionAnswerValueType,
  type TypAssessmentSectionQuestion,
  type TypDisorder,
  type TypUser,
  USER_TYPES,
} from '#src/db';
import {
  clearDb,
  createAssessment,
  // createAssessmentAnswer,
  // createAssessmentResponse,
  createAssessmentInstance,
  createAssessmentQuestion,
  createAssessmentSection,
  createDisorder,
  createUser,
  randNumber,
} from '#test/data-utils';

import { _testExports } from './rule-engine';

describe('rule-engine', () => {
  let disorder: TypDisorder;
  let assessment: TypAssessment;
  let assessmentSection: TypAssessmentSection;
  let assessmentQuestion: TypAssessmentSectionQuestion;
  // let assessmentAnswer: TypAssessmentSectionAnswer;
  let provider: TypUser;
  let patient: TypUser;
  let assessmentInstance: TypAssessmentInstance;
  // let assessmentResponse: TypAssessmentResponse;

  beforeAll(async () => {
    await clearDb();
    disorder = await createDisorder();

    // Create assessment
    assessment = await createAssessment({
      disorderId: disorder.id,
      locked: true,
    });
    assessmentSection = await createAssessmentSection({
      assessmentId: assessment.id,
    });
    assessmentQuestion = await createAssessmentQuestion({
      assessmentSectionId: assessmentSection.id,
      disorderId: disorder.id,
    });
    // assessmentAnswer = await createAssessmentAnswer({
    //   assessmentSectionId: assessmentSection.id,
    // });

    // Create provider and patient
    provider = await createUser({ type: USER_TYPES.PROVIDER });
    patient = await createUser({ type: USER_TYPES.PATIENT });

    // Create assessment instance
    assessmentInstance = await createAssessmentInstance({
      providerId: provider.id,
      patientId: patient.id,
      assessmentId: assessment.id,
    });
    // assessmentResponse = await createAssessmentResponse({
    //   assessmentInstanceId: assessmentInstance.id,
    //   questionId: assessmentQuestion.id,
    //   answerId: assessmentAnswer.id,
    // });
  });

  describe('applyFilter', () => {
    it('filters in', async () => {
      const result = _testExports.applyFilter(
        SUBMISSION_RULE_FILTER_TYPES.QUESTION_DOMAIN,
        disorder.id,
        assessmentQuestion,
      );
      expect(result).toBe(true);
    });

    it('filters out', async () => {
      const result = _testExports.applyFilter(
        SUBMISSION_RULE_FILTER_TYPES.QUESTION_DOMAIN,
        uuid(),
        assessmentQuestion,
      );
      expect(result).toBe(false);
    });
  });

  describe('getScore', () => {
    describe('with SUBMISSION_RULE_SCORE_OPS.SUM', () => {
      it('computes sum', async () => {
        const values: { value: string; valueType: TypAssessmentSectionAnswerValueType }[] = [];
        for (let i = 0; i < 10; i++) {
          values.push({
            value: randNumber().toString(),
            valueType: ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
          });
        }

        const result = _testExports.getScore(
          SUBMISSION_RULE_SCORE_OPS.SUM,
          values,
        );

        const expectedSum = values.reduce((agg, data) => agg + parseFloat(data.value), 0);
        expect(result).toEqual(expectedSum);
      });

      it('returns 0 for empty list', async () => {
        const result = _testExports.getScore(SUBMISSION_RULE_SCORE_OPS.SUM, []);
        expect(result).toBe(0);
      });
    });
  });

  describe('evalScore', () => {
    describe('with SUBMISSION_RULE_EVAL_OPS.EQUAL', () => {
      it('is correct', async () => {
        const score = randNumber();

        let result = _testExports.evalScore(
          SUBMISSION_RULE_EVAL_OPS.EQUAL,
          score,
          score.toString(),
        );
        expect(result).toBe(true);

        result = _testExports.evalScore(
          SUBMISSION_RULE_EVAL_OPS.EQUAL,
          score,
          (score + 1).toString(),
        );
        expect(result).toBe(false);
      });
    });

    describe('with SUBMISSION_RULE_EVAL_OPS.GREATER_THAN', () => {
      it('is correct', async () => {
        const score = randNumber();

        let result = _testExports.evalScore(
          SUBMISSION_RULE_EVAL_OPS.GREATER_THAN,
          score,
          (score - 1).toString(),
        );
        expect(result).toBe(true);

        result = _testExports.evalScore(
          SUBMISSION_RULE_EVAL_OPS.GREATER_THAN,
          score,
          score.toString(),
        );
        expect(result).toBe(false);
      });
    });

    describe('with SUBMISSION_RULE_EVAL_OPS.GREATER_THAN_OR_EQUAL', () => {
      it('is correct', async () => {
        const score = randNumber();

        let result = _testExports.evalScore(
          SUBMISSION_RULE_EVAL_OPS.GREATER_THAN_OR_EQUAL,
          score,
          (score - 1).toString(),
        );
        expect(result).toBe(true);

        result = _testExports.evalScore(
          SUBMISSION_RULE_EVAL_OPS.GREATER_THAN_OR_EQUAL,
          score,
          score.toString(),
        );
        expect(result).toBe(true);

        result = _testExports.evalScore(
          SUBMISSION_RULE_EVAL_OPS.GREATER_THAN_OR_EQUAL,
          score,
          (score + 1).toString(),
        );
        expect(result).toBe(false);
      });
    });

    describe('with SUBMISSION_RULE_EVAL_OPS.LESS_THAN', () => {
      it('is correct', async () => {
        const score = randNumber();

        let result = _testExports.evalScore(
          SUBMISSION_RULE_EVAL_OPS.LESS_THAN,
          score,
          (score + 1).toString(),
        );
        expect(result).toBe(true);

        result = _testExports.evalScore(
          SUBMISSION_RULE_EVAL_OPS.LESS_THAN,
          score,
          score.toString(),
        );
        expect(result).toBe(false);
      });
    });

    describe('with SUBMISSION_RULE_EVAL_OPS.LESS_THAN_OR_EQUAL', () => {
      it('is correct', async () => {
        const score = randNumber();

        let result = _testExports.evalScore(
          SUBMISSION_RULE_EVAL_OPS.LESS_THAN_OR_EQUAL,
          score,
          (score + 1).toString(),
        );
        expect(result).toBe(true);

        result = _testExports.evalScore(
          SUBMISSION_RULE_EVAL_OPS.LESS_THAN_OR_EQUAL,
          score,
          score.toString(),
        );
        expect(result).toBe(true);

        result = _testExports.evalScore(
          SUBMISSION_RULE_EVAL_OPS.LESS_THAN_OR_EQUAL,
          score,
          (score - 1).toString(),
        );
        expect(result).toBe(false);
      });
    });
  });

  describe('performAction', () => {
    describe('with SUBMISSION_RULE_ACTION_TYPES.ASSIGN_ASSESSMENT', async () => {
      it('assigns assessment', async () => {
        const otherDisorder = await createDisorder();
        const otherAssessment = await createAssessment({
          disorderId: otherDisorder.id,
          locked: true,
        });

        const result = await _testExports.performAction(
          SUBMISSION_RULE_ACTION_TYPES.ASSIGN_ASSESSMENT,
          otherAssessment.id,
          assessmentInstance,
        );
        expect(result).toEqual(otherAssessment.name);

        const newdAssessmentInstance = await db.select()
          .from(assessmentInstancesTable)
          .where(eq(assessmentInstancesTable.assessmentId, otherAssessment.id))
          .get();
        expect(newdAssessmentInstance).toBeDefined();
        expect(newdAssessmentInstance!.providerId).toEqual(assessmentInstance.providerId);
        expect(newdAssessmentInstance!.patientId).toEqual(assessmentInstance.patientId);
        expect(newdAssessmentInstance!.assessmentId).not.toEqual(assessmentInstance.assessmentId);
        expect(newdAssessmentInstance!.assessmentId).toEqual(otherAssessment.id);
      });
    });
  });
});
