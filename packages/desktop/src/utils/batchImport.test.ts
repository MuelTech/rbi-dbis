import { describe, expect, it } from "vitest";
import { chunkFamilies, mergeChunkResults } from "./batchImport";

describe("chunkFamilies", () => {
  it("splits at family boundaries into chunks of the given size", () => {
    expect(chunkFamilies([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns a single chunk when the size exceeds the list length", () => {
    expect(chunkFamilies([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
  });

  it("returns no chunks for an empty list", () => {
    expect(chunkFamilies([], 100)).toEqual([]);
  });

  it("rejects a non-positive chunk size", () => {
    expect(() => chunkFamilies([1], 0)).toThrow();
    expect(() => chunkFamilies([1], -5)).toThrow();
  });
});

describe("mergeChunkResults", () => {
  it("sums counts and concatenates errors", () => {
    expect(
      mergeChunkResults([
        { created: 1, skipped: 3, families: 4, errors: ["a"] },
        { created: 5, skipped: 7, families: 8, errors: ["b", "c"] },
      ])
    ).toEqual({
      created: 6,
      skipped: 10,
      families: 12,
      errors: ["a", "b", "c"],
    });
  });

  it("returns zeros and no errors for an empty result list", () => {
    expect(mergeChunkResults([])).toEqual({
      created: 0,
      skipped: 0,
      families: 0,
      errors: [],
    });
  });
});
