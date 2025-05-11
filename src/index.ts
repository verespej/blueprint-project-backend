import { and, eq, inArray, isNull } from 'drizzle-orm';
import express from 'express';
import validate from 'express-zod-safe';
import { StatusCodes } from 'http-status-codes';
import { groupBy } from 'lodash';
import { z } from 'zod';

import {
  ASSESSMENT_SECTION_ANSWER_VALUE_TYPES,
  assessmentInstanceResponsesTable,
  assessmentInstancesTable,
  assessmentSectionAnswersTable,
  assessmentSectionQuestionsTable,
  assessmentSectionsTable,
  assessmentsTable,
  db,
  disordersTable,
  patientProvidersTable,
  USER_TYPES,
  usersTable,
} from '#src/db';
import { generateSlug } from '#src/utils/create-slug';

const app = express();
app.use(express.json());

//
// Get assessment by name.
//
// curl -s http://localhost:3000/assessments/BPDS | jq
//
app.get(
  '/assessments/:assessmentName',
  validate({
    params: {
      assessmentName: z.string(),
    },
  }),
  async (req, res) => {
    // Note: No risk of SQL injection here because drizzle's query builder
    // generates parameterized queries.
    const assessment = await db
      .select({
          displayName: assessmentsTable.displayName,
          disorderDisplayName: disordersTable.displayName,
          fullName: assessmentsTable.fullName,
          id: assessmentsTable.id,
          name: assessmentsTable.name,
      })
      .from(assessmentsTable)
      .innerJoin(disordersTable, eq(assessmentsTable.disorderId, disordersTable.id))
      .where(eq(assessmentsTable.name, req.params.assessmentName))
      .get();
    if (!assessment) {
      res.status(StatusCodes.NOT_FOUND).json({ errorMessage: 'No such assessment' });
      return;
    }

    const sections = await db.select()
      .from(assessmentSectionsTable)
      .where(eq(assessmentSectionsTable.assessmentId, assessment.id))
      .all();
    const sectionIds = sections.map(s => s.id);

    const answers = await db.select()
      .from(assessmentSectionAnswersTable)
      .where(inArray(assessmentSectionAnswersTable.assessmentSectionId, sectionIds))
      .all();
    const answersBySectionId = groupBy(answers, a => a.assessmentSectionId);

    const questions = await db.select()
      .from(assessmentSectionQuestionsTable)
      .where(inArray(assessmentSectionQuestionsTable.assessmentSectionId, sectionIds))
      .all();
    const questionsBySectionId = groupBy(questions, q => q.assessmentSectionId);

    const formattedSections = sections.map(section => {
      const formattedAnswers = (answersBySectionId[section.id] || []).map(a => {
        let value: number | string = a.value;
        if (a.valueType === ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER) {
          value = parseFloat(value as string);
        }
        return {
          display_order: a.displayOrder,
          title: a.title,
          value,
        };
      }).sort((l, r) => l.display_order - r.display_order);
      const formattedQuestions = (questionsBySectionId[section.id] || []).map(q => ({
        display_order: q.displayOrder,
        question_id: q.id,
        title: q.title,
      })).sort((l, r) => l.display_order - r.display_order);

      return {
        title: section.title,
        type: section.type,
        answers: formattedAnswers,
        questions: formattedQuestions,
      };
    });

    res.json({
      data: {
        assessment: {
          id: assessment.id,
          name: assessment.name,
          disorder: assessment.disorderDisplayName,
          full_name: assessment.fullName,
          content: {
            display_name: assessment.displayName,
            sections: formattedSections,
          },
        },
      },
    });
  },
);

//
// Get user by email.
//
// curl -s http://localhost:3000/users/good.therapist%40example.com | jq
//
app.get(
  '/users/:email',
  validate({
    params: {
      email: z.string().email(),
    },
  }),
  async (req, res) => {
    const user = await db
      .select({
        id: usersTable.id,
        type: usersTable.type,
        givenName: usersTable.givenName,
        familyName: usersTable.familyName,
      })
      .from(usersTable)
      .where(eq(usersTable.email, req.params.email))
      .get();
    if (!user) {
      res.status(StatusCodes.NOT_FOUND).json({ errorMessage: 'No such user' });
      return;
    }

    res.json({
      data: {
        user,
      },
    });
  },
);

//
// Get patients for provider.
//
// Note: We'd want the provider's user ID to come from an auth session. But,
// building full sessions was scoped out for this demo.
//
// curl -s http://localhost:3000/providers/PROVIDER123/patients | jq
//
app.get(
  '/providers/:providerId/patients',
  validate({
    params: {
      providerId: z.string(),
    },
  }),
  async (req, res) => {
    const provider = await db
      .select({ id: usersTable.id, type: usersTable.type })
      .from(usersTable)
      .where(eq(usersTable.id, req.params.providerId))
      .get();
    if (!provider || provider.type !== USER_TYPES.PROVIDER) {
      res.status(StatusCodes.NOT_FOUND).json({ errorMessage: 'No such provider' });
      return;
    }

    const patients = await db
      .select({
        id: usersTable.id,
        givenName: usersTable.givenName,
        familyName: usersTable.familyName,
        onboardedAt: patientProvidersTable.onboardedAt,
        offboardedAt: patientProvidersTable.offboardedAt,
      })
      .from(patientProvidersTable)
      .innerJoin(usersTable, eq(patientProvidersTable.patientId, usersTable.id))
      .where(eq(patientProvidersTable.providerId, provider.id))
      .all();

    res.json({
      data: {
        patients,
      },
    });
  },
);

