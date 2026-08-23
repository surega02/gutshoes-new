#!/usr/bin/env bash
set -euo pipefail
: "${DB_HOST:?DB_HOST is required}"
: "${DB_DATABASE:?DB_DATABASE is required}"
: "${DB_USERNAME:?DB_USERNAME is required}"
: "${DB_PASSWORD:?DB_PASSWORD is required}"
output="${1:?Usage: backup-database.sh /absolute/output.sql.gz}"
case "$output" in /*.sql.gz) ;; *) echo "Output must be an absolute .sql.gz path" >&2; exit 2;; esac
umask 077
MYSQL_PWD="$DB_PASSWORD" mysqldump --single-transaction --routines --triggers --no-tablespaces -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USERNAME" "$DB_DATABASE" | gzip -9 > "$output"
gzip -t "$output"
