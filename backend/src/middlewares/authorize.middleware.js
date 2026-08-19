import { ROLES, normalizeRole } from "../constants/roles.js";

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
      data: null,
    });
  }

  /*
   * Normalize before comparing so a legacy record stored as
   * "admin" is still treated as an admin.
   */
  if (normalizeRole(req.user.role) !== ROLES.ADMIN) {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
      data: null,
    });
  }

  next();
};

export{
  requireAdmin,
};
