import { api } from "./api";
import type { Resident } from "../types";

export const residentsService = {
  getAll: () => api.get<Resident[]>("/residents"),
  getById: (id: string) => api.get<Resident>(`/residents/${id}`),
  create: (data: Partial<Resident>) => api.post<Resident>("/residents", data),
  update: (id: string, data: Partial<Resident>) =>
    api.put<Resident>(`/residents/${id}`, data),
  delete: (id: string) => api.delete(`/residents/${id}`),
};
