import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/auth-api";
import { useAuthStore } from "../stores/auth-store";

export function useLogout() {
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const clear = useAuthStore((state) => state.clear);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      refreshToken ? authApi.logout(refreshToken) : Promise.resolve(),
    onSettled: () => {
      clear();
      queryClient.clear();
    },
  });
}
