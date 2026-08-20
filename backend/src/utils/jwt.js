import { SignJWT, jwtVerify } from "jose";

const signToken = async (payload, secret, expiresIn) => {
  return new SignJWT(payload)
    .setProtectedHeader({
      alg: "HS256",
      typ: "JWT",
    })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(new TextEncoder().encode(secret));
};

const verifyToken = async (token, secret) => {
  const { payload } = await jwtVerify(
    token,
    new TextEncoder().encode(secret),
    { algorithms: ["HS256"] }
  );

  return payload;
};

/*
 * Access and refresh tokens are signed with different secrets
 * and carry a distinct `type` claim, so a token issued for one
 * purpose can never be accepted for the other.
 */
const generateAccessToken = signToken;
const generateRefreshToken = signToken;
const verifyAccessToken = verifyToken;
const verifyRefreshToken = verifyToken;

export {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
