import { drizzle } from 'drizzle-orm/better-sqlite3';

export * from './schema/assessment-instance-responses';
export * from './schema/assessment-instances';
export * from './schema/assessment-section-answers';
export * from './schema/assessment-section-questions';
export * from './schema/assessment-sections';
export * from './schema/assessments';
export * from './schema/disorders';
export * from './schema/patient-providers';
export * from './schema/submission-rules';
export * from './schema/users';

export const db = drizzle(process.env.DB_URL || 'db.sqlite3');
