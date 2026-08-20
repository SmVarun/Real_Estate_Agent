import argon2 from "argon2";

import User from "../models/user.model.js";
import credential from "../config/config.js";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

import { toPublicUser } from "../utils/user.js";

const unauthorizedError = (message) => {
  const error = new Error(message);
  error.statusCode = 401;
  return error;
};

const signAccessToken = (user) => {
  return generateAccessToken(
    {
      sub: user._id.toString(),
      role: user.role,
      type: "access",
    },
    credential.jwtaccesssecret,
    credential.accessExpiresIn
  );
};

const signRefreshToken = (user) => {
  return generateRefreshToken(
    {
      sub: user._id.toString(),
      type: "refresh",
    },
    credential.jwtrefreshsecret,
    credential.refreshExpiresIn
  );
};

/*
 * Single entry point for handing out credentials.
 *
 * Register and login both go through here, so a freshly
 * registered user is authenticated exactly like one who
 * just signed in and can walk straight into onboarding.
 *
 * Nothing is persisted: both tokens are self-contained JWTs,
 * so authentication stays stateless.
 */
const issueTokens = async (user) => {
  const accessToken = await signAccessToken(user);
  const refreshToken = await signRefreshToken(user);

  /*
   * Issuing tokens counts as a login.
   */
  user.lastLoginAt = new Date();
  await user.save();

  return {
    user: toPublicUser(user),
    accessToken,
    refreshToken,
  };
};

const registerUser = async ({ name, email, username, password }) => {
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
  return issueTokens(user);
};

const loginUser = async ({ email, password }) => {
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

  return issueTokens(user);
};

/*
 * Exchange a valid refresh token for a fresh access token.
 *
 * The refresh token is NOT rotated and never touches the
 * database — verifying its signature is the whole check. The
 * user is still loaded so a deleted or deactivated account
 * cannot keep minting access tokens.
 */
const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw unauthorizedError("Refresh token is required");
  }

  let payload;

  try {
    payload = await verifyRefreshToken(
      refreshToken,
      credential.jwtrefreshsecret
    );
  } catch (error) {
    throw unauthorizedError("Invalid or expired refresh token");
  }

  if (payload.type !== "refresh" || !payload.sub) {
    throw unauthorizedError("Invalid refresh token");
  }

  const user = await User.findById(payload.sub);

  if (!user || !user.isActive) {
    throw unauthorizedError("Invalid refresh token");
  }

  const accessToken = await signAccessToken(user);

  return { accessToken };
};

export {
  registerUser,
  loginUser,
  refreshAccessToken,
};
