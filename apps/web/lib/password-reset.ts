import {
  createHash,
  randomBytes,
} from "crypto";

export const PASSWORD_RESET_MINUTES = 60;

export function createPasswordResetToken() {
  const token =
    randomBytes(32).toString("hex");

  const tokenHash =
    createHash("sha256")
      .update(token)
      .digest("hex");

  return {
    token,
    tokenHash,
  };
}

export function hashPasswordResetToken(
  token: string
) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}
