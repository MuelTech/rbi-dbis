import { describe, expect, it } from "vitest";
import { planFamilyMemberLinks } from "./familyMemberPlan.js";

describe("planFamilyMemberLinks", () => {
  it("skip: never removes existing links and only adds unlinked members", () => {
    expect(planFamilyMemberLinks(["a", "b"], ["b", "c"], "skip")).toEqual({
      toCreate: ["c"],
      toUpdate: [],
      toRemove: [],
    });
  });

  it("overwrite: updates existing links, adds new, and keeps omitted members linked", () => {
    expect(planFamilyMemberLinks(["a", "b"], ["b", "c"], "overwrite")).toEqual({
      toCreate: ["c"],
      toUpdate: ["b"],
      toRemove: [],
    });
  });

  it("skip: creates links when the family has no members yet", () => {
    expect(planFamilyMemberLinks([], ["x", "y"], "skip")).toEqual({
      toCreate: ["x", "y"],
      toUpdate: [],
      toRemove: [],
    });
  });

  it("overwrite: treats an already-linked resident as an update, not a new link", () => {
    expect(planFamilyMemberLinks(["a"], ["a"], "overwrite")).toEqual({
      toCreate: [],
      toUpdate: ["a"],
      toRemove: [],
    });
  });

  it("does not emit duplicate creates for repeated incoming residents", () => {
    expect(planFamilyMemberLinks([], ["x", "x"], "overwrite")).toEqual({
      toCreate: ["x"],
      toUpdate: [],
      toRemove: [],
    });
  });
});
