import { api, notifyUnauthorized } from "./api";
import { createSseParser } from "./sse";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

const BACKUP_UNLOCK_KEY = "backupUnlockToken";

export function getBackupUnlock(): string | null {
  return sessionStorage.getItem(BACKUP_UNLOCK_KEY);
}

export function setBackupUnlock(token: string): void {
  sessionStorage.setItem(BACKUP_UNLOCK_KEY, token);
}

export function clearBackupUnlock(): void {
  sessionStorage.removeItem(BACKUP_UNLOCK_KEY);
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = localStorage.getItem("authToken");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function unlockHeaders(): Record<string, string> {
  const unlock = getBackupUnlock();
  return unlock ? { "x-backup-unlock": unlock } : {};
}

export interface BarangaySettings {
  slogan: string;
  barangayName: string;
  municipality: string;
  province: string;
  telephone: string;
  punongBarangay: string;
  councilor1: string;
  councilor2: string;
  councilor3: string;
  councilor4: string;
  councilor5: string;
  councilor6: string;
  councilor7: string;
  skChairman: string;
  treasurer: string;
  secretary: string;
  clearanceFee: string;
  residencyFee: string;
  businessFee: string;
  ownershipFee: string;
  purposes: string[];
}

export interface BackupMeta {
  counts: Record<string, number>;
  total: number;
}

export interface BackupData {
  format?: string;
  version: number;
  encrypted?: boolean;
  createdAt?: string;
  exportedAt?: string;
  data: Record<string, any>;
  meta?: BackupMeta;
}

export interface ProgressUpdate {
  step: string;
  current: number;
  total: number;
  percent: number;
}

function sseRequest<T>(
  method: string,
  url: string,
  body: string | null,
  onProgress: (update: ProgressUpdate) => void,
  onRecoveryKey?: (key: string) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);

    const token = localStorage.getItem("authToken");
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }
    if (body) {
      xhr.setRequestHeader("Content-Type", "application/json");
    }
    for (const [key, value] of Object.entries(unlockHeaders())) {
      xhr.setRequestHeader(key, value);
    }

    let lastLen = 0;
    const parser = createSseParser({
      onProgress: (parsed) => onProgress(parsed as ProgressUpdate),
      onRecoveryKey,
    });

    xhr.onprogress = () => {
      const text = xhr.responseText;
      if (text.length === lastLen) return;
      parser.push(text.slice(lastLen));
      lastLen = text.length;
    };

    xhr.onload = () => {
      const text = xhr.responseText;
      if (text.length > lastLen) {
        parser.push(text.slice(lastLen));
        lastLen = text.length;
      }
      parser.flush();

      const result = parser.getResult();
      if (xhr.status >= 200 && xhr.status < 300) {
        if (result?.error) {
          const err: any = new Error(result.error);
          if (result.code) err.code = result.code;
          reject(err);
        } else {
          resolve(result as T);
        }
      } else {
        if (xhr.status === 401) notifyUnauthorized();
        reject(new Error(`Request failed: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(body);
  });
}

export const settingsService = {
  get: () => api.get<BarangaySettings>("/settings"),
  update: (data: BarangaySettings) =>
    api.put<BarangaySettings>("/settings", data),

  verifyPassword: (password: string) =>
    api.post<{ unlockToken: string }>("/settings/verify-password", { password }),

  getRecoveryKey: () =>
    api.get<{ recoveryKey: string }>("/settings/encryption/recovery-key"),

  regenerateRecoveryKey: () =>
    api.post<{ recoveryKey: string }>(
      "/settings/encryption/recovery-key/regenerate",
      {}
    ),

  backup: async (): Promise<BackupData> => {
    const res = await fetch(`${API_BASE}/settings/backup`, {
      headers: { ...authHeaders(), ...unlockHeaders() },
    });
    if (!res.ok) throw new Error("Backup failed");
    return res.json();
  },

  backupWithProgress: async (
    onProgress: (update: ProgressUpdate) => void,
    onRecoveryKey?: (key: string) => void
  ): Promise<BackupData> => {
    return sseRequest<BackupData>(
      "GET",
      `${API_BASE}/settings/backup`,
      null,
      onProgress,
      onRecoveryKey
    );
  },

  restore: (data: BackupData) =>
    api.post<{ success: boolean }>("/settings/restore", data),

  restoreWithProgress: async (
    data: BackupData,
    onProgress: (update: ProgressUpdate) => void,
    recoveryKey?: string
  ): Promise<{ success: boolean }> => {
    return sseRequest<{ success: boolean }>(
      "POST",
      `${API_BASE}/settings/restore`,
      JSON.stringify({ ...data, recoveryKey }),
      onProgress
    );
  },
};
