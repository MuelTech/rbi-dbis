/**
 * Canonical full-name display: "First Middle Last Suffix".
 *
 * Accepts either camelCase API objects or raw snake_case payloads, and omits
 * empty parts so there are never doubled spaces or stray separators.
 */
export function getFullName(resident: any): string {
  const first = resident.firstName || resident.first_name || "";
  const middle = resident.middleName || resident.middle_name || "";
  const last = resident.lastName || resident.last_name || "";
  const suffix = resident.suffix || "";

  return [first, middle, last, suffix]
    .map((part) => String(part).trim())
    .filter(Boolean)
    .join(" ");
}
