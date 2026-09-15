import { describe, expect, it } from "vitest";
import { isTokenAfterCutoff } from "./sessionPolicy.js";

describe("isTokenAfterCutoff", () => {
  it("allows any token when there is no cutoff", () => {
    expect(isTokenAfterCutoff(1000, null)).toBe(true);
    expect(isTokenAfterCutoff(undefined, null)).toBe(true);
    expect(isTokenAfterCutoff(undefined, undefined)).toBe(true);
  });

  it("rejects a token issued before the cutoff", () => {
    expect(isTokenAfterCutoff(1000, new Date(2000 * 1000))).toBe(false);
  });

  it("allows a token issued at or after the cutoff", () => {
    expect(isTokenAfterCutoff(2000, new Date(2000 * 1000))).toBe(true);
    expect(isTokenAfterCutoff(2001, new Date(2000 * 1000))).toBe(true);
  });

  it("rejects a token with no issued-at when a cutoff exists", () => {
    expect(isTokenAfterCutoff(undefined, new Date(2000 * 1000))).toBe(false);
  });
});
