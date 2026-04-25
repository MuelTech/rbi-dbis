import { api } from "./api";

export interface FamilyRow {
  id: string;
  displayId: number;
  familyName: string;
  residentCount: number;
  voterCount: number;
}

export interface FamilySummary {
  motorcycles: number;
  vehicles: number;
  cats: number;
  dogs: number;
}

export interface HouseholdFamiliesResponse {
  data: FamilyRow[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
  summary: FamilySummary;
  householdNo: string;
}

export interface FamilyListParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export const familiesService = {
  listByHousehold: (householdId: string, params: FamilyListParams = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    if (params.search) qs.set("search", params.search);
    const query = qs.toString();
    return api.get<HouseholdFamiliesResponse>(
      `/households/${householdId}/families${query ? `?${query}` : ""}`
    );
  },
};
