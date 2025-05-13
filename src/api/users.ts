import { eq } from 'drizzle-orm';
import validate from 'express-zod-safe';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { db, usersTable } from '#src/db';

export function registerUsersEndpoints(app) {
  //
  // Get user by email.
  //
  // curl -s http://localhost:3000/v1/users/good.therapist%40example.com | jq
  //
  app.get(
    '/v1/users/:email',
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
}
