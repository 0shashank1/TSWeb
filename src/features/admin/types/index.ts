import type { PaginationParams } from "@/types/api";
import type { UserRole } from "@/types/user";

export type AdminUserListItem = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAtUtc: string;
};

export type AdminUserDetail = AdminUserListItem & {
  lastLoginAtUtc: string | null;
  snippetCount: number;
  activeRefreshTokenCount: number;
};

export type AdminUsersParams = PaginationParams & {
  status?: "active" | "inactive";
  role?: UserRole;
};

export type SetUserStatusRequest = {
  isActive: boolean;
};

export type SetUserRoleRequest = {
  role: UserRole;
};

export type AccessLog = {
  id: string;
  shareLinkId: string;
  userId: string | null;
  accessedAtUtc: string;
  wasSuccessful: boolean;
  ipAddress: string;
  failureReason: string | null;
};

export type AccessLogsParams = PaginationParams & {
  success?: boolean;
  reason?: string;
  from?: string;
  to?: string;
};

export type RefreshTokenRecord = {
  id: string;
  userId: string;
  familyId: string;
  createdAtUtc: string;
  expiresAtUtc: string;
  revokedAtUtc: string | null;
  revocationReason: string | null;
  createdByIp: string;
};
