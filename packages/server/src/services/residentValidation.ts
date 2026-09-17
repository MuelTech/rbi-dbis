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
  return (
    value !== undefined &&
    value !== null &&
    String(value).trim() !== ""
  );
}

function toBool(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "yes" || v === "true") return true;
    if (v === "no" || v === "false") return false;
  }
  return undefined;
}

function pickEnum(
  value: unknown,
  allowed: readonly string[],
  label: string,
  errors: string[]
): string | undefined {
  if (!has(value)) return undefined;
  const needle = String(value).trim().toLowerCase();
  const match = allowed.find((a) => a.toLowerCase() === needle);
  if (!match) {
    errors.push(`Invalid ${label}`);
    return undefined;
  }
  return match;
}

export function toTitleCase(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/(^|[\s\-'.])(\p{L})/gu, (_m, sep: string, ch: string) =>
      sep + ch.toUpperCase()
    );
}

export function ageFrom(dateOfBirth: Date, now: Date = new Date()): number {
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  const m = now.getMonth() - dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dateOfBirth.getDate())) age--;
  return age;
}

export interface ResidentValidationInput {
  firstName?: unknown;
  lastName?: unknown;
  middleName?: unknown;
  suffix?: unknown;
  placeOfBirth?: unknown;
  dateOfBirth?: unknown;
  sex?: unknown;
  civilStatus?: unknown;
  occupation?: unknown;
  isStudent?: unknown;
  educationLevel?: unknown;
  isVoter?: unknown;
  isPwd?: unknown;
  isSoloParent?: unknown;
  isOwner?: unknown;
  contactNumber?: unknown;
}

export interface ResidentValidationResult {
  errors: string[];
  value: Record<string, unknown>;
}

function cleanName(
  raw: unknown,
  label: string,
  max: number,
  errors: string[],
  pattern: RegExp = NAME_PATTERN
): string | null {
  const trimmed = String(raw).trim();
  if (!pattern.test(trimmed)) {
    errors.push(`Invalid ${label.toLowerCase()}`);
    return null;
  }
  if (trimmed.length > max) {
    errors.push(`${label} is too long`);
    return null;
  }
  return toTitleCase(trimmed);
}

/**
 * Validates and normalizes resident input. Only fields present in `input` are
 * validated and returned in `value`, so it works for both create (with
 * `requireCore`) and partial updates.
 */
export function validateResident(
  input: ResidentValidationInput,
  options: { requireCore?: boolean } = {}
): ResidentValidationResult {
  const errors: string[] = [];
  const value: Record<string, unknown> = {};
  const requireCore = options.requireCore ?? false;

  // Names
  if (has(input.firstName)) {
    const v = cleanName(input.firstName, "First name", 50, errors);
    if (v !== null) value.firstName = v;
  } else if (requireCore) {
    errors.push("First name is required");
  }

  if (has(input.lastName)) {
    const v = cleanName(input.lastName, "Last name", 50, errors);
    if (v !== null) value.lastName = v;
  } else if (requireCore) {
    errors.push("Last name is required");
  }

  if (has(input.middleName)) {
    const v = cleanName(input.middleName, "Middle name", 50, errors);
    if (v !== null) value.middleName = v;
  }

  if (has(input.suffix)) {
    const v = pickEnum(input.suffix, SUFFIXES, "suffix", errors);
    if (v !== undefined) value.suffix = v;
  }

  if (has(input.placeOfBirth)) {
    const v = cleanName(input.placeOfBirth, "Place of birth", 150, errors, PLACE_PATTERN);
    if (v !== null) value.placeOfBirth = v;
  }

  // Date of birth
  let age: number | null = null;
  if (has(input.dateOfBirth)) {
    const parsed = new Date(String(input.dateOfBirth));
    if (isNaN(parsed.getTime())) {
      errors.push("Date of birth is invalid");
    } else if (parsed.getTime() > Date.now()) {
      errors.push("Date of birth cannot be in the future");
    } else {
      age = ageFrom(parsed);
      if (age > 150) {
        errors.push("Date of birth is invalid");
      } else {
        value.dateOfBirth = parsed;
      }
    }
  } else if (requireCore) {
    errors.push("Date of birth is required");
  }

  // Sex
  if (has(input.sex)) {
    const v = pickEnum(input.sex, SEXES, "sex", errors);
    if (v !== undefined) value.sex = v;
  } else if (requireCore) {
    errors.push("Sex is required");
  }

  const civilStatus = pickEnum(input.civilStatus, CIVIL_STATUSES, "civil status", errors);
  if (civilStatus !== undefined) value.civilStatus = civilStatus;

  const occupation = pickEnum(input.occupation, OCCUPATIONS, "occupation", errors);
  if (occupation !== undefined) value.occupation = occupation;

  const educationLevel = pickEnum(
    input.educationLevel,
    EDUCATION_LEVELS,
    "education level",
    errors
  );
  if (educationLevel !== undefined) value.educationLevel = educationLevel;

  const isStudent = toBool(input.isStudent);
  if (isStudent !== undefined) value.isStudent = isStudent;

  for (const key of ["isVoter", "isPwd", "isSoloParent", "isOwner"] as const) {
    const b = toBool(input[key]);
    if (b !== undefined) value[key] = b;
  }

  if (has(input.contactNumber)) {
    const cleaned = String(input.contactNumber).replace(/[\s\-()]/g, "");
    if (!/^09\d{9}$/.test(cleaned)) {
      errors.push("Invalid contact number");
    } else {
      value.contactNumber = cleaned;
    }
  }

  // Cross-field rules
  if (value.isVoter === true && age !== null && age < VOTER_MIN_AGE) {
    errors.push("Voter must be at least 18 years old");
  }

  if (value.isStudent === true && educationLevel === undefined) {
    errors.push("Education level is required for students");
  }

  if (
    educationLevel !== undefined &&
    age !== null &&
    age < (EDUCATION_MIN_AGE[educationLevel] ?? 0)
  ) {
    errors.push("Education level is too advanced for the given age");
  }

  return { errors, value };
}
