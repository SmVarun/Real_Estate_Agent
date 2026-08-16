import Session from "../models/session.model.js";
import { hashToken } from "../utils/token.js";

const createSession = async ({
  userId,
  refreshToken,
  userAgent,
  ipAddress,
  expiresAt,
}) => {
  const refreshTokenHash = hashToken(refreshToken);

  const session = await Session.create({
    userId,
    refreshTokenHash,
    userAgent,
    ipAddress,
    expiresAt,
  });

  return session;
};

const findSessionByRefreshToken = async (refreshToken) => {
  const refreshTokenHash = hashToken(refreshToken);

  return Session.findOne({
    refreshTokenHash,
  }).select("+refreshTokenHash");
};

const revokeSession = async (sessionId) => {
  await Session.findByIdAndUpdate(sessionId, {
    revokedAt: new Date(),
  });
};

export {
  createSession,
  findSessionByRefreshToken,
  revokeSession,
};