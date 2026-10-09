import { apiClient } from "@/lib/api-client";
import type {
  AuthResponse,
  LoginRequest,
  RefreshRequest,
  RefreshResponse,
  RegisterRequest,
} from "../types";

export const authApi = {
  register: (data: RegisterRequest) =>
    apiClient<AuthResponse>("/auth/register", {
      method: "POST",
      body: data,
      auth: false,
    }),
  login: (data: LoginRequest) =>
    apiClient<AuthResponse>("/auth/login", {
      method: "POST",
      body: data,
      auth: false,
    }),
  refresh: (data: RefreshRequest) =>
    apiClient<RefreshResponse>("/auth/refresh", {
      method: "POST",
      body: data,
      auth: false,
    }),
  logout: (refreshToken: string) =>
    apiClient<void>("/auth/logout", {
      method: "POST",
      body: { refreshToken },
      auth: false,
    }),
  logoutAll: () => apiClient<void>("/auth/logout-all", { method: "POST" }),
};
