import { api } from "./api";
import type { Resident, ResidentDetail, RegistrationPayload, RegistrationResult } from "../types";

export interface ResidentListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string[];
  sex?: string[];
  voter?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export const residentsService = {
  list: (params: ResidentListParams = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    if (params.search) qs.set("search", params.search);
    if (params.status?.length) qs.set("status", params.status.join(","));
    if (params.sex?.length) qs.set("sex", params.sex.join(","));
    if (params.voter) qs.set("voter", params.voter);
    const query = qs.toString();
    return api.get<PaginatedResponse<Resident>>(
      `/residents${query ? `?${query}` : ""}`
    );
  },
  getById: (id: string) => api.get<ResidentDetail>(`/residents/${id}`),
  create: (data: Partial<Resident>) => api.post<Resident>("/residents", data),
  update: (id: string, data: Record<string, unknown>) =>
    api.put<ResidentDetail>(`/residents/${id}`, data),
  delete: (id: string) => api.delete(`/residents/${id}`),
  register: (data: RegistrationPayload) =>
    api.post<RegistrationResult>("/resident-registrations", data),
};
