import { useAuthStore } from "../stores/auth-store";

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");

  return { user, isAuthenticated, isAdmin };
}
