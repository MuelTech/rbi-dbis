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

  restore: (data: BackupData) =>
    api.post<{ success: boolean }>("/settings/restore", data),
};
