import { describe, expect, it } from "vitest";
import {
  toTitleCase,
  ageFrom,
  validateResident,
} from "./residentValidation.js";

describe("toTitleCase", () => {
  it("converts all-caps names to title case", () => {
    expect(toTitleCase("JUAN DELA CRUZ")).toBe("Juan Dela Cruz");
  });

  it("handles apostrophes and hyphens", () => {
    expect(toTitleCase("O'BRIEN")).toBe("O'Brien");
    expect(toTitleCase("maria-clara")).toBe("Maria-Clara");
  });

  it("collapses whitespace and trims", () => {
    expect(toTitleCase("  juan   cruz ")).toBe("Juan Cruz");
  });
});

describe("ageFrom", () => {
  it("computes age from a birth date", () => {
    expect(ageFrom(new Date("2000-06-15"), new Date("2026-06-15"))).toBe(26);
    expect(ageFrom(new Date("2000-06-16"), new Date("2026-06-15"))).toBe(25);
  });
});

describe("validateResident", () => {
  const valid = {
    firstName: "JUAN",
    lastName: "DELA CRUZ",
    dateOfBirth: "1990-05-05",
    sex: "Male",
  };

  it("accepts a valid resident and title-cases names", () => {
    const { errors, value } = validateResident(valid, { requireCore: true });
    expect(errors).toEqual([]);
    expect(value.firstName).toBe("Juan");
    expect(value.lastName).toBe("Dela Cruz");
    expect(value.sex).toBe("Male");
  });

  it("requires core fields in create mode", () => {
    const { errors } = validateResident(
      { middleName: "Santos" },
      { requireCore: true }
    );
    expect(errors).toContain("First name is required");
    expect(errors).toContain("Last name is required");
    expect(errors).toContain("Date of birth is required");
    expect(errors).toContain("Sex is required");
  });

  it("rejects names with digits or symbols", () => {
    const { errors } = validateResident({ ...valid, firstName: "Juan123" });
    expect(errors).toContain("Invalid first name");
  });

  it("rejects invalid sex", () => {
    const { errors } = validateResident({ ...valid, sex: "X" });
    expect(errors).toContain("Invalid sex");
  });

  it("normalizes sex casing", () => {
    const { value } = validateResident({ ...valid, sex: "female" });
    expect(value.sex).toBe("Female");
  });

  it("rejects invalid civil status and occupation", () => {
    expect(
      validateResident({ ...valid, civilStatus: "Whatever" }).errors
    ).toContain("Invalid civil status");
    expect(
      validateResident({ ...valid, occupation: "Wizard" }).errors
    ).toContain("Invalid occupation");
  });

  it("rejects invalid suffix", () => {
    expect(validateResident({ ...valid, suffix: "XII" }).errors).toContain(
      "Invalid suffix"
    );
  });

  it("rejects invalid contact number", () => {
    expect(
      validateResident({ ...valid, contactNumber: "abc" }).errors
    ).toContain("Invalid contact number");
    expect(
      validateResident({ ...valid, contactNumber: "09171234567" }).errors
    ).toEqual([]);
  });

  it("rejects future birth dates", () => {
    const { errors } = validateResident({
      ...valid,
      dateOfBirth: "2999-01-01",
    });
    expect(errors).toContain("Date of birth cannot be in the future");
  });

  it("requires education level for students", () => {
    const { errors } = validateResident({ ...valid, isStudent: true });
    expect(errors).toContain("Education level is required for students");
  });

  it("rejects an education level that is impossible for the age", () => {
    const { errors } = validateResident({
      ...valid,
      dateOfBirth: "2021-01-01", // ~5
      isStudent: true,
      educationLevel: "College",
    });
    expect(errors).toContain("Education level is too advanced for the given age");
  });

  it("accepts an age-appropriate education level", () => {
    expect(
      validateResident({
        ...valid,
        dateOfBirth: "2021-01-01",
        isStudent: true,
        educationLevel: "Elementary",
      }).errors
    ).toEqual([]);
    expect(
      validateResident({
        ...valid,
        dateOfBirth: "2010-01-01",
        isStudent: true,
        educationLevel: "College",
      }).errors
    ).toEqual([]);
  });

  it("rejects a voter younger than 18", () => {
    const { errors } = validateResident({
      ...valid,
      dateOfBirth: "2015-01-01",
      isVoter: true,
    });
    expect(errors).toContain("Voter must be at least 18 years old");
  });

  it("accepts a voter 18 or older", () => {
    expect(
      validateResident({
        ...valid,
        dateOfBirth: "2000-01-01",
        isVoter: true,
      }).errors
    ).toEqual([]);
  });

  it("rejects over-long names", () => {
    const { errors } = validateResident({ ...valid, lastName: "A".repeat(51) });
    expect(errors).toContain("Last name is too long");
  });
});
