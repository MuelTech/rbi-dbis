export interface FamilyImportRow {
  household?: { block?: unknown; household_number?: unknown };
  address?: { house_number?: unknown; street_name?: unknown; alley?: unknown };
  head?: { last_name?: unknown; first_name?: unknown; sex?: unknown };
}

function present(value: unknown): boolean {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

/**
 * Validates one row of a batch family import before it touches the database.
 *
 * Mirrors the registration flow's requirements: a block, a household number in
 * 1-100, a complete address, and a complete family head. Returns the first
 * problem found, or null when the row is acceptable.
 */
export function validateFamilyImportRow(family: FamilyImportRow): string | null {
  const household = family?.household;
  if (!present(household?.block)) {
    return "household.block is required";
  }
  if (!present(household?.household_number)) {
    return "household.household_number is required";
  }
  const hhNum = parseInt(String(household!.household_number), 10);
  if (isNaN(hhNum) || hhNum < 1 || hhNum > 100) {
    return "household.household_number must be between 1 and 100";
  }

  const address = family?.address;
  if (!present(address?.house_number)) {
    return "address.house_number is required";
  }
  if (!present(address?.street_name)) {
    return "address.street_name is required";
  }
  if (!present(address?.alley)) {
    return "address.alley is required";
  }

  const head = family?.head;
  if (!present(head?.last_name)) {
    return "head.last_name is required";
  }
  if (!present(head?.first_name)) {
    return "head.first_name is required";
  }
  if (!present(head?.sex)) {
    return "head.sex is required";
  }

  return null;
}
