/*
 * Restrict a route to specific roles.
 *
 * Must run AFTER requireAuth — it reads req.user, which
 * requireAuth populates from the database.
 *
 *   router.patch("/:id/role", requireAuth, requireRole(ROLES.ADMIN), handler)
 */
const requireRole = (...allowedRoles) => {
  /*
   * Fail loudly at wiring time rather than silently letting
   * everyone through on a route that meant to be guarded.
   */
  if (allowedRoles.length === 0) {
    throw new Error("requireRole() needs at least one role");
  }

  return (req, res, next) => {
    if (!req.user) {
      const error = new Error("Authentication required");
      error.statusCode = 401;
      return next(error);
    }

    if (!allowedRoles.includes(req.user.role)) {
      /*
       * 403, not 401: the caller is authenticated, they just
       * are not permitted. Do not name the required role —
       * that leaks the permission model.
       */
      const error = new Error("You do not have permission to perform this action");
      error.statusCode = 403;
      return next(error);
    }

    return next();
  };
};

export { requireRole };
