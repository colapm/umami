// Preview authentication for umami (services.yaml: web.auth.type = cookie-file).
//
// Umami keeps its session as a JWT in localStorage under "umami.auth" and sends
// it as a bearer token; it sets no session cookie. This logs in as the default
// admin user that migration 01_init seeds (admin / umami, documented in the
// README) and writes the browser state Niteshift hands to the agent browser.
import { writeFile } from 'node:fs/promises';

const port = process.env.PORT || '3000';
const origin = `http://localhost:${port}`;
const stateFile = process.env.NITESHIFT_AUTH_STATE_FILE;

if (!stateFile) {
  console.error('NITESHIFT_AUTH_STATE_FILE is not set');
  process.exit(1);
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// The dev server compiles routes on first request, so give it room.
async function waitForApp() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${origin}/api/heartbeat`);
      if (res.ok) return;
    } catch {
      // not listening yet
    }
    await sleep(2000);
  }
  throw new Error(`${origin} did not respond to /api/heartbeat`);
}

async function login() {
  const res = await fetch(`${origin}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'umami' }),
  });

  if (!res.ok) {
    throw new Error(`login failed with HTTP ${res.status}`);
  }

  const { token } = await res.json();

  if (!token) {
    throw new Error('login response contained no token');
  }

  return token;
}

await waitForApp();
const token = await login();

await writeFile(
  stateFile,
  JSON.stringify(
    {
      cookies: [],
      origins: [
        {
          origin,
          localStorage: [{ name: 'umami.auth', value: JSON.stringify(token) }],
        },
      ],
    },
    null,
    2,
  ),
);

console.log(`wrote an admin session for ${origin}`);
