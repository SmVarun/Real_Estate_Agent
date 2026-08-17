import crypto from "crypto";
import argon2 from "argon2";

import User from "../models/user.model.js";
import PasswordResetToken from "../models/password-reset-token.model.js";
import credential from "../config/config.js";

import { sendEmail } from "./email.service.js";
import { revokeAllUserSessions } from "./session.service.js";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

const hashResetToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const invalidResetTokenError = () => {
  const error = new Error("Invalid or expired reset token.");
  error.statusCode = 400;
  return error;
};

const requestPasswordReset = async ({ email }) => {
  const user = await User.findOne({ email });

  if (!user) {
    return;
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await PasswordResetToken.create({
    userId: user._id,
    tokenHash,
    expiresAt,
  });

  const resetUrl = `${credential.frontendUrl}/reset-password?token=${rawToken}`;

  /*
   * A transient SMTP failure must not leak whether the account
   * exists via a different response than the "unknown email" path.
   */
  try {
    await sendEmail({
      to: user.email,
      subject: "Reset your password",
      html: `<p>We received a request to reset your password.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>`,
      text: `We received a request to reset your password. Use this link (expires in 1 hour): ${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    });
  } catch (error) {
    console.error("Failed to send password reset email:", error.message);
  }
};

const resetPassword = async ({ token, password }) => {
  const tokenHash = hashResetToken(token);

  const resetToken = await PasswordResetToken.findOne({ tokenHash });

  if (!resetToken) {
    throw invalidResetTokenError();
  }

  if (resetToken.usedAt) {
    throw invalidResetTokenError();
  }

  if (resetToken.expiresAt < new Date()) {
    throw invalidResetTokenError();
  }

  const user = await User.findById(resetToken.userId);

  if (!user) {
    throw invalidResetTokenError();
  }

  user.passwordHash = await argon2.hash(password);
  await user.save();

  resetToken.usedAt = new Date();
  await resetToken.save();

  await revokeAllUserSessions(user._id);
};

export {
  requestPasswordReset,
  resetPassword,
};
