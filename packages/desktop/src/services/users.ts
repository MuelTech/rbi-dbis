import { api } from "./api";
import type { User } from "../types";

export const usersService = {
  getAll: () => api.get<User[]>("/users"),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  create: (data: Partial<User>) => api.post<User>("/users", data),
  update: (id: string, data: Partial<User>) =>
    api.put<User>(`/users/${id}`, data),
};
