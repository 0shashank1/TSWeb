import { requireUser, revokeAllUserTokens } from "../auth";
import { get, run } from "../db";
import type { UserRow } from "../models";
import { hashPassword, verifyPassword } from "../password";
import { readJson, safe, unauthorized, validationProblem } from "../problem";
import { serializeUser } from "../serialize";

type UpdateProfileRequest = { displayName?: string };
type ChangePasswordRequest = {
  currentPassword?: string;
  newPassword?: string;
};

export const userRoutes = {
  "/api/v1/users/me": {
    GET: safe(async (req) => {
      return Response.json(serializeUser(requireUser(req)));
    }),

    PATCH: safe(async (req) => {
      const user = requireUser(req);
      const body = await readJson<UpdateProfileRequest>(req);
      const displayName = (body.displayName ?? "").trim();

      const errors: Record<string, string[]> = {};
      if (!displayName) errors.displayName = ["Display name is required."];
      else if (displayName.length > 100) {
        errors.displayName = ["Display name must be 100 characters or fewer."];
      }
      if (Object.keys(errors).length > 0) throw validationProblem(errors);

      run("UPDATE users SET display_name = ? WHERE id = ?", displayName, user.id);
      user.display_name = displayName;
      return Response.json(serializeUser(user));
    }),

    DELETE: safe(async (req) => {
      const user = requireUser(req);
      run("UPDATE users SET is_active = 0 WHERE id = ?", user.id);
      revokeAllUserTokens(user.id, "account-deactivated");
      return new Response(null, { status: 204 });
    }),
  },

  "/api/v1/users/me/password": {
    PATCH: safe(async (req) => {
      const user = requireUser(req);
      const body = await readJson<ChangePasswordRequest>(req);

      const currentPassword = body.currentPassword ?? "";
      const newPassword = body.newPassword ?? "";

      const errors: Record<string, string[]> = {};
      if (!currentPassword) {
        errors.currentPassword = ["Current password is required."];
      }
      if (newPassword.length < 8) {
        errors.newPassword = ["New password must be at least 8 characters."];
      }
      if (Object.keys(errors).length > 0) throw validationProblem(errors);

      const fresh = get<UserRow>("SELECT * FROM users WHERE id = ?", user.id);
      const ok = fresh
        ? await verifyPassword(currentPassword, fresh.password_hash)
        : false;
      if (!ok) throw unauthorized("The current password is incorrect.");

      run(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        await hashPassword(newPassword),
        user.id,
      );
      revokeAllUserTokens(user.id, "password-changed");
      return new Response(null, { status: 204 });
    }),
  },
};
