export const BACKUP_VERSION = 3;

export interface BackupMeta {
  counts: Record<string, number>;
  total: number;
}

export interface BackupPayload {
  version: number;
  exportedAt: string;
  data: Record<string, any>;
  meta: BackupMeta;
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
  if (payload.encrypted === true) {
    const wraps = payload.data?.wraps;
    if (!payload.data || !Array.isArray(wraps)) {
      return "Invalid encrypted backup";
    }
    return null;
  }
  if (!payload.data || typeof payload.data !== "object") {
    return "Backup file is missing data";
  }
  return null;
}

export function summarizeBackup(data: Record<string, any>): BackupMeta {
  const counts: Record<string, number> = {};
  let total = 0;
  for (const [key, value] of Object.entries(data)) {
    const count = Array.isArray(value) ? value.length : value ? 1 : 0;
    counts[key] = count;
    total += count;
  }
  return { counts, total };
}
