export type UserRole = "user" | "admin";

export type User = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAtUtc: string;
  lastLoginAtUtc: string | null;
};
