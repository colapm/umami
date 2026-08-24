#!/usr/bin/env node

import { createServer } from 'node:http';

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost:3002');

  if (request.method !== 'GET' || url.pathname !== '/__niteshift/login') {
    response.writeHead(404).end();
    return;
  }

  let token;

  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      const login = await fetch('http://127.0.0.1:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'umami' }),
      });

      if (login.ok) {
        ({ token } = await login.json());
        break;
      }
    } catch {
      // The development server may still be starting.
    }

    if (attempt < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  if (!token) {
    response.writeHead(503).end('Unable to authenticate the development user.');
    return;
  }

  const requestedPath = url.searchParams.get('returnTo');
  const returnTo =
    requestedPath?.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/';

  response
    .writeHead(302, {
      Location: returnTo,
      'Set-Cookie': `niteshift_umami_auth=${token}; Path=/; HttpOnly; SameSite=Lax`,
    })
    .end();
});

server.listen(3002, '127.0.0.1');

const shutdown = () => server.close(() => process.exit(0));

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
