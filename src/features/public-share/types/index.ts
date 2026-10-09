export type SharedText = {
  id: string;
  title: string;
  content: string;
  expiresAtUtc: string | null;
};

export type UnlockRequest = {
  password: string;
};

export type UnlockResponse = {
  accessToken: string;
  expiresAtUtc: string;
};
