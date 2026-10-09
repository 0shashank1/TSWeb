import { apiClient } from "@/lib/api-client";
import type { Paginated } from "@/types/api";
import type {
  AccessLog,
  AccessLogsParams,
  AdminUserDetail,
  AdminUserListItem,
  AdminUsersParams,
  RefreshTokenRecord,
  SetUserRoleRequest,
  SetUserStatusRequest,
} from "../types";

export const adminApi = {
  listUsers: (params?: AdminUsersParams) =>
    apiClient<Paginated<AdminUserListItem>>("/admin/users", { params }),
  getUser: (userId: string) =>
    apiClient<AdminUserDetail>(`/admin/users/${userId}`),
  setUserStatus: (userId: string, data: SetUserStatusRequest) =>
    apiClient<void>(`/admin/users/${userId}/status`, {
      method: "PATCH",
      body: data,
    }),
  setUserRole: (userId: string, data: SetUserRoleRequest) =>
    apiClient<void>(`/admin/users/${userId}/role`, {
      method: "PATCH",
      body: data,
    }),
  listAccessLogs: (params?: AccessLogsParams) =>
    apiClient<Paginated<AccessLog>>("/admin/access-logs", { params }),
  listRefreshTokens: (params?: AdminUsersParams) =>
    apiClient<Paginated<RefreshTokenRecord>>("/admin/refresh-tokens", {
      params,
    }),
};
