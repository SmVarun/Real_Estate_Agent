import { SignJWT, jwtVerify } from "jose";
import { randomUUID } from "node:crypto";

const generateAccessToken = async (payload, secret, expiresIn) => {
  return new SignJWT(payload)
    .setProtectedHeader({
      alg: "HS256",
      typ: "JWT",
    })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(new TextEncoder().encode(secret));
};

const generateRefreshToken = async (payload, secret, expiresIn) => {
  /*
   * jti guarantees uniqueness even when two refresh tokens for the
   * same user are issued within the same second (same iat/exp),
   * which would otherwise collide on Session.refreshTokenHash.
   */
  return new SignJWT({ ...payload, jti: randomUUID() })
    .setProtectedHeader({
      alg: "HS256",
      typ: "JWT",
    })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(new TextEncoder().encode(secret));
};

const verifyAccessToken = async (token, secret) => {
  const { payload } = await jwtVerify(
    token,
    new TextEncoder().encode(secret),
    { algorithms: ["HS256"] }
  );

  return payload;
};

const verifyRefreshToken = async (token, secret) => {
  const { payload } = await jwtVerify(
    token,
    new TextEncoder().encode(secret),
    { algorithms: ["HS256"] }
  );

  return payload;
};

export {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
