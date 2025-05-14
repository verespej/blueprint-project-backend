import { eq } from 'drizzle-orm';
import { type SelectedFieldsFlat } from 'drizzle-orm/sqlite-core';
import { v4 as uuid } from 'uuid';

import { db, USER_TYPES, usersTable } from '#src/db';
import { isSqlConstraintError } from '#src/utils/errors';

const AUTOMATED_ACTION_USER_EMAIL = 'blooprint-automated-action@does-not-exist.demo';
const AUTOMATED_ACTION_USER_GIVEN_NAME = 'Automated';
const AUTOMATED_ACTION_USER_FAMILY_NAME = 'Action';

// User ID should never change - safe to cache
let automatedActionUserId;
export async function getAutomatedActionUserId(): Promise<string> {
  if (!automatedActionUserId) {
    const user = await getAutomatedActionUser({ id: usersTable.id });
    automatedActionUserId = user.id
  }
  return automatedActionUserId;
}

// Note: Verbosity in this function with respect to handling of fields
// is to comply with type safety for the drizzle query builder.
export async function getAutomatedActionUser<
  TFields extends SelectedFieldsFlat
>(
  fields?: TFields
) {
  function createUserQuery() {
    const select = fields ? db.select(fields) : db.select();
    return select
      .from(usersTable)
      .where(eq(usersTable.email, AUTOMATED_ACTION_USER_EMAIL))
      .get();
  }

  let user = await createUserQuery();
  if (!user) {
    try {
      const insert = db
        .insert(usersTable)
        .values({
          email: AUTOMATED_ACTION_USER_EMAIL,
          familyName: AUTOMATED_ACTION_USER_FAMILY_NAME,
          givenName: AUTOMATED_ACTION_USER_GIVEN_NAME,
          password: uuid(),
          type: USER_TYPES.SYSTEM,
        });

      user = fields
        ? await insert.returning(fields).get()
        : await insert.returning().get();
    } catch (error) {
      if (isSqlConstraintError(error)) {
        // Someone beat us to the creation - retry query
        user = await createUserQuery();
      } else {
        throw error
      }
    }
  }

  if (!user) {
    throw new Error('Unable to create "automation action" system user');
  }

  return user;
}
