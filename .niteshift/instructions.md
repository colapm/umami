# Niteshift instructions for umami

## Environment

The sandbox runs the app with `pnpm dev` against a PostgreSQL container, both supervised as
Niteshift services. Setup applies the Prisma migrations, which seed the default administrator
(username `admin`, password `umami`). The agent browser is already signed in as that user at
`http://localhost:3000`; the public preview opens on the login screen, where the same credentials
work.

The database starts empty, so analytics screens have nothing to show. When a change depends on
realistic traffic, generate it with `pnpm seed-data` before judging a screen or a query.

## Working in this repository

- Apply schema changes as a new Prisma migration under `prisma/migrations`, then run
  `pnpm update-db`. Never edit a migration that has already been applied.
- Restart the `web` service after changing `next.config.ts`, `.env`, or anything else the dev
  server reads only at startup. Everything else hot-reloads.

## Before reporting a task complete

- Run the tests that cover the change (`pnpm test`) and `pnpm lint`, and report failures rather
  than working around them.
- Exercise every changed user flow in the browser, signed in, at desktop and mobile widths, and
  attach screenshots of the result to the pull request.
- Say plainly which parts of the change were verified and which were not.
