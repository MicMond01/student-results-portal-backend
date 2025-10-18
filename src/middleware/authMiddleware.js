const jwt = require("jsonwebtoken");
const { UnauthenticatedError } = require("../errors");

const authenticationMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer"))
    throw new UnauthenticatedError("Invalid token");

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token)
    throw new UnauthenticatedError("Bad request");

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: payload.userId,
      name: payload.name,
      role: payload.role,
    };
    next();
  } catch (error) {
    throw new UnauthenticatedError("Authorization invalid");
  }
};

module.exports = {
  authenticationMiddleware,
};
