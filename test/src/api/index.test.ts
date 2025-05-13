import request from 'supertest';
import { describe, it, expect, beforeAll } from 'vitest';

import { app } from '#src/app';

import {
  clearDb,
  createDisorder,
  createAssessment,
  createAssessmentSection,
  createAssessmentQuestion,
  createAssessmentAnswer,
} from '#test/data-utils';

describe('GET /v1/assessments/:assessmentId', () => {
  let disorder;
  let assessment;
  let assessmentSection;
  let assessmentQuestion;
  let assessmentAnswer;

  beforeAll(async () => {
    await clearDb();
    disorder = await createDisorder();
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
    assessmentAnswer = await createAssessmentAnswer({
      assessmentSectionId: assessmentSection.id,
    });
  });

  it('succeeds and returns formatted assessment', async () => {
    await request(app)
      .get(`/v1/assessments/${assessment.id}`)
      .expect(200)
      .then(res => {
        expect(res.body.data.assessment).toBeDefined();
        expect(res.body.data.assessment.id).toEqual(assessment.id);
        expect(res.body.data.assessment.name).toEqual(assessment.name);
        expect(res.body.data.assessment.disorder).toEqual(disorder.displayName);
        expect(res.body.data.assessment.full_name).toEqual(assessment.fullName);

        const content = res.body.data.assessment.content;
        expect(content).toBeDefined();
        expect(content.display_name).toEqual(assessment.displayName);
        expect(content.sections).toHaveLength(1);

        const section = content.sections[0];
        expect(section.title).toEqual(assessmentSection.title);
        expect(section.type).toEqual(assessmentSection.type);
        expect(section.answers).toHaveLength(1);
        expect(section.questions).toHaveLength(1);

        const sectionQuestion = section.questions[0];
        expect(sectionQuestion.display_order).toEqual(assessmentQuestion.displayOrder);
        expect(sectionQuestion.question_id).toEqual(assessmentQuestion.id);
        expect(sectionQuestion.title).toEqual(assessmentQuestion.title);

        const sectionAnswer = section.answers[0];
        expect(sectionAnswer.answer_id).toEqual(assessmentAnswer.id);
        expect(sectionAnswer.display_order).toEqual(assessmentAnswer.displayOrder);
        expect(sectionAnswer.title).toEqual(assessmentAnswer.title);
        expect(sectionAnswer.value).toEqual(parseFloat(assessmentAnswer.value));
      });
  });
});
