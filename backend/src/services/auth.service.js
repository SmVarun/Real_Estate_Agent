import argon2 from "argon2";

import User from "../models/user.model.js";
import credential from "../config/config.js";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwt.js";

import {
  createSession,
} from "./session.service.js";

import {
  getExpirationDate,
} from "../utils/date.js";

const registerUser = async ({
  name,
  email,
  username,
  password,
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

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
  };
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

  /*
   * Generate access token
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

  /*
   * Generate refresh token
   */
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
   * Update last login
   */
  user.lastLoginAt = new Date();
  await user.save();

  /*
   * Never return passwordHash or 2FA secret.
   */
  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      lastLoginAt: user.lastLoginAt,
    },

    accessToken,
    refreshToken,
  };
};

export {
  registerUser,
  loginUser,
};