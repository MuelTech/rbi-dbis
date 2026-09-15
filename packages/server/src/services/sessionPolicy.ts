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
