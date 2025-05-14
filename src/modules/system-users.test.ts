import { eq } from 'drizzle-orm';
import { describe, expect, it} from 'vitest';

import { db, USER_TYPES, usersTable } from '#src/db';
import { clearDb } from '#test/data-utils';

import {
  getAutomatedActionUser,
  getAutomatedActionUserId,
} from './system-users';

describe('system-users', () => {
  describe('getAutomatedActionUser', () => {
    it('creates user if not exists', async () => {
      await clearDb();

      const user = await getAutomatedActionUser();
      expect(user).toBeDefined();
      expect(user.type).toEqual(USER_TYPES.SYSTEM);

      const systemUsers = await db.select()
        .from(usersTable)
        .where(eq(usersTable.type, USER_TYPES.SYSTEM))
        .all();
      expect(systemUsers).toHaveLength(1);

      const retrievedUser = systemUsers[0];
      expect(retrievedUser.id).toEqual(user.id);
    });

    it('selects specified fields', async () => {
      await clearDb();

      const fields = { id: usersTable.id, givenName: usersTable.givenName };

      // Test when user's created
      let user = await getAutomatedActionUser(fields);
      expect(Object.keys(user)).toEqual(Object.keys(fields));

      // And again, when user already exists
      user = await getAutomatedActionUser(fields);
      expect(Object.keys(user)).toEqual(Object.keys(fields));
    });
  });

  describe('getAutomatedActionUserId', () => {
    it('succeeds', async () => {
      const firstCallUserId = await getAutomatedActionUserId();
      expect(firstCallUserId).toBeDefined();

      // Note: Second call should use cached result
      const secondCallUserId = await getAutomatedActionUserId();
      expect(secondCallUserId).toEqual(firstCallUserId);
    });
  });
});
