const { UnauthenticatedError, UnauthorizedError } = require("../errors");


const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new UnauthenticatedError("User not authenticated");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new UnauthorizedError(
        `Access denied. Only ${allowedRoles.join(", ")} can access this route`
      );
    }

    next();
  };
};

const adminOnly = authorizeRoles("admin");
const lecturerOrAdmin = authorizeRoles("lecturer", "admin");
const studentOnly = authorizeRoles("student");



module.exports = {
  authorizeRoles,
  adminOnly,
  lecturerOrAdmin,
  studentOnly,
};