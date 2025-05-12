import cors from 'cors';
import express from 'express';

import { registerEndpoints } from '#src/api';

const app = express();

// TODO: This is just set up for demo purposes. Need to review how to approach
// if actually deploying.
app.use(cors({
  origin: [(process.env.CORS_ORIGINS ?? '').split('|')],
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  // credentials: true, // Enable if need to send cookies/auth headers
}));

app.use(express.json());

registerEndpoints(app);

export { app };
