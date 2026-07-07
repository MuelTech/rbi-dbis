import { api } from "./api";

export interface ResidentReport {
  no: number;
  lastName: string;
  firstName: string;
  middleName: string;
  age: number;
  sex: string;
  address: string;
  contact: string;
  status: string;
}

export interface ReportResponse {
  data: ResidentReport[];
  total: number;
}

export interface ReportFilters {
  sex?: string;
  isVoter?: string;
  isPwd?: string;
  isSoloParent?: string;
  isFamilyHead?: string;
  studentType?: string;
  status?: string;
  ageFrom?: number;
  ageTo?: number;
}

export const reportService = {
  getFilteredResidents: (filters: ReportFilters) => {
    const params = new URLSearchParams();
    if (filters.sex) params.set("sex", filters.sex);
    if (filters.isVoter) params.set("isVoter", filters.isVoter);
    if (filters.isPwd) params.set("isPwd", filters.isPwd);
    if (filters.isSoloParent) params.set("isSoloParent", filters.isSoloParent);
    if (filters.isFamilyHead) params.set("isFamilyHead", filters.isFamilyHead);
    if (filters.studentType) params.set("studentType", filters.studentType);
    if (filters.status) params.set("status", filters.status);
    if (filters.ageFrom) params.set("ageFrom", filters.ageFrom.toString());
    if (filters.ageTo) params.set("ageTo", filters.ageTo.toString());
    const qs = params.toString();
    return api.get<ReportResponse>(`/report/residents${qs ? `?${qs}` : ""}`);
  },
};
