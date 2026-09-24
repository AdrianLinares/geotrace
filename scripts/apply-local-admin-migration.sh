#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL must be set in the environment}"
psql --set=ON_ERROR_STOP=1 "$DATABASE_URL" -f sql/migrations/002_local_admin_credentials.sql
