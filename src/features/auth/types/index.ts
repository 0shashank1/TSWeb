import type { User } from "@/types/user";

export type { User, UserRole } from "@/types/user";

export type RegisterRequest = {
  email: string;
  password: string;
  displayName: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthResponse = {
  user: User;
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
};

export type RefreshRequest = {
  refreshToken: string;
};

export type RefreshResponse = {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
};
