import { describe, expect, it } from "vitest";
import { BACKUP_VERSION, validateBackup } from "./backupValidation.js";

describe("validateBackup", () => {
  it("rejects a non-object payload", () => {
    expect(validateBackup(null)).toBe("Invalid backup file");
    expect(validateBackup(undefined)).toBe("Invalid backup file");
    expect(validateBackup("not a backup")).toBe("Invalid backup file");
  });

  it("rejects a payload without a numeric version", () => {
    expect(validateBackup({ data: {} })).toBe(
      "Backup file is missing a version"
    );
    expect(validateBackup({ version: "1", data: {} })).toBe(
      "Backup file is missing a version"
    );
  });

  it("rejects a version newer than the system supports", () => {
    const result = validateBackup({ version: BACKUP_VERSION + 1, data: {} });
    expect(result).toContain("newer than");
  });

  it("rejects a payload without data", () => {
    expect(validateBackup({ version: BACKUP_VERSION })).toBe(
      "Backup file is missing data"
    );
    expect(validateBackup({ version: BACKUP_VERSION, data: null })).toBe(
      "Backup file is missing data"
    );
  });

  it("accepts a current-version payload", () => {
    expect(validateBackup({ version: BACKUP_VERSION, data: {} })).toBeNull();
  });

  it("accepts a legacy v1 payload for backward compatibility", () => {
    expect(validateBackup({ version: 1, data: {} })).toBeNull();
  });
});
