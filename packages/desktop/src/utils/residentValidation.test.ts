import { describe, expect, it } from "vitest";
import {
  EDUCATION_LEVELS,
  ageFrom,
  toTitleCase,
  validateResidentFields,
} from "./residentValidation";

describe("toTitleCase", () => {
  it("converts all-caps names", () => {
    expect(toTitleCase("JUAN DELA CRUZ")).toBe("Juan Dela Cruz");
  });
});

describe("ageFrom", () => {
  it("computes age", () => {
    expect(ageFrom(new Date("2000-06-15"), new Date("2026-06-15"))).toBe(26);
    expect(ageFrom(new Date("2000-06-16"), new Date("2026-06-15"))).toBe(25);
  });
});

describe("validateResidentFields", () => {
  const valid = {
    firstName: "Juan",
    lastName: "Cruz",
    dateOfBirth: "1990-05-05",
    sex: "Male",
  };

  it("accepts a valid resident", () => {
    expect(validateResidentFields(valid, { requireCore: true })).toEqual({});
  });

  it("includes Day Care and Kinder levels", () => {
    expect(EDUCATION_LEVELS).toContain("Day Care");
    expect(EDUCATION_LEVELS).toContain("Kinder");
  });

  it("flags missing core fields", () => {
    const errors = validateResidentFields({}, { requireCore: true });
    expect(errors.firstName).toBeTruthy();
    expect(errors.lastName).toBeTruthy();
    expect(errors.dateOfBirth).toBeTruthy();
    expect(errors.sex).toBeTruthy();
  });

  it("rejects invalid enum values", () => {
    expect(validateResidentFields({ ...valid, sex: "X" }).sex).toBeTruthy();
    expect(
      validateResidentFields({ ...valid, civilStatus: "Whatever" }).civilStatus
    ).toBeTruthy();
    expect(
      validateResidentFields({ ...valid, occupation: "Wizard" }).occupation
    ).toBeTruthy();
    expect(validateResidentFields({ ...valid, suffix: "XII" }).suffix).toBeTruthy();
  });

  it("rejects a voter younger than 18", () => {
    expect(
      validateResidentFields({
        ...valid,
        dateOfBirth: "2015-01-01",
        isVoter: true,
      }).isVoter
    ).toBeTruthy();
  });

  it("requires an education level for students", () => {
    expect(
      validateResidentFields({ ...valid, isStudent: true }).educationLevel
    ).toBeTruthy();
  });

  it("rejects an impossible education level for the age", () => {
    expect(
      validateResidentFields({
        ...valid,
        dateOfBirth: "2025-01-01",
        isStudent: true,
        educationLevel: "College",
      }).educationLevel
    ).toBeTruthy();
  });

  it("accepts Day Care for a toddler", () => {
    expect(
      validateResidentFields({
        ...valid,
        dateOfBirth: "2023-06-01",
        isStudent: true,
        educationLevel: "Day Care",
      }).educationLevel
    ).toBeUndefined();
  });

  it("rejects an invalid contact number", () => {
    expect(
      validateResidentFields({ ...valid, contactNumber: "abc" }).contactNumber
    ).toBeTruthy();
    expect(
      validateResidentFields({ ...valid, contactNumber: "09171234567" })
        .contactNumber
    ).toBeUndefined();
  });
});
