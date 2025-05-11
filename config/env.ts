import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import path from 'path';

function loadEnvFile(filePath: string): void {
  if (existsSync(filePath)) {
    dotenv.config({ path: filePath, override: true });
  }
}

const workindDir = process.cwd();
loadEnvFile(path.resolve(workindDir, '.env'));
loadEnvFile(path.resolve(workindDir, `.env.${process.env.NODE_ENV}`));
