import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { usersApi } from "../api/users-api";
import type { UpdateProfileRequest } from "../types";

export function useUpdateProfile() {
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => usersApi.updateMe(data),
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(["users", "me"], user);
    },
  });
}
