import { and, eq, isNull } from 'drizzle-orm';
import validate from 'express-zod-safe';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import {
  assessmentInstancesTable,
  assessmentsTable,
  db,
  patientProvidersTable,
  USER_TYPES,
  usersTable,
} from '#src/db';
import { generateSlug } from '#src/utils/slugs';

import { type TypAssessmentInstancePayload } from './common/types';

export function registerProvidersEndpoints(app) {
  //
  // Get patients for provider.
  //
  // Note: We'd want the provider's user ID to come from an auth session. But,
  // building full sessions was scoped out for this demo.
  //
  // curl -s http://localhost:3000/v1/providers/PROVIDER123/patients | jq
  //
  app.get(
    '/v1/providers/:providerId/patients',
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
          email: usersTable.email,
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
  // Get assessments assigned by a provider to a patient.
  //
  // Note: We'd want the provider's user ID to come from an auth session. But,
  // building full sessions was scoped out for this demo.
  //
  // curl -s http://localhost:3000/v1/providers/PROVIDER123/patients/PATIENT123/assessments | jq
  //
  app.get(
    '/v1/providers/:providerId/patients/:patientId/assessments',
    validate({
      params: {
        patientId: z.string(),
        providerId: z.string(),
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

      const assessmentInstances: TypAssessmentInstancePayload[] = await db
        .select({
          assessmentDisplayName: assessmentsTable.displayName,
          assessmentFullName: assessmentsTable.fullName,
          assessmentId: assessmentInstancesTable.assessmentId,
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
        .where(and(
          eq(assessmentInstancesTable.providerId, provider.id),
          eq(assessmentInstancesTable.patientId, patient.id),
        ))
        .all();

      res.status(StatusCodes.CREATED).json({
        data: {
          assessmentInstances,
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
  curl -s -X POST http://localhost:3000/v1/providers/PROVIDER123/patients/PATIENT123/assessments \
    -H "Content-Type: application/json" \
    -d '{"assessmentId": "ASSESSMENT123" }' \
    | jq
  */
  app.post(
    '/v1/providers/:providerId/patients/:patientId/assessments',
    validate({
      params: {
        patientId: z.string(),
        providerId: z.string(),
      },
      body: {
        assessmentId: z.string(),
      },
    }),
    async (req, res) => {
      const provider = await db
        .select({
          familyName: usersTable.familyName,
          givenName: usersTable.givenName,
          id: usersTable.id,
        })
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
        .select({
          displayName: assessmentsTable.displayName,
          fullName: assessmentsTable.fullName,
          id: assessmentsTable.id,
          name: assessmentsTable.name,
        })
        .from(assessmentsTable)
        .where(eq(assessmentsTable.id, req.body.assessmentId))
        .get();
      if (!assessment) {
        res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({ errorMessage: 'No such assessment' });
        return;
      }

      const slug = generateSlug();

      // TODO: Handle possibility of slug collision
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

      const assessmentInstanceResponse: TypAssessmentInstancePayload = {
        assessmentDisplayName: assessment.displayName,
        assessmentFullName: assessment.fullName,
        assessmentId: assessment.id,
        assessmentName: assessment.name,
        id: assessmentInstance.id,
        patientId: assessmentInstance.patientId,
        providerFamilyName: provider.familyName,
        providerGivenName: provider.givenName,
        providerId: provider.id,
        sentAt: assessmentInstance.sentAt,
        slug: assessmentInstance.slug,
        submittedAt: assessmentInstance.submittedAt,
      };
      res.status(StatusCodes.CREATED).json({
        data: {
          assessmentInstance: assessmentInstanceResponse,
        },
      });
    },
  );
}
