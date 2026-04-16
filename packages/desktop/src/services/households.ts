import { api } from "./api";

export interface Household {
  id: string;
  displayId?: number;
  name: string;
  address?: string;
  members?: unknown[];
}

export const householdsService = {
  getAll: () => api.get<Household[]>("/households"),
  getById: (id: string) => api.get<Household>(`/households/${id}`),
  create: (data: Partial<Household>) =>
    api.post<Household>("/households", data),
  update: (id: string, data: Partial<Household>) =>
    api.put<Household>(`/households/${id}`, data),
  delete: (id: string) => api.delete(`/households/${id}`),
};
