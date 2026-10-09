import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { usersApi } from "../api/users-api";

export function useMe() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ["users", "me"],
    queryFn: usersApi.getMe,
    enabled: isAuthenticated,
  });
}
