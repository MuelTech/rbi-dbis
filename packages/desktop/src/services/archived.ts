import { api } from "./api";

export interface ArchivedFamily {
  id: string;
  displayId: number;
  familyName: string;
  residentCount: number;
  voterCount: number;
  status: "Moveout" | "Deceased";
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export const archivedService = {
  list: (params: { page?: number; pageSize?: number; search?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    if (params.search) qs.set("search", params.search);
    const query = qs.toString();
    return api.get<PaginatedResponse<ArchivedFamily>>(
      `/archived-families${query ? `?${query}` : ""}`
    );
  },
  restore: (familyId: string) =>
    api.patch(`/archived-families/${familyId}/restore`, {}),
};
