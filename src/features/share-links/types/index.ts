export type ShareLink = {
  id: string;
  snippetId: string;
  expiresAtUtc: string | null;
  maxUses: number | null;
  useCount: number;
  isPasswordProtected: boolean;
  isRevoked: boolean;
  lastAccessedAtUtc: string | null;
  createdAtUtc: string;
};

export type CreateShareLinkRequest = {
  expiresAtUtc?: string | null;
  maxUses?: number | null;
  password?: string | null;
};

export type CreateShareLinkResponse = {
  id: string;
  url: string;
  expiresAtUtc: string | null;
  maxUses: number | null;
  useCount: number;
  isPasswordProtected: boolean;
  createdAtUtc: string;
};

export type UpdateShareLinkRequest = {
  expiresAtUtc?: string | null;
  maxUses?: number | null;
};
