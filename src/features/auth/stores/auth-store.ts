import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthResponse, RefreshResponse, User } from "@/features/auth/types";

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAtUtc: string | null;
  isAuthenticated: boolean;
  setSession: (auth: AuthResponse) => void;
  setRefreshedSession: (auth: RefreshResponse) => void;
  setUser: (user: User) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      accessTokenExpiresAtUtc: null,
      isAuthenticated: false,
      setSession: (auth) =>
        set({
          user: auth.user,
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          accessTokenExpiresAtUtc: auth.accessTokenExpiresAtUtc,
          isAuthenticated: true,
        }),
      setRefreshedSession: (auth) =>
        set({
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          accessTokenExpiresAtUtc: auth.accessTokenExpiresAtUtc,
        }),
      setUser: (user) => set({ user }),
      clear: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          accessTokenExpiresAtUtc: null,
          isAuthenticated: false,
        }),
    }),
    { name: "textshare.auth" },
  ),
);
