import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth-api";
import { useAuthStore } from "../stores/auth-store";
import type { LoginRequest } from "../types";

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (data) => setSession(data),
  });
}