//
// Assign an assessment to a patient.
//
// Note: We'd want the provider's user ID to come from an auth session. But,
// building full sessions was scoped out for this demo.
/*
curl -s -X POST http://localhost:3000/providers/PROVIDER123/patients/PATIENT123/assessments \
  -H "Content-Type: application/json" \
  -d '{"assessmentName": "BPDS" }' \
  | jq
*/
app.post(
  '/providers/:providerId/patients/:patientId/assessments',
  validate({
    params: {
      patientId: z.string(),
      providerId: z.string(),
    },
    body: {
      assessmentName: z.string(),
    },
  }),
  async (req, res) => {
    const provider = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, req.params.providerId))
      .get();
    if (!provider) {
      res.status(StatusCodes.NOT_FOUND).json({ errorMessage: 'No such provider' });
      return;
    }

    const patient = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, req.params.patientId))
      .get();
    if (!patient) {
      res.status(StatusCodes.NOT_FOUND).json({ errorMessage: 'No such patient' });
      return;
    }

    // Note: We could skip the provider and patient lookup and just look
    // at this table. However, for now, we're favoring providing specific
    // error messages.
    const patientCase = await db
      .select()
      .from(patientProvidersTable)
      .where(
        and(
          eq(patientProvidersTable.patientId, patient.id),
          eq(patientProvidersTable.providerId, provider.id),
          isNull(patientProvidersTable.offboardedAt),
        ),
      )
      .get();
    if (!patientCase) {
      res.status(StatusCodes.FORBIDDEN).json({ errorMessage: "Patient isn't assigned to provider" });
      return;
    }

    const assessment = await db
      .select({ id: assessmentsTable.id })
      .from(assessmentsTable)
      .where(eq(assessmentsTable.name, req.body.assessmentName))
      .get();
    if (!assessment) {
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({ errorMessage: 'No such assessment' });
      return;
    }

    const slug = generateSlug();

    // TODO: Hanlde possibility of slug collision
    // Note: Would want to set sentAt using another API call. But, for demo
    // purposes, just set it here.
    const assessmentInstance = await db.insert(assessmentInstancesTable)
      .values({
        providerId: provider.id,
        patientId: patient.id,
        assessmentId: assessment.id,
        slug,
        sentAt: new Date().toISOString(),
      })
      .returning()
      .get();

    res.status(StatusCodes.CREATED).json({
      data: {
        assessmentInstance,
      },
    });
  },
);

//
// Get assessment instance by slug.
//
// curl -s http://localhost:3000/assessment-instances/SLUG123 | jq
//
app.get(
  '/assessment-instances/:assessmentInstanceSlug',
  validate({
    params: {
      assessmentInstanceSlug: z.string(),
    },
  }),
  async (req, res) => {
    const assessmentInstance = await db
      .select({
        id: assessmentInstancesTable.id,
        assessmentId: assessmentInstancesTable.assessmentId,
        sentAt: assessmentInstancesTable.sentAt,
      })
      .from(assessmentInstancesTable)
      .where(eq(assessmentInstancesTable.slug, req.params.assessmentInstanceSlug))
      .get();
    if (!assessmentInstance) {
      res.status(StatusCodes.NOT_FOUND).json({ errorMessage: 'No such assessment instance' });
      return;
    }

    res.json({
      data: {
        assessmentInstance,
      },
    });
  },
);

//
// Record a response to a question for an assessment instance.
//
// Note: We'd want the patient's user ID to come from an auth session. But,
// building full sessions was scoped out for this demo.
/*
curl -X POST http://localhost:3000/patient/PATIENT123/assessments/ASSESSMENT123/responses \
  -H "Content-Type: application/json" \
  -d '{"questionId": "QUESTION1", "answerId": "ANSWER1"}'
*/
app.post(
  '/patient/:patientId/assessments/:assessmentInstanceId/responses',
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
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({ errorMessage: 'Assessment not assigned to patient' });
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
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({ errorMessage: "Answer isn't vaoid for target assessment" });
      return;
    }

    const assessmentResponse = await db.insert(assessmentInstanceResponsesTable)
      .values({
        assessmentInstanceId: assessmentInstance.id,
        questionId: question.id,
        answerId: answer.id,
      })
      .returning()
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
// Note: We'd want the patient's user ID to come from an auth session. But,
// building full sessions was scoped out for this demo.
/*
curl -X POST http://localhost:3000/patient/PATIENT123/assessments/ASSESSMENT123/submissions \
  -H "Content-Type: application/json"
*/
app.post(
  '/patient/:patientId/assessments/:assessmentInstanceId/submissions',
  validate({
    params: {
      assessmentInstanceId: z.string(),
      patientId: z.string(),
    },
  }),
  async (_req, res) => {
    // TODO:
    // 1. Verify that assessment instance hasn't already been submitted
    // 2. Verify all questions are answered
    // 3. Run rules engine (idempotency?)
    // 4. Record submission as complete
    res.status(StatusCodes.CREATED).json({
      results: ["ASRM", "PHQ-9"]
    });
  },
);

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
