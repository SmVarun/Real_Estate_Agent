import { SignJWT } from "jose";

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
  return new SignJWT(payload)
    .setProtectedHeader({
      alg: "HS256",
      typ: "JWT",
    })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(new TextEncoder().encode(secret));
};

export {
  generateAccessToken,
  generateRefreshToken,
};
