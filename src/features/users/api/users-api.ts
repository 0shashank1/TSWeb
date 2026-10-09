import { apiClient } from "@/lib/api-client";
import type { User } from "@/types/user";
import type { ChangePasswordRequest, UpdateProfileRequest } from "../types";

export const usersApi = {
  getMe: () => apiClient<User>("/users/me"),
  updateMe: (data: UpdateProfileRequest) =>
    apiClient<User>("/users/me", { method: "PATCH", body: data }),
  changePassword: (data: ChangePasswordRequest) =>
    apiClient<void>("/users/me/password", { method: "PATCH", body: data }),
  deleteMe: () => apiClient<void>("/users/me", { method: "DELETE" }),
};
