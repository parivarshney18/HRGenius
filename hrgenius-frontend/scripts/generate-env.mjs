import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const frontendRoot = resolve(import.meta.dirname, '..');
const envFile = resolve(frontendRoot, '.env');

function readDotEnvValue(name) {
  if (!existsSync(envFile)) return '';

  const line = readFileSync(envFile, 'utf8')
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(`${name}=`));

  return line ? line.slice(line.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '') : '';
}

const configuredBackend = process.env.BACKEND_API?.trim() || readDotEnvValue('BACKEND_API');
const backendApi = (configuredBackend || 'http://localhost:8080').replace(/\/$/, '');
const apiUrl = backendApi.endsWith('/api') ? backendApi : `${backendApi}/api`;
const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim() || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

const environment = (production) => `export const environment = {
  production: ${production},
  apiUrl: '${apiUrl}',
  useMock: false,
  googleClientId: '${googleClientId}'
};
`;

writeFileSync(resolve(frontendRoot, 'src/environments/environment.ts'), environment(false));
writeFileSync(resolve(frontendRoot, 'src/environments/environment.prod.ts'), environment(true));

console.log(`Frontend API configured as ${apiUrl}`);
