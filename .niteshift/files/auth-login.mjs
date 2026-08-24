#!/usr/bin/env node
/**
 * Writes a Playwright storage state file containing a signed-in umami session.
 *
 * Umami keeps its API token in localStorage under `umami.auth` (see
 * src/lib/constants.ts), so the session is minted through the public login API
 * with the credentials the 01_init migration seeds.
 */
import { writeFile } from 'node:fs/promises';

const port = process.env.PORT || 3000;
const origin = `http://localhost:${port}`;
const stateFile = process.env.NITESHIFT_AUTH_STATE_FILE;
const username = process.env.UMAMI_USERNAME || 'admin';
const password = process.env.UMAMI_PASSWORD || 'umami';

if (!stateFile) {
  console.error('NITESHIFT_AUTH_STATE_FILE is not set.');
  process.exit(1);
}

async function login() {
  const res = await fetch(`${origin}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    throw new Error(`login failed: HTTP ${res.status} ${await res.text()}`);
  }

  return (await res.json()).token;
}

let token;
let lastError;

for (let i = 0; i < 30; i++) {
  try {
    token = await login();
    break;
  } catch (e) {
    lastError = e;
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

if (!token) {
  console.error(lastError?.message ?? 'unable to log in');
  process.exit(1);
}

await writeFile(
  stateFile,
  JSON.stringify({
    cookies: [],
    origins: [
      {
        origin,
        localStorage: [{ name: 'umami.auth', value: JSON.stringify(token) }],
      },
    ],
  }),
);

console.log(`Wrote session for ${username} to ${stateFile}`);
