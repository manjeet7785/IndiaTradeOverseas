export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role assignment [${req.user?.role || 'NONE'}] is unauthorized for this asset pipeline`,
        errorCode: 'RBAC_FORBIDDEN'
      });
    }
    next();
  };
};




