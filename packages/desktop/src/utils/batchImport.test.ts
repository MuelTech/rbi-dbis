import { describe, expect, it } from "vitest";
import { chunkFamilies, mergeChunkResults, summarizeImportFamilies } from "./batchImport";

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

function row(
  familyId: string,
  relationship: string,
  first: string,
  last: string,
  status: "success" | "duplicate" | "error"
) {
  return {
    status,
    data: {
      family_id: familyId,
      relationship,
      first_name: first,
      last_name: last,
    },
  };
}

describe("summarizeImportFamilies", () => {
  it("marks a family duplicate when its head already exists", () => {
    const out = summarizeImportFamilies([
      row("f1", "Head", "Juan", "Cruz", "duplicate"),
      row("f1", "Child", "Ana", "Cruz", "success"),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].status).toBe("duplicate");
    expect(out[0].message).toBe("Head already exists — family will be skipped");
    expect(out[0].memberCount).toBe(1);
    expect(out[0].headName).toBe("Juan Cruz");
  });

  it("marks a family as error when any row errored", () => {
    const out = summarizeImportFamilies([
      row("f1", "Head", "Juan", "Cruz", "success"),
      row("f1", "Child", "Ana", "Cruz", "error"),
    ]);
    expect(out[0].status).toBe("error");
  });

  it("marks a family duplicate when all rows are duplicates", () => {
    const out = summarizeImportFamilies([
      row("f1", "Head", "Juan", "Cruz", "duplicate"),
      row("f1", "Child", "Ana", "Cruz", "duplicate"),
    ]);
    expect(out[0].status).toBe("duplicate");
    expect(out[0].message).toBe("All residents already exist");
  });

  it("marks a fully new family as success", () => {
    const out = summarizeImportFamilies([
      row("f1", "Head", "Juan", "Cruz", "success"),
      row("f1", "Child", "Ana", "Cruz", "success"),
    ]);
    expect(out[0].status).toBe("success");
    expect(out[0].message).toBe("");
  });
});
