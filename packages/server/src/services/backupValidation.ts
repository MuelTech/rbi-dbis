export const BACKUP_VERSION = 2;

export interface BackupPayload {
  version: number;
  exportedAt: string;
  data: Record<string, any>;
}

export function validateBackup(payload: any): string | null {
  if (!payload || typeof payload !== "object") {
    return "Invalid backup file";
  }
  if (typeof payload.version !== "number") {
    return "Backup file is missing a version";
  }
  if (payload.version > BACKUP_VERSION) {
    return `Backup version ${payload.version} is newer than this system supports (${BACKUP_VERSION})`;
  }
  if (!payload.data || typeof payload.data !== "object") {
    return "Backup file is missing data";
  }
  return null;
}
