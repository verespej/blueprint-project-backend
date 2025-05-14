import { eq, inArray } from 'drizzle-orm';
import validate from 'express-zod-safe';
import { StatusCodes } from 'http-status-codes';
import { groupBy } from 'lodash';
import { z } from 'zod';

import {
  ASSESSMENT_SECTION_ANSWER_VALUE_TYPES,
  assessmentInstancesTable,
  assessmentSectionAnswersTable,
  assessmentSectionQuestionsTable,
  assessmentSectionsTable,
  assessmentsTable,
  db,
  disordersTable,
} from '#src/db';

export function registerAssessmentsEndpoints(app) {
  //
  // List available assessments.
  //
  // TODO: Pagination.
  //
  // curl -s http://localhost:3000/v1/assessments | jq
  //
  app.get(
    '/v1/assessments',
    async (_req, res) => {
      const assessments = await db
        .select({
            displayName: assessmentsTable.displayName,
            disorderDisplayName: disordersTable.displayName,
            fullName: assessmentsTable.fullName,
            id: assessmentsTable.id,
            name: assessmentsTable.name,
        })
        .from(assessmentsTable)
        .innerJoin(disordersTable, eq(assessmentsTable.disorderId, disordersTable.id))
        .all();

      res.json({
        data: {
          assessments,
        },
      });
    },
  );

  //
  // Get assessment by ID.
  //
  // curl -s http://localhost:3000/v1/assessments/ASSESSMENT123 | jq
  //
  app.get(
    '/v1/assessments/:assessmentId',
    validate({
      params: {
        assessmentId: z.string(),
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
        .where(eq(assessmentsTable.id, req.params.assessmentId))
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
            displayOrder: a.displayOrder,
            id: a.id,
            title: a.title,
            value,
          };
        }).sort((l, r) => l.displayOrder - r.displayOrder);
        const formattedQuestions = (questionsBySectionId[section.id] || []).map(q => ({
          displayOrder: q.displayOrder,
          id: q.id,
          title: q.title,
        })).sort((l, r) => l.displayOrder - r.displayOrder);

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
            fullName: assessment.fullName,
            content: {
              displayName: assessment.displayName,
              sections: formattedSections,
            },
          },
        },
      });
    },
  );

  //
  // Get assessment instance by slug.
  //
  // curl -s http://localhost:3000/v1/assessment-instance-slugs/SLUG123 | jq
  //
  app.get(
    '/v1/assessment-instance-slugs/:assessmentInstanceSlug',
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
}
