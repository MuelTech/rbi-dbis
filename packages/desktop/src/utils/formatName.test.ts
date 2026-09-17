import { describe, expect, it } from "vitest";
import { getFullName } from "./formatName";

describe("getFullName", () => {
  it("joins first, middle, and last name with single spaces", () => {
    expect(
      getFullName({ firstName: "Juan", middleName: "Santos", lastName: "Dela Cruz" })
    ).toBe("Juan Santos Dela Cruz");
  });

  it("omits a missing middle name without leaving extra spaces", () => {
    expect(
      getFullName({ firstName: "John", middleName: null, lastName: "Santos" })
    ).toBe("John Santos");
  });

  it("appends a suffix when present", () => {
    expect(
      getFullName({
        firstName: "Juan",
        middleName: "Santos",
        lastName: "Dela Cruz",
        suffix: "Jr.",
      })
    ).toBe("Juan Santos Dela Cruz Jr.");
  });

  it("accepts raw snake_case API fields", () => {
    expect(
      getFullName({ first_name: "Juan", middle_name: "Santos", last_name: "Dela Cruz" })
    ).toBe("Juan Santos Dela Cruz");
  });
});
