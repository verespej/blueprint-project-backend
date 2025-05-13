import { eq } from 'drizzle-orm';
import validate from 'express-zod-safe';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { db, usersTable } from '#src/db';

export function registerSessionsEndpoints(app) {
  //
  // Initiate a session.
  //
  // Note: This isn't the way I'd approach auth. Obviously, there's a load
  // of security and privacy issues here. It's just for demo purposes. We
  // don't even actually create a session for now.
  /*
  curl -s -X POST http://localhost:3000/v1/sessions \
    -H "Content-Type: application/json" \
    -d '{"email": "good.therapist@example.com", "password": "test123" }' \
    | jq
  */
  app.post(
    '/v1/sessions',
    validate({
      body: {
        email: z.string().email(),
        password: z.string(),
      },
    }),
    async (req, res) => {
      const user = await db.select()
        .from(usersTable)
        .where(eq(usersTable.email, req.body.email))
        .get();
      if (!user || user.password !== req.body.password) {
        // Return unauthorized if user doesn't exist to avoid leaking info
        // about the existance of users
        res.status(StatusCodes.UNAUTHORIZED).json({ errorMessage: 'No such user' });
        return;
      }

      res.status(StatusCodes.CREATED).json({
        data: {
          initiatedAt: new Date().toISOString(),
          user: {
            email: user.email,
            familyName: user.familyName,
            givenName: user.givenName,
            id: user.id,
            type: user.type,
          },
        },
      });
    },
  );

  //
  // Termiante a session.
  //
  // curl -s -X DELETE http://localhost:3000/v1/sessions | jq
  //
  app.delete(
    '/v1/sessions',
    async (_req, res) => {
      res.status(StatusCodes.OK).json({
        data: {
          terminatedAt: new Date().toISOString(),
        },
      });
    },
  );
}
