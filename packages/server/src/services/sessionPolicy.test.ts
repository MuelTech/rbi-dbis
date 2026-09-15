import { describe, expect, it } from "vitest";
import { isTokenAfterCutoff, isTokenVersionCurrent } from "./sessionPolicy.js";

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

describe("isTokenVersionCurrent", () => {
  it("treats a missing token version as 0", () => {
    expect(isTokenVersionCurrent(undefined, 0)).toBe(true);
    expect(isTokenVersionCurrent(undefined, 1)).toBe(false);
  });

  it("accepts matching versions", () => {
    expect(isTokenVersionCurrent(3, 3)).toBe(true);
  });

  it("rejects a stale token version", () => {
    expect(isTokenVersionCurrent(2, 3)).toBe(false);
  });
});
