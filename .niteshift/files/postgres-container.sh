#!/usr/bin/env bash
# Foreground lifecycle wrapper for umami's PostgreSQL container.
#
# The image and credentials are the ones the project's docker-compose.yml uses.
# Host networking is required because bridge networking is unavailable to this
# sandbox's nested Docker daemon, so the database is reachable on
# localhost:5432 exactly as DATABASE_URL expects.
#
# A TERM from `ns` is translated into `docker stop`, which the postgres image
# handles as a fast shutdown (its STOPSIGNAL is SIGINT). A plain forwarded
# SIGTERM would instead begin a smart shutdown that waits for the dev server's
# pooled connections to close, and the supervisor would have to kill it.
set -uo pipefail

NAME=umami-postgres # `.niteshift/setup` waits on this container by name

# A container left behind by a killed supervisor, or by a resume, would keep
# the name and the port.
docker rm -f "$NAME" >/dev/null 2>&1 || true

docker run --rm --name "$NAME" --network=host \
  -e POSTGRES_DB=umami \
  -e POSTGRES_USER=umami \
  -e POSTGRES_PASSWORD=umami \
  -v umami-db-data:/var/lib/postgresql/data \
  postgres:15-alpine &
container=$!

trap 'docker stop -t 20 "$NAME" >/dev/null 2>&1 || true' TERM INT

wait "$container"
status=$?

# `wait` returns as soon as the trap runs; wait again for the real exit.
if [ "$status" -gt 128 ]; then
  wait "$container" 2>/dev/null
  status=$?
fi

exit "$status"
