import { api } from "./api";

export interface AuthUser {
  id: string;
  displayId?: number;
  username: string;
  roleType: string;
  isActive: boolean;
  permission: string | null;
  lastLogin: string | null;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  profileImage: string | null;
}

interface LoginResponse {
  token: string;
  user: AuthUser;
}

export const authService = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>("/auth/login", { username, password }),

  me: () => api.get<AuthUser>("/auth/me"),
};
