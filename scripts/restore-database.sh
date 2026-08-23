#!/usr/bin/env bash
set -euo pipefail
: "${DB_HOST:?DB_HOST is required}"
: "${DB_DATABASE:?DB_DATABASE is required}"
: "${DB_USERNAME:?DB_USERNAME is required}"
: "${DB_PASSWORD:?DB_PASSWORD is required}"
input="${1:?Usage: RESTORE_CONFIRM=database-name restore-database.sh /absolute/backup.sql.gz}"
[[ "${RESTORE_CONFIRM:-}" == "$DB_DATABASE" ]] || { echo "Set RESTORE_CONFIRM=$DB_DATABASE" >&2; exit 2; }
[[ "$input" == /*.sql.gz && -f "$input" ]] || { echo "Input must be an existing absolute .sql.gz file" >&2; exit 2; }
gzip -t "$input"
gzip -dc "$input" | MYSQL_PWD="$DB_PASSWORD" mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USERNAME" "$DB_DATABASE"
