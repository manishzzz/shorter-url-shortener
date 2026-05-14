#!/bin/sh
set -e

./node_modules/.bin/prisma migrate deploy --schema packages/database/prisma/schema.prisma
exec node apps/api/dist/server.js
