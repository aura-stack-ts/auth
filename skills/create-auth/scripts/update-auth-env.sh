#!/usr/bin/env bash
set -euo pipefail

env_path="${1:-.env}"

generate_secret() {
  openssl rand -base64 32 | tr -d '\n'
}

write_default_file() {
  cat > "$env_path" <<EOF
AURA_AUTH_SALT="$(generate_secret)"
AURA_AUTH_SECRET="$(generate_secret)"
EOF
}

if [[ ! -f "$env_path" ]]; then
  write_default_file
  printf 'Created %s with missing auth secrets.\n' "$env_path"
  exit 0
fi

tmp_file="$(mktemp)"
trap 'rm -f "$tmp_file"' EXIT

salt_line=""
secret_line=""
salt_set=0
secret_set=0

while IFS= read -r line || [[ -n "$line" ]]; do
  if [[ "$line" =~ ^AURA_AUTH_SALT=(.*)$ ]]; then
    salt_line="$line"
    salt_value="${BASH_REMATCH[1]}"
    salt_trimmed="${salt_value//[[:space:]]/}"
    if [[ -n "$salt_trimmed" && "$salt_trimmed" != '""' ]]; then
      salt_set=1
    fi
    continue
  fi
  
  if [[ "$line" =~ ^AURA_AUTH_SECRET=(.*)$ ]]; then
    secret_line="$line"
    secret_value="${BASH_REMATCH[1]}"
    secret_trimmed="${secret_value//[[:space:]]/}"
    if [[ -n "$secret_trimmed" && "$secret_trimmed" != '""' ]]; then
      secret_set=1
    fi
    continue
  fi
  
  printf '%s\n' "$line" >> "$tmp_file"
done < "$env_path"

if [[ $salt_set -eq 1 ]]; then
  printf '%s\n' "$salt_line" >> "$tmp_file"
else
  printf 'AURA_AUTH_SALT="%s"\n' "$(generate_secret)" >> "$tmp_file"
fi

if [[ $secret_set -eq 1 ]]; then
  printf '%s\n' "$secret_line" >> "$tmp_file"
else
  printf 'AURA_AUTH_SECRET="%s"\n' "$(generate_secret)" >> "$tmp_file"
fi

mv "$tmp_file" "$env_path"
trap - EXIT
printf 'Updated %s with missing auth secrets.\n' "$env_path"