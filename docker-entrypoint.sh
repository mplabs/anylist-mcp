#!/bin/sh
set -e

if [ -n "${ANYLIST_EMAIL_FILE:-}" ]; then
  export ANYLIST_EMAIL="$(cat "$ANYLIST_EMAIL_FILE")"
fi

if [ -n "${ANYLIST_PASSWORD_FILE:-}" ]; then
  export ANYLIST_PASSWORD="$(cat "$ANYLIST_PASSWORD_FILE")"
fi

exec "$@"
