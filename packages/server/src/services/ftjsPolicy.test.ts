import { describe, it, expect } from "vitest";
import {
  FTJS_DOCUMENT_NAME,
  computeFtjsValidUntil,
  isFtjsStillValid,
  formatDateLong,
} from "./ftjsPolicy.js";

describe("ftjsPolicy", () => {
  it("exports exact document type name", () => {
    expect(FTJS_DOCUMENT_NAME).toBe("Barangay Certificate (FTJS)");
  });

  it("computes validUntil as issue date + 1 year", () => {
    const issue = new Date("2026-01-28T00:00:00.000Z");
    const valid = computeFtjsValidUntil(issue);
    expect(valid.toISOString().slice(0, 10)).toBe("2027-01-28");
  });

  it("handles leap day issue date", () => {
    const issue = new Date("2024-02-29T00:00:00.000Z");
    const valid = computeFtjsValidUntil(issue);
    expect(valid.toISOString().slice(0, 10)).toBe("2025-03-01");
  });

  it("isValid true on boundary day and false after", () => {
    const validUntil = new Date("2027-01-28T00:00:00.000Z");
    expect(isFtjsStillValid(validUntil, new Date("2027-01-28T12:00:00.000Z"))).toBe(true);
    expect(isFtjsStillValid(validUntil, new Date("2027-01-29T00:00:00.000Z"))).toBe(false);
  });

  it("formats long dates", () => {
    expect(formatDateLong(new Date("2027-01-28T00:00:00.000Z"))).toBe("January 28, 2027");
  });
});
