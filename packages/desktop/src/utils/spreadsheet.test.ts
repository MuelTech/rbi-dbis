import { describe, expect, it } from "vitest";
import { readSheetRows } from "./spreadsheet";

function csvBuffer(csv: string): ArrayBuffer {
  return new TextEncoder().encode(csv).buffer;
}

describe("readSheetRows", () => {
  it("keeps date and leading-zero fields as strings", () => {
    const csv = [
      "family_id,household_number,contact_number,date_of_birth",
      "FAM-1,001,09171234567,1980-01-01",
    ].join("\n");

    expect(readSheetRows(csvBuffer(csv))).toEqual([
      {
        family_id: "FAM-1",
        household_number: "001",
        contact_number: "09171234567",
        date_of_birth: "1980-01-01",
      },
    ]);
  });

  it("lowercases and snake-cases the headers", () => {
    const csv = "Family ID,First Name\nFAM-1,Juan";
    expect(readSheetRows(csvBuffer(csv))).toEqual([
      { family_id: "FAM-1", first_name: "Juan" },
    ]);
  });
});
