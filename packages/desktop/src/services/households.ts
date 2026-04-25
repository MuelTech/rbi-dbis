import { api } from "./api";

export interface HouseholdRow {
  id: string;
  displayId: number;
  blockNumber: string;
  brgyHouseholdNo: string;
  familyCount: number;
  voterCount: number;
  catCount: number;
  dogCount: number;
}

export interface HouseholdListParams {
  page?: number;
  pageSize?: number;
  block?: string;
  search?: string;
}

export interface PaginatedHouseholds {
  data: HouseholdRow[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export const householdsService = {
  list: (params: HouseholdListParams = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    if (params.block) qs.set("block", params.block);
    if (params.search) qs.set("search", params.search);
    const query = qs.toString();
    return api.get<PaginatedHouseholds>(
      `/households${query ? `?${query}` : ""}`
    );
  },
  getById: (id: string) => api.get<HouseholdRow>(`/households/${id}`),
  create: (data: Partial<HouseholdRow>) =>
    api.post<HouseholdRow>("/households", data),
  update: (id: string, data: Partial<HouseholdRow>) =>
    api.put<HouseholdRow>(`/households/${id}`, data),
  delete: (id: string) => api.delete(`/households/${id}`),
};
