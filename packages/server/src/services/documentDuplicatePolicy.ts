/**
 * Rules for whether an already-issued document of the same type is still
 * within its validity. A document type with no configured validity
 * (null/undefined/0 days) is treated as never expiring, so any prior
 * issuance of that type is considered still valid.
 */

export function documentValidUntil(
  issueDate: Date,
  validityDays: number | null | undefined
): Date | null {
  if (!validityDays || validityDays <= 0) return null;
  const d = new Date(issueDate.getTime());
  d.setDate(d.getDate() + validityDays);
  return d;
}

export function isDocumentStillValid(
  issueDate: Date,
  validityDays: number | null | undefined,
  now: Date = new Date()
): boolean {
  const validUntil = documentValidUntil(issueDate, validityDays);
  if (!validUntil) return true;
  const end = new Date(validUntil.getTime());
  end.setHours(23, 59, 59, 999);
  return now.getTime() <= end.getTime();
}
