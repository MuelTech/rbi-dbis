import { describe, expect, it } from "vitest";
import { validateFamilyImportRow } from "./familyImportValidation.js";

function validRow() {
  return {
    household: { block: "1", household_number: "001" },
    address: { house_number: "12", street_name: "Rizal", alley: "A" },
    head: { last_name: "Dela Cruz", first_name: "Juan", sex: "Male" },
  };
}

describe("validateFamilyImportRow", () => {
  it("accepts a complete row", () => {
    expect(validateFamilyImportRow(validRow())).toBeNull();
  });

  it("rejects a row with no head", () => {
    const row = validRow();
    delete (row as any).head;
    expect(validateFamilyImportRow(row)).toBe("head.last_name is required");
  });

  it("rejects a row with no household block", () => {
    const row = validRow();
    delete (row as any).household.block;
    expect(validateFamilyImportRow(row)).toBe("household.block is required");
  });

  it("rejects a row with no household number", () => {
    const row = validRow();
    delete (row as any).household.household_number;
    expect(validateFamilyImportRow(row)).toBe(
      "household.household_number is required"
    );
  });

  it("rejects a household number outside 1-100", () => {
    const row = validRow();
    row.household.household_number = "101";
    expect(validateFamilyImportRow(row)).toBe(
      "household.household_number must be between 1 and 100"
    );
  });

  it("rejects a missing address field", () => {
    const row = validRow();
    delete (row as any).address.street_name;
    expect(validateFamilyImportRow(row)).toBe("address.street_name is required");
  });

  it("rejects a missing head field", () => {
    const row = validRow();
    delete (row as any).head.first_name;
    expect(validateFamilyImportRow(row)).toBe("head.first_name is required");
  });
});
