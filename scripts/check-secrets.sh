#!/usr/bin/env sh
set -eu

blocked_files='(^|/)(\.env($|\.)|auth\.json$|credentials\.json$|service-account.*\.json$|client-secret.*\.json$|google-services\.json$|GoogleService-Info\.plist$|id_rsa($|\.)|id_ed25519($|\.)|secrets/)|\.(pem|key|p12|pfx|jks|keystore|sql|dump)$'
tracked_files="$(git ls-files)"
if printf '%s\n' "$tracked_files" | grep -E "$blocked_files" | grep -Ev '(^|/)\.env\.example$' >/dev/null 2>&1; then
  echo 'Secret scan gagal: file sensitif terlacak.' >&2
  printf '%s\n' "$tracked_files" | grep -E "$blocked_files" | grep -Ev '(^|/)\.env\.example$' >&2 || true
  exit 1
fi

secret_patterns='(-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{30,}|github_pat_[A-Za-z0-9_]{30,}|sk_live_[A-Za-z0-9]{20,})'
if git grep -I -E "$secret_patterns" -- . ':!package-lock.json' ':!composer.lock' ':!scripts/check-secrets.sh' ':!scripts/git-hooks/pre-commit' >/dev/null 2>&1; then
  echo 'Secret scan gagal: pola credential ditemukan.' >&2
  exit 1
fi

echo 'Secret scan lulus.'
