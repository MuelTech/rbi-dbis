import { api } from "./api";

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

export const settingsService = {
  get: () => api.get<BarangaySettings>("/settings"),
  update: (data: BarangaySettings) =>
    api.put<BarangaySettings>("/settings", data),
};
