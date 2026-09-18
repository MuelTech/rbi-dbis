import { describe, it, expect } from "vitest";
import {
  documentValidUntil,
  isDocumentStillValid,
} from "./documentDuplicatePolicy.js";

describe("documentDuplicatePolicy", () => {
  const issue = new Date("2026-01-01T00:00:00.000Z");

  it("returns null validUntil when no validity is configured", () => {
    expect(documentValidUntil(issue, null)).toBeNull();
    expect(documentValidUntil(issue, undefined)).toBeNull();
    expect(documentValidUntil(issue, 0)).toBeNull();
  });

  it("computes validUntil as issue date + validity days", () => {
    expect(documentValidUntil(issue, 30)?.toISOString().slice(0, 10)).toBe(
      "2026-01-31"
    );
  });

  it("treats no validity as never expiring", () => {
    const far = new Date("2099-01-01T00:00:00.000Z");
    expect(isDocumentStillValid(issue, null, far)).toBe(true);
    expect(isDocumentStillValid(issue, 0, far)).toBe(true);
  });

  it("is valid on the boundary day and expired the day after", () => {
    expect(
      isDocumentStillValid(issue, 30, new Date("2026-01-31T12:00:00.000Z"))
    ).toBe(true);
    expect(
      isDocumentStillValid(issue, 30, new Date("2026-02-01T00:00:00.000Z"))
    ).toBe(false);
  });

  it("is valid before expiry and expired after", () => {
    expect(
      isDocumentStillValid(issue, 180, new Date("2026-03-01T00:00:00.000Z"))
    ).toBe(true);
    expect(
      isDocumentStillValid(issue, 180, new Date("2026-08-01T00:00:00.000Z"))
    ).toBe(false);
  });
});
