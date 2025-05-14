import { SqliteError } from 'better-sqlite3';

const SQL_CONSTRAINT_ERROR_PREFIX = 'SQLITE_CONSTRAINT';

export function isSqlConstraintError(error): boolean {
  return (
    error instanceof SqliteError &&
    error.code.startsWith(SQL_CONSTRAINT_ERROR_PREFIX)
  );
}
