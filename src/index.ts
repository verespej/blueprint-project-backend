import express from 'express';
import validate from 'express-zod-safe';
import { StatusCodes } from 'http-status-codes';
import { groupBy } from 'lodash';
import { z } from 'zod';

import { and, eq, inArray, isNull } from 'drizzle-orm';

import {
  ASSESSMENT_SECTION_ANSWER_VALUE_TYPES,
  // assessmentInstanceResponsesTable,
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
// Create responses for an assessment instance.
//
// Note: We'd want the patient's user ID to come from an auth session. But,
// building full sessions was scoped out for this demo.
// Note: I'd prefer to hand an endpoint that receives each response as the
// user makes progress, then a "submit" endpoint. However, I'm sticking
// with the speck for this demo.
/*
curl -X POST http://localhost:3000/patient/PATIENT123/assessments/ASSESSMENT123/responses \
  -H "Content-Type: application/json" \
  -d '{"answers": [{ "question_id": "question_a", "value": 1 }, { "question_id": "question_b", "value": 2 }]}'
*/
app.post(
  '/patient/:patientId/assessments/:assessmentInstanceId/responses',
  validate({
    params: {
      assessmentInstanceId: z.string(),
      patientId: z.string(),
    },
    body: {
      answers: z.array(
        z.object({
          question_id: z.string(),
          value: z.number(),
        }),
      ),
    },
  }),
  (_req, res) => {
    // TODO: Write to assessmentInstanceResponsesTable
    res.status(StatusCodes.CREATED).json({
      results: ["ASRM", "PHQ-9"]
    });
  },
);

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
