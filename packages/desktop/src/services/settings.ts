import { api } from "./api";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = localStorage.getItem("authToken");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
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

export interface BackupData {
  version: number;
  exportedAt: string;
  data: Record<string, any>;
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
  onProgress: (update: ProgressUpdate) => void
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

    let buffer = "";
    let lastLen = 0;

    xhr.onprogress = () => {
      const text = xhr.responseText;
      if (text.length === lastLen) return;
      const chunk = text.slice(lastLen);
      lastLen = text.length;
      buffer += chunk;

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      let currentEvent = "";
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          const data = line.slice(6);
          try {
            const parsed = JSON.parse(data);
            if (currentEvent === "progress") {
              onProgress(parsed);
            }
          } catch {
            // skip
          }
        }
      }
    };

    xhr.onload = () => {
      // process any remaining buffer
      const lines = buffer.split("\n");
      let currentEvent = "";
      let result: any = null;

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          const data = line.slice(6);
          try {
            const parsed = JSON.parse(data);
            if (currentEvent === "progress") {
              onProgress(parsed);
            } else if (currentEvent === "complete" || currentEvent === "error") {
              result = parsed;
            }
          } catch {
            // skip
          }
        }
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        if (result?.error) {
          reject(new Error(result.error));
        } else {
          resolve(result as T);
        }
      } else {
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

  backup: async (): Promise<BackupData> => {
    const res = await fetch(`${API_BASE}/settings/backup`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Backup failed");
    return res.json();
  },

  backupWithProgress: async (
    onProgress: (update: ProgressUpdate) => void
  ): Promise<BackupData> => {
    return sseRequest<BackupData>(
      "GET",
      `${API_BASE}/settings/backup`,
      null,
      onProgress
    );
  },

  restore: (data: BackupData) =>
    api.post<{ success: boolean }>("/settings/restore", data),

  restoreWithProgress: async (
    data: BackupData,
    onProgress: (update: ProgressUpdate) => void
  ): Promise<{ success: boolean }> => {
    return sseRequest<{ success: boolean }>(
      "POST",
      `${API_BASE}/settings/restore`,
      JSON.stringify(data),
      onProgress
    );
  },
};
