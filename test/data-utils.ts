import { sql } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';

import {
  ASSESSMENT_SECTION_TYPES,
  ASSESSMENT_SECTION_ANSWER_VALUE_TYPES,
  assessmentSectionAnswersTable,
  assessmentSectionQuestionsTable,
  assessmentSectionsTable,
  assessmentsTable,
  db,
  disordersTable,
  MIGRATIONS_TABLE_NAME,
} from '#src/db';

function randNumber({
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
} = {}) {
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
}) {
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
}) {
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
}) {
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
}) {
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
