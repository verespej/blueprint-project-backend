import { registerAssessmentsEndpoints } from './assessments';
import { registerPatientsEndpoints } from './patients';
import { registerProvidersEndpoints } from './providers';
import { registerSessionsEndpoints } from './sessions';
import { registerUsersEndpoints } from './users';

export function registerEndpoints(app) {
  registerAssessmentsEndpoints(app);
  registerPatientsEndpoints(app);
  registerProvidersEndpoints(app);
  registerSessionsEndpoints(app);
  registerUsersEndpoints(app);
}
