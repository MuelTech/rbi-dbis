import { describe, expect, it } from "vitest";
import { buildResidentSearchWhere } from "./residentSearch.js";

const term = (value: string) => ({
  OR: [
    { firstName: { contains: value } },
    { middleName: { contains: value } },
    { lastName: { contains: value } },
  ],
});

describe("buildResidentSearchWhere", () => {
  it("returns null for empty or whitespace-only search", () => {
    expect(buildResidentSearchWhere("")).toBeNull();
    expect(buildResidentSearchWhere("   ")).toBeNull();
  });

  it("matches a single term against first, middle, or last name", () => {
    expect(buildResidentSearchWhere("Santos")).toEqual({
      AND: [term("Santos")],
    });
  });

  it("splits a full display name into ANDed terms so middle names match", () => {
    expect(buildResidentSearchWhere("Juan Santos. Dela Cruz")).toEqual({
      AND: [term("Juan"), term("Santos"), term("Dela"), term("Cruz")],
    });
  });

  it("matches a plain two-name query", () => {
    expect(buildResidentSearchWhere("Dela Cruz")).toEqual({
      AND: [term("Dela"), term("Cruz")],
    });
  });

  it("includes a display-id equality when the search is numeric", () => {
    expect(buildResidentSearchWhere("283")).toEqual({
      OR: [term("283"), { displayId: { equals: 283 } }],
    });
  });
});
