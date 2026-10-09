import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api/admin-api";
import type {
  AdminUsersParams,
  SetUserRoleRequest,
  SetUserStatusRequest,
} from "../types";

export const adminKeys = {
  users: (params?: AdminUsersParams) => ["admin", "users", params ?? {}] as const,
  user: (userId: string) => ["admin", "user", userId] as const,
};

export function useAdminUsers(params?: AdminUsersParams) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => adminApi.listUsers(params),
  });
}

export function useAdminUser(userId: string) {
  return useQuery({
    queryKey: adminKeys.user(userId),
    queryFn: () => adminApi.getUser(userId),
    enabled: Boolean(userId),
  });
}

export function useSetUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: SetUserStatusRequest;
    }) => adminApi.setUserStatus(userId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useSetUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: SetUserRoleRequest;
    }) => adminApi.setUserRole(userId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
