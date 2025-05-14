import { eq } from 'drizzle-orm';
import validate from 'express-zod-safe';
import { StatusCodes } from 'http-status-codes';
import { difference } from 'lodash';
import { z } from 'zod';

import {
  assessmentInstanceResponsesTable,
  assessmentInstancesTable,
  assessmentSectionAnswersTable,
  assessmentSectionQuestionsTable,
  assessmentSectionsTable,
  assessmentsTable,
  db,
  usersTable,
} from '#src/db';
import { runRules } from '#src/modules/rule-engine';

import {
  type TypAssessmentInstancePayload,
  type TypAssessmentResponsePayload,
} from './common/types';

export function registerPatientsEndpoints(app) {
  //
  // Record a response to a question for an assessment instance.
  //
  // Note: We'd want the patient's user ID to come from an auth session. But,
  // building full sessions was scoped out for this demo.
  //
  // curl http://localhost:3000/v1/patients/58f05f3c-d0cf-4ef8-b58b-78e82db7f432/assessments | jq
  //
  app.get(
    '/v1/patients/:patientId/assessments',
    validate({
      params: {
        patientId: z.string(),
      },
    }),
    async (req, res) => {
      const patient = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.id, req.params.patientId))
        .get();
      if (!patient) {
        res.status(StatusCodes.NOT_FOUND).json({ errorMessage: 'No such patient' });
        return;
      }

      const assessmentInstances: TypAssessmentInstancePayload[] = db
        .select({
          assessmentDisplayName: assessmentsTable.displayName,
          assessmentFullName: assessmentsTable.fullName,
          assessmentId: assessmentsTable.id,
          assessmentName: assessmentsTable.name,
          id: assessmentInstancesTable.id,
          patientId: assessmentInstancesTable.patientId,
          providerFamilyName: usersTable.familyName,
          providerGivenName: usersTable.givenName,
          providerId: assessmentInstancesTable.providerId,
          sentAt: assessmentInstancesTable.sentAt,
          slug: assessmentInstancesTable.slug,
          submittedAt: assessmentInstancesTable.submittedAt,
        })
        .from(assessmentInstancesTable)
        .innerJoin(assessmentsTable, eq(assessmentInstancesTable.assessmentId, assessmentsTable.id))
        .innerJoin(usersTable, eq(assessmentInstancesTable.providerId, usersTable.id))
        .where(eq(assessmentInstancesTable.patientId, patient.id))
        .all();

      res.status(StatusCodes.CREATED).json({
        data: {
          assessmentInstances,
        },
      });
    },
  );

  //
  // Get all of a patient's responses for an assessment instance.
  //
  // curl http://localhost:3000/v1/patients/PATIENT123/assessments/ASSESSMENT123/responses | jq
  //
  app.get(
    '/v1/patients/:patientId/assessments/:assessmentInstanceId/responses',
    validate({
      params: {
        assessmentInstanceId: z.string(),
        patientId: z.string(),
      },
    }),
    async (req, res) => {
      const patient = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.id, req.params.patientId))
        .get();
      if (!patient) {
        res.status(StatusCodes.NOT_FOUND).json({ errorMessage: 'No such patient' });
        return;
      }

      const assessmentInstance = await db.select()
        .from(assessmentInstancesTable)
        .where(eq(assessmentInstancesTable.id, req.params.assessmentInstanceId))
        .get();
      if (!assessmentInstance) {
        res.status(StatusCodes.NOT_FOUND).json({ errorMessage: 'No such assessment instance' });
        return;
      }

      if (assessmentInstance.patientId !== patient.id) {
        res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({ errorMessage: 'Assessment not assigned to patient' });
        return;
      }

      const assessmentResponses: TypAssessmentResponsePayload[] = await db
        .select({
          answerId: assessmentInstanceResponsesTable.answerId,
          assessmentInstanceId: assessmentInstanceResponsesTable.assessmentInstanceId,
          id: assessmentInstanceResponsesTable.id,
          questionId: assessmentInstanceResponsesTable.questionId,
        })
        .from(assessmentInstanceResponsesTable)
        .where(eq(
          assessmentInstanceResponsesTable.assessmentInstanceId,
          assessmentInstance.id,
        ))
        .all();

      res.status(StatusCodes.CREATED).json({
        data: {
          assessmentResponses,
        },
      });
    },
  );

  //
  // Record a response to a question for an assessment instance.
  /*
  curl -X POST http://localhost:3000/v1/patients/PATIENT123/assessments/ASSESSMENT123/responses \
    -H "Content-Type: application/json" \
    -d '{"questionId": "QUESTION1", "answerId": "ANSWER1"}' \
    | jq
  */
  app.post(
    '/v1/patients/:patientId/assessments/:assessmentInstanceId/responses',
    validate({
      params: {
        assessmentInstanceId: z.string(),
        patientId: z.string(),
      },
      body: {
        questionId: z.string(),
        answerId: z.string(),
      },
    }),
    async (req, res) => {
      const patient = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.id, req.params.patientId))
        .get();
      if (!patient) {
        res.status(StatusCodes.NOT_FOUND).json({ errorMessage: 'No such patient' });
        return;
      }

      const assessmentInstance = await db.select()
        .from(assessmentInstancesTable)
        .where(eq(assessmentInstancesTable.id, req.params.assessmentInstanceId))
        .get();
      if (!assessmentInstance) {
        res.status(StatusCodes.NOT_FOUND).json({ errorMessage: 'No such assessment instance' });
        return;
      }

      if (assessmentInstance.patientId !== patient.id) {
        res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({ errorMessage: "Assessment isn't assigned to specified patient" });
        return;
      }

      const question = await db
        .select({
          id: assessmentSectionQuestionsTable.id,
          assessmentId: assessmentSectionsTable.assessmentId,
        })
        .from(assessmentSectionQuestionsTable)
        .innerJoin(
          assessmentSectionsTable,
          eq(assessmentSectionQuestionsTable.assessmentSectionId, assessmentSectionsTable.id)
        )
        .where(eq(assessmentSectionQuestionsTable.id, req.body.questionId))
        .get();
      if (!question) {
        res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({ errorMessage: 'No such assessment question' });
        return;
      }

      const answer = await db
        .select({
          id: assessmentSectionAnswersTable.id,
          assessmentId: assessmentSectionsTable.assessmentId,
        })
        .from(assessmentSectionAnswersTable)
        .innerJoin(
          assessmentSectionsTable,
          eq(assessmentSectionAnswersTable.assessmentSectionId, assessmentSectionsTable.id)
        )
        .where(eq(assessmentSectionAnswersTable.id, req.body.answerId))
        .get();
      if (!answer) {
        res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({ errorMessage: 'No such assessment answer' });
        return;
      }

      if (question.assessmentId !== assessmentInstance.assessmentId) {
        res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({ errorMessage: "Question isn't part of target assessment" });
        return;
      }
      if (answer.assessmentId !== assessmentInstance.assessmentId) {
        res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({ errorMessage: "Answer isn't valid for target assessment" });
        return;
      }

      // TODO: Check if the assessment has already been submitted. If so, err.
      // TODO: Try looking up the response first. If found, update it.
      const assessmentResponse: TypAssessmentResponsePayload = await db
        .insert(assessmentInstanceResponsesTable)
        .values({
          assessmentInstanceId: assessmentInstance.id,
          questionId: question.id,
          answerId: answer.id,
        })
        .returning({
          answerId: assessmentInstanceResponsesTable.answerId,
          assessmentInstanceId: assessmentInstanceResponsesTable.assessmentInstanceId,
          id: assessmentInstanceResponsesTable.id,
          questionId: assessmentInstanceResponsesTable.questionId,
        })
        .get();

      res.status(StatusCodes.CREATED).json({
        data: {
          assessmentResponse,
        },
      });
    },
  );

  //
  // Submit an assessment instance.
  //
  // curl -X POST http://localhost:3000/v1/patients/PATIENT123/assessments/ASSESSMENT123/submissions | jq
  //
  app.post(
    '/v1/patients/:patientId/assessments/:assessmentInstanceId/submissions',
    validate({
      params: {
        assessmentInstanceId: z.string(),
        patientId: z.string(),
      },
    }),
    async (req, res) => {
      const patient = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.id, req.params.patientId))
        .get();
      if (!patient) {
        res.status(StatusCodes.NOT_FOUND).json({ errorMessage: 'No such patient' });
        return;
      }

      const assessmentInstance: TypAssessmentInstancePayload | undefined = db
        .select({
          assessmentDisplayName: assessmentsTable.displayName,
          assessmentFullName: assessmentsTable.fullName,
          assessmentId: assessmentsTable.id,
          assessmentName: assessmentsTable.name,
          id: assessmentInstancesTable.id,
          patientId: assessmentInstancesTable.patientId,
          providerFamilyName: usersTable.familyName,
          providerGivenName: usersTable.givenName,
          providerId: assessmentInstancesTable.providerId,
          sentAt: assessmentInstancesTable.sentAt,
          slug: assessmentInstancesTable.slug,
          submittedAt: assessmentInstancesTable.submittedAt,
        })
        .from(assessmentInstancesTable)
        .innerJoin(assessmentsTable, eq(assessmentInstancesTable.assessmentId, assessmentsTable.id))
        .innerJoin(usersTable, eq(assessmentInstancesTable.providerId, usersTable.id))
        .where(eq(assessmentInstancesTable.id, req.params.assessmentInstanceId))
        .get();
      if (!assessmentInstance) {
        res.status(StatusCodes.NOT_FOUND).json({ errorMessage: 'No such assessment instance' });
        return;
      }

      if (assessmentInstance.patientId !== patient.id) {
        res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({ errorMessage: 'Assessment not assigned to patient' });
        return;
      }
      if (assessmentInstance.submittedAt) {
        res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({ errorMessage: 'Assessment responses have already been submitted' });
        return;
      }

      const assessmentResponses = await db.select()
        .from(assessmentInstanceResponsesTable)
        .where(eq(assessmentInstanceResponsesTable.assessmentInstanceId, assessmentInstance.id))
        .all();
      const submittedQuestionIds = assessmentResponses.map(r => r.questionId);

      const questions = await db
        .select({ id: assessmentSectionQuestionsTable.id })
        .from(assessmentSectionQuestionsTable)
        .innerJoin(assessmentSectionsTable, eq(
          assessmentSectionQuestionsTable.assessmentSectionId,
          assessmentSectionsTable.id,
        ))
        .where(eq(
          assessmentSectionsTable.assessmentId,
          assessmentInstance.assessmentId,
        ))
        .all();
      const requiredQuestionIds = questions.map(q => q.id);

      const missingQuestions = difference(requiredQuestionIds, submittedQuestionIds);
      if (missingQuestions.length > 0) {
        res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
          errorMessage: `${missingQuestions.length} assessment questions haven't been answered yet`,
        });
        return;
      }

      // TODO: It's possible that we could configure rules other than
      // assign-assessment. This could result in the return value including
      // stuff other than follow-up assessment names. We should choose an
      // alternative way of getting assigned follow-up assessments.
      // TODO: Running the rules engine needs to be made idempotent.
      const assignedFollowUpAssessmentNames = await runRules(assessmentInstance);

      await db.update(assessmentInstancesTable)
        .set({ submittedAt: new Date().toISOString() })
        .where(eq(assessmentInstancesTable.id, assessmentInstance.id))
        .run();

      res.status(StatusCodes.CREATED).json({
        data: {
          assessmentInstance,
          followUpAssessmentsAssigned: assignedFollowUpAssessmentNames,
        },
      });
    },
  );
}
