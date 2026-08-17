import crypto from "crypto";

import User from "../models/user.model.js";
import EmailVerificationToken from "../models/email-verification-token.model.js";
import credential from "../config/config.js";

import { sendEmail } from "./email.service.js";
import { hashToken } from "../utils/token.js";
import { getExpirationDate } from "../utils/date.js";

const EMAIL_VERIFICATION_EXPIRES_IN =
  process.env.EMAIL_VERIFICATION_EXPIRES_IN || "24h";

const invalidVerificationTokenError = () => {
  const error = new Error("Invalid or expired verification token");
  error.statusCode = 400;
  return error;
};

const issueVerificationToken = async (user) => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = getExpirationDate(EMAIL_VERIFICATION_EXPIRES_IN);

  /*
   * Invalidate previous unused tokens so only one active
   * verification token exists per user at a time.
   */
  await EmailVerificationToken.updateMany(
    { userId: user.id, usedAt: null },
    { usedAt: new Date() }
  );

  await EmailVerificationToken.create({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  return rawToken;
};

const sendVerificationEmail = async (user) => {
  const rawToken = await issueVerificationToken(user);

  const verificationUrl = `${credential.frontendUrl}/verify-email?token=${rawToken}`;

  /*
   * A transient SMTP failure must not fail the caller (registration
   * or resend) since the token has already been persisted.
   */
  try {
    await sendEmail({
      to: user.email,
      subject: "Verify your email address",
      html: `<p>Thanks for registering. Please verify your email address to activate your account.</p><p><a href="${verificationUrl}">${verificationUrl}</a></p><p>This link expires in ${EMAIL_VERIFICATION_EXPIRES_IN}. If you did not create this account, you can ignore this email.</p>`,
      text: `Thanks for registering. Please verify your email address to activate your account. Use this link (expires in ${EMAIL_VERIFICATION_EXPIRES_IN}): ${verificationUrl}\n\nIf you did not create this account, you can ignore this email.`,
    });
  } catch (error) {
    console.error("Failed to send verification email:", error.message);
  }
};

const verifyEmail = async ({ token }) => {
  const tokenHash = hashToken(token);

  const verificationToken = await EmailVerificationToken.findOne({
    tokenHash,
  });

  if (!verificationToken) {
    throw invalidVerificationTokenError();
  }

  if (verificationToken.usedAt) {
    throw invalidVerificationTokenError();
  }

  if (verificationToken.expiresAt < new Date()) {
    throw invalidVerificationTokenError();
  }

  const user = await User.findById(verificationToken.userId);

  if (!user) {
    throw invalidVerificationTokenError();
  }

  if (!user.isEmailVerified) {
    user.isEmailVerified = true;
    await user.save();
  }

  verificationToken.usedAt = new Date();
  await verificationToken.save();
};

const resendVerificationEmail = async ({ email }) => {
  const user = await User.findOne({ email });

  if (!user || user.isEmailVerified) {
    return;
  }

  await sendVerificationEmail(user);
};

export {
  sendVerificationEmail,
  verifyEmail,
  resendVerificationEmail,
};
