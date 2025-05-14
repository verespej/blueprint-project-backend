import { v4 as uuid } from 'uuid';
import { beforeAll, describe, expect, it} from 'vitest';

import { db, USER_TYPES, usersTable } from '#src/db';
import { clearDb } from '#test/data-utils';

import { isSqlConstraintError } from './errors';

describe('errors util', () => {
  beforeAll(async () => {
    await clearDb();
  });

  describe('isSqlConstraintError', () => {
    it('is correct', async () => {
      const email = `${uuid()}@${uuid()}.com`;

      await db.insert(usersTable)
        .values({
          email,
          familyName: uuid(),
          givenName: uuid(),
          password: uuid(),
          type: USER_TYPES.SYSTEM,
        });

      let caughtError;
      try {
        await db.insert(usersTable)
          .values({
            email,
            familyName: uuid(),
            givenName: uuid(),
            password: uuid(),
            type: USER_TYPES.SYSTEM,
          });
      } catch (error) {
        caughtError = error;
      }

      let result = isSqlConstraintError(caughtError);
      expect(result).toBe(true);

      result = isSqlConstraintError(uuid());
      expect(result).toBe(false);
      result = isSqlConstraintError(new Error());
      expect(result).toBe(false);
    });
  });
});
