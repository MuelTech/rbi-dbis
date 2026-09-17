import type { Prisma } from "@rbi/db";

function nameTerm(value: string): Prisma.ResidentWhereInput {
  return {
    OR: [
      { firstName: { contains: value } },
      { middleName: { contains: value } },
      { lastName: { contains: value } },
    ],
  };
}

/**
 * Builds the Prisma `where` clause for resident search.
 *
 * Splits the query on whitespace and punctuation so a full display name such as
 * "Juan Santos. Dela Cruz" is matched term-by-term across first, middle and last
 * name (every term must match at least one field). A purely numeric query also
 * matches the display id.
 */
export function buildResidentSearchWhere(
  search: string
): Prisma.ResidentWhereInput | null {
  const trimmed = search.trim();
  if (!trimmed) return null;

  const termConditions = trimmed
    .split(/[\s.,]+/)
    .filter(Boolean)
    .map(nameTerm);

  if (/^\d+$/.test(trimmed)) {
    return {
      OR: [...termConditions, { displayId: { equals: Number(trimmed) } }],
    };
  }

  return { AND: termConditions };
}
