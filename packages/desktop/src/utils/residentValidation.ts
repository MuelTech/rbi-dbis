export const SEXES = ["Male", "Female"] as const;
export const SUFFIXES = ["Jr.", "Sr.", "II", "III", "IV"] as const;
export const CIVIL_STATUSES = [
  "Single",
  "Married",
  "Widowed",
  "Separated",
  "Divorced",
] as const;
export const OCCUPATIONS = [
  "Employed",
  "Self-Employed",
  "Unemployed",
  "Student",
] as const;
export const EDUCATION_LEVELS = [
  "Day Care",
  "Kinder",
  "Elementary",
  "High School",
  "College",
  "Vocational",
] as const;
export const RELATIONSHIP_TYPES = [
  "Spouse",
  "Child",
  "Parent",
  "Sibling",
  "Grandparent",
  "Grandchild",
  "Other",
] as const;

/** Minimum plausible age per education level (obvious impossibilities only). */
export const EDUCATION_MIN_AGE: Record<string, number> = {
  "Day Care": 2,
  Kinder: 4,
  Elementary: 5,
  "High School": 11,
  College: 15,
  Vocational: 15,
};

export const VOTER_MIN_AGE = 18;

const NAME_PATTERN = /^[\p{L}\s\-'.]+$/u;
const PLACE_PATTERN = /^[\p{L}\s\-'.,]+$/u;

function has(value: unknown): boolean {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function canonical(
  value: string,
  allowed: readonly string[]
): string | undefined {
  const v = value.trim().toLowerCase();
  return allowed.find((a) => a.toLowerCase() === v);
}

export function toTitleCase(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(
      /(^|[\s\-'.])(\p{L})/gu,
      (_m, sep: string, ch: string) => sep + ch.toUpperCase()
    );
}

export function ageFrom(dateOfBirth: Date, now: Date = new Date()): number {
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  const m = now.getMonth() - dateOfBirth.getMonth();
  if (m === 0 ? now.getDate() < dateOfBirth.getDate() : m < 0) age--;
  return age;
}

export interface ResidentFieldInput {
  firstName?: unknown;
  middleName?: unknown;
  lastName?: unknown;
  suffix?: unknown;
  placeOfBirth?: unknown;
  dateOfBirth?: unknown;
  sex?: unknown;
  civilStatus?: unknown;
  occupation?: unknown;
  educationLevel?: unknown;
  isStudent?: boolean;
  isVoter?: boolean;
  contactNumber?: unknown;
}

/**
 * Client-side mirror of the server rules. Returns a map of field -> message so
 * forms can display inline errors next to the right input.
 */
export function validateResidentFields(
  input: ResidentFieldInput,
  options: { requireCore?: boolean } = {}
): Record<string, string> {
  const errors: Record<string, string> = {};
  const requireCore = options.requireCore ?? false;

  const name = (
    key: "firstName" | "middleName" | "lastName",
    label: string,
    required: boolean,
    pattern: RegExp
  ) => {
    if (!has(input[key])) {
      if (required) errors[key] = `${label} is required`;
      return;
    }
    const trimmed = String(input[key]).trim();
    if (!pattern.test(trimmed)) errors[key] = `Invalid ${label.toLowerCase()}`;
    else if (trimmed.length > 50) errors[key] = `${label} is too long`;
  };

  name("firstName", "First name", requireCore, NAME_PATTERN);
  name("lastName", "Last name", requireCore, NAME_PATTERN);
  name("middleName", "Middle name", false, NAME_PATTERN);

  if (has(input.placeOfBirth)) {
    const trimmed = String(input.placeOfBirth).trim();
    if (!PLACE_PATTERN.test(trimmed)) errors.placeOfBirth = "Invalid place of birth";
    else if (trimmed.length > 150) errors.placeOfBirth = "Place of birth is too long";
  }

  if (has(input.suffix) && !canonical(String(input.suffix), SUFFIXES)) {
    errors.suffix = "Invalid suffix";
  }

  let age: number | null = null;
  if (has(input.dateOfBirth)) {
    const parsed = new Date(String(input.dateOfBirth));
    if (isNaN(parsed.getTime())) errors.dateOfBirth = "Invalid date";
    else if (parsed.getTime() > Date.now()) {
      errors.dateOfBirth = "Birth date cannot be in the future";
    } else {
      age = ageFrom(parsed);
      if (age > 150) errors.dateOfBirth = "Invalid date";
    }
  } else if (requireCore) {
    errors.dateOfBirth = "Birth date is required";
  }

  if (has(input.sex)) {
    if (!canonical(String(input.sex), SEXES)) errors.sex = "Invalid sex";
  } else if (requireCore) {
    errors.sex = "Sex is required";
  }

  if (has(input.civilStatus) && !canonical(String(input.civilStatus), CIVIL_STATUSES)) {
    errors.civilStatus = "Invalid civil status";
  }

  if (has(input.occupation) && !canonical(String(input.occupation), OCCUPATIONS)) {
    errors.occupation = "Invalid occupation";
  }

  const level = has(input.educationLevel)
    ? canonical(String(input.educationLevel), EDUCATION_LEVELS)
    : undefined;
  if (has(input.educationLevel) && !level) {
    errors.educationLevel = "Invalid education level";
  }

  if (input.isStudent) {
    if (!has(input.educationLevel)) {
      errors.educationLevel = "Education level is required for students";
    } else if (level && age !== null && age < (EDUCATION_MIN_AGE[level] ?? 0)) {
      errors.educationLevel = "Education level is too advanced for the given age";
    }
  }

  if (input.isVoter && age !== null && age < VOTER_MIN_AGE) {
    errors.isVoter = "Voter must be at least 18 years old";
  }

  if (has(input.contactNumber)) {
    const cleaned = String(input.contactNumber).replace(/[\s\-()]/g, "");
    if (!/^09\d{9}$/.test(cleaned)) {
      errors.contactNumber = "Must be 11 digits starting with 09";
    }
  }

  return errors;
}
