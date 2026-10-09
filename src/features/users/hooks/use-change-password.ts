import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { usersApi } from "../api/users-api";
import type { ChangePasswordRequest } from "../types";

export function useChangePassword() {
  const clear = useAuthStore((state) => state.clear);

  return useMutation({
    mutationFn: (data: ChangePasswordRequest) =>
      usersApi.changePassword(data),
    onSuccess: () => clear(),
  });
}
