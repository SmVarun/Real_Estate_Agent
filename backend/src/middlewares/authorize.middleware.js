const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
      data: null,
    });
  }

  console.log(req.user)

  if (req.user.role !== "ADMIN") {
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