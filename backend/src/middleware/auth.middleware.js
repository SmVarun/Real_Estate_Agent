import User from "../models/user.model.js";
import credential from "../config/config.js";
import { verifyAccessToken } from "../utils/jwt.js";

const unauthorizedError = (message) => {
  const error = new Error(message);
  error.statusCode = 401;
  return error;
};

/*
 * Pull the raw JWT out of "Authorization: Bearer <token>".
 *
 * Returns null rather than throwing so the caller decides
 * whether a missing token is fatal (requireAuth) or fine
 * (optionalAuth).
 */
const extractBearerToken = (req) => {
  const header = req.get("authorization");

  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");

  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
};

/*
 * Verify the access token and attach the CURRENT user.
 *
 * The token carries a role claim, but we deliberately do not
 * trust it for authorization. Access tokens live ~15 minutes,
 * so a role claim signed before a promotion or a deactivation
 * would stay stale for that whole window. Loading the user
 * makes role and isActive changes take effect on the very
 * next request instead.
 */
const requireAuth = async (req, res, next) => {
  try {
    const token = extractBearerToken(req);

    if (!token) {
      throw unauthorizedError("Authentication required");
    }

    let payload;

    try {
      payload = await verifyAccessToken(
        token,
        credential.jwtaccesssecret
      );
    } catch (error) {
      throw unauthorizedError("Invalid or expired access token");
    }

    /*
     * Refresh tokens are signed with a different secret, so one
     * cannot verify here — but check the type anyway so the
     * intent of the token is always explicit.
     */
    if (payload.type !== "access") {
      throw unauthorizedError("Invalid access token");
    }

    const user = await User.findById(payload.sub);

    if (!user) {
      throw unauthorizedError("Invalid access token");
    }

    if (!user.isActive) {
      const error = new Error("Account is inactive");
      error.statusCode = 403;
      throw error;
    }

    /*
     * Downstream handlers read req.user.role, which is the
     * database value — never the claim from the token.
     */
    req.user = user;

    return next();
  } catch (error) {
    next(error);
  }
};

export { requireAuth, extractBearerToken };
