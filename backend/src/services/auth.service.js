import argon2 from "argon2";

import User from "../models/user.model.js";
import credential from "../config/config.js";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

import {
  createSession,
  findSessionByRefreshToken,
  revokeSession,
} from "./session.service.js";

import {
  getExpirationDate,
} from "../utils/date.js";

import { toPublicUser } from "../utils/user.js";

/*
 * Single entry point for handing out credentials.
 *
 * Register and login both go through here, so a freshly
 * registered user is authenticated exactly like one who
 * just signed in and can walk straight into onboarding.
 */
const issueSession = async ({ user, userAgent, ipAddress }) => {
  const accessToken = await generateAccessToken(
    {
      sub: user._id.toString(),
      role: user.role,
      type: "access",
    },
    credential.jwtaccesssecret,
    credential.accessExpiresIn
  );

  const refreshToken = await generateRefreshToken(
    {
      sub: user._id.toString(),
      type: "refresh",
    },
    credential.jwtrefreshsecret,
    credential.refreshExpiresIn
  );

  /*
   * Calculate refresh-token/session expiry
   */
  const expiresAt = getExpirationDate(
    credential.refreshExpiresIn
  );

  /*
   * Create server-side session.
   *
   * Only the HASH of the refresh token
   * will be stored in MongoDB.
   */
  await createSession({
    userId: user._id,
    refreshToken,
    userAgent,
    ipAddress,
    expiresAt,
  });

  /*
   * Issuing a session counts as a login.
   */
  user.lastLoginAt = new Date();
  await user.save();

  return {
    user: toPublicUser(user),
    accessToken,
    refreshToken,
  };
};

const registerUser = async ({
  name,
  email,
  username,
  password,
  userAgent,
  ipAddress,
}) => {
  const existingEmail = await User.findOne({ email });

  if (existingEmail) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  const existingUsername = await User.findOne({ username });

  if (existingUsername) {
    const error = new Error("Username is already taken");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await argon2.hash(password);

  const user = await User.create({
    name,
    email,
    username,
    passwordHash,
  });

  /*
   * Log the new user straight in — no second /login round trip.
   */
  return issueSession({
    user,
    userAgent,
    ipAddress,
  });
};

const loginUser = async ({
  email,
  password,
  userAgent,
  ipAddress,
}) => {
  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("Account is inactive");
    error.statusCode = 403;
    throw error;
  }

  const isPasswordValid = await argon2.verify(
    user.passwordHash,
    password
  );

  if (!isPasswordValid) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  return issueSession({
    user,
    userAgent,
    ipAddress,
  });
};

const unauthorizedError = (message) => {
  const error = new Error(message);
  error.statusCode = 401;
  return error;
};

const refreshUserSession = async ({
  refreshToken,
  userAgent,
  ipAddress,
}) => {
  /*
   * Hash the incoming refresh token and find its session.
   */
  const session = await findSessionByRefreshToken(refreshToken);

  if (!session) {
    throw unauthorizedError("Invalid refresh token");
  }

  if (session.revokedAt) {
    throw unauthorizedError("Refresh token has been revoked");
  }

  if (session.expiresAt < new Date()) {
    throw unauthorizedError("Refresh token has expired");
  }

  /*
   * Verify the refresh JWT signature/expiry/type.
   */
  let payload;

  try {
    payload = await verifyRefreshToken(
      refreshToken,
      credential.jwtrefreshsecret
    );
  } catch (error) {
    throw unauthorizedError("Invalid refresh token");
  }

  if (payload.type !== "refresh") {
    throw unauthorizedError("Invalid refresh token");
  }

  if (payload.sub !== session.userId.toString()) {
    throw unauthorizedError("Invalid refresh token");
  }

  const user = await User.findById(session.userId);

  if (!user || !user.isActive) {
    throw unauthorizedError("Invalid refresh token");
  }

  /*
   * Generate new token pair
   */
  const accessToken = await generateAccessToken(
    {
      sub: user._id.toString(),
      role: user.role,
      type: "access",
    },
    credential.jwtaccesssecret,
    credential.accessExpiresIn
  );

  const newRefreshToken = await generateRefreshToken(
    {
      sub: user._id.toString(),
      type: "refresh",
    },
    credential.jwtrefreshsecret,
    credential.refreshExpiresIn
  );

  const expiresAt = getExpirationDate(
    credential.refreshExpiresIn
  );

  /*
   * Rotate: revoke the old session so the old refresh token
   * can never be used again, then create a new session for
   * the new refresh token.
   */
  await revokeSession(session._id);

  await createSession({
    userId: user._id,
    refreshToken: newRefreshToken,
    userAgent,
    ipAddress,
    expiresAt,
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

const logoutUser = async ({ refreshToken }) => {
  /*
   * Hash the incoming refresh token and find its session.
   */
  const session = await findSessionByRefreshToken(refreshToken);

  if (!session) {
    throw unauthorizedError("Invalid refresh token");
  }

  if (session.revokedAt) {
    throw unauthorizedError("Refresh token has been revoked");
  }

  await revokeSession(session._id);
};

export {
  registerUser,
  loginUser,
  refreshUserSession,
  logoutUser,
};
