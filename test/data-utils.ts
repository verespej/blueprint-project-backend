import { InferModel, sql } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';

import {
  ASSESSMENT_SECTION_TYPES,
  ASSESSMENT_SECTION_ANSWER_VALUE_TYPES,
  assessmentInstanceResponsesTable,
  assessmentInstancesTable,
  assessmentSectionAnswersTable,
  assessmentSectionQuestionsTable,
  assessmentSectionsTable,
  assessmentsTable,
  db,
  disordersTable,
  MIGRATIONS_TABLE_NAME,
  TypDisorder,
  TypAssessment,
  TypAssessmentInstance,
  TypAssessmentResponse,
  TypAssessmentSection,
  TypAssessmentSectionAnswer,
  TypAssessmentSectionQuestion,
  TypUser,
  USER_TYPES,
  usersTable,
} from '#src/db';

export function randNumber({
  min = 0, // Inclusive
  max = 1001, // Exclusive
  floatingPoint = false,
}: {
  min?: number;
  max?: number;
  floatingPoint?: boolean;
} = {}): number {
  const range = max - min;
  const val = min + (Math.random() * range);
  return floatingPoint ? val : Math.floor(val);
}

export async function clearDb() {
  // Note: In non-SQLite DB's, drizzle may create a "*_lock" table
  const tableNames = db
    .all<{ name: string }>(
      sql`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name NOT LIKE 'sqlite_%'
          AND name NOT IN (${MIGRATIONS_TABLE_NAME})
      `
    )
    .map(row => row.name);

  for (const tableName of tableNames) {
    await db.run(`DELETE FROM "${tableName}"`);
  }
}

export async function createDisorder({
  name = uuid(),
  displayName = uuid(),
} = {}): Promise<TypDisorder> {
  return await db.insert(disordersTable)
    .values({
      name,
      displayName,
    })
    .returning()
    .get();
}

export async function createAssessment({
  disorderId,
  displayName = uuid(),
  fullName = uuid(),
  locked = false,
  name = uuid(),
}): Promise<TypAssessment> {
  return await db.insert(assessmentsTable)
    .values({
      disorderId,
      displayName,
      fullName,
      locked,
      name,
    })
    .returning()
    .get();
}

export async function createAssessmentSection({
  assessmentId,
  title = uuid(),
  type = ASSESSMENT_SECTION_TYPES.STANDARD,
}): Promise<TypAssessmentSection> {
  return await db.insert(assessmentSectionsTable)
    .values({
      assessmentId,
      title,
      type,
    })
    .returning()
    .get();
}

export async function createAssessmentQuestion({
  assessmentSectionId,
  disorderId,
  displayOrder = 0,
  title = uuid(),
}): Promise<TypAssessmentSectionQuestion> {
  return await db.insert(assessmentSectionQuestionsTable)
    .values({
      assessmentSectionId,
      disorderId,
      displayOrder,
      title,
    })
    .returning()
    .get();
}

export async function createAssessmentAnswer({
  assessmentSectionId,
  displayOrder = 0,
  title = uuid(),
  value = randNumber(),
  valueType = ASSESSMENT_SECTION_ANSWER_VALUE_TYPES.NUMBER,
}): Promise<TypAssessmentSectionAnswer> {
  return await db.insert(assessmentSectionAnswersTable)
    .values({
      assessmentSectionId,
      displayOrder,
      title,
      value: value.toString(),
      valueType,
    })
    .returning()
    .get();
}

export async function createUser({
  email = `${uuid()}@example.com`,
  familyName = uuid(),
  givenName = uuid(),
  password = uuid(),
  type = USER_TYPES.PROVIDER,
}: Partial<InferModel<typeof usersTable, 'insert'>>): Promise<TypUser> {
  return await db.insert(usersTable)
    .values({
      email,
      familyName,
      givenName,
      password,
      type,
    })
    .returning()
    .get();
}

export async function createAssessmentInstance({
  providerId,
  patientId,
  assessmentId,
  slug = uuid(),
  sentAt = new Date().toISOString(),
}): Promise<TypAssessmentInstance> {
  return await db.insert(assessmentInstancesTable)
    .values({
      providerId,
      patientId,
      assessmentId,
      slug,
      sentAt,
    })
    .returning()
    .get();
}

export async function createAssessmentResponse({
  assessmentInstanceId,
  questionId,
  answerId,
}): Promise<TypAssessmentResponse> {
  return await db.insert(assessmentInstanceResponsesTable)
    .values({
      assessmentInstanceId,
      questionId,
      answerId,
    })
    .returning()
    .get();
}
