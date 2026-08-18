import User from "../models/user.model.js";
import { verifyAccessToken } from "../utils/jwt.js";
import credential from "../config/config.js";

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        data: null,
      });
    }

    const token = authHeader.split(" ")[1];

    const payload = await verifyAccessToken(
      token,
      credential.jwtaccesssecret
    );

    const user = await User.findById(payload.sub).select(
      "-passwordHash -twoFactorSecret"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
        data: null,
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User account is inactive",
        data: null,
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
      data: null,
    });
  }
};

export default authenticate;