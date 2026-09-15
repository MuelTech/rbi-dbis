/**
 * Decides whether a JWT is still valid relative to the system-wide session
 * cutoff. `iatSeconds` is the token's `iat` claim (seconds). A token issued
 * before `cutoff` must be rejected — this is how a full data restore
 * invalidates every client's existing session at once.
 */
export function isTokenAfterCutoff(
  iatSeconds: number | undefined,
  cutoff: Date | null | undefined
): boolean {
  if (!cutoff) return true;
  if (typeof iatSeconds !== "number") return false;
  return iatSeconds * 1000 >= cutoff.getTime();
}

/**
 * Per-user session invalidation. Each login embeds the user's current
 * `tokenVersion`; changing a password increments it, so any token carrying an
 * older version is rejected. Tokens issued before this field existed have no
 * version and are treated as 0.
 */
export function isTokenVersionCurrent(
  tokenVersion: number | undefined,
  currentVersion: number
): boolean {
  return (tokenVersion ?? 0) === currentVersion;
}
