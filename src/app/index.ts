import express from 'express';

import { registerEndpoints } from '#src/api';

const app = express();
app.use(express.json());

registerEndpoints(app);

export { app };
