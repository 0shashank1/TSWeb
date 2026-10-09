export type UpdateProfileRequest = {
  displayName: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};
