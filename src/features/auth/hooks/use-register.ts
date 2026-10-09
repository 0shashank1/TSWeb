import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth-api";
import { useAuthStore } from "../stores/auth-store";
import type { RegisterRequest } from "../types";

export function useRegister() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (data) => setSession(data),
  });
}
