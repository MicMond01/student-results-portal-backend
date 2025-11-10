const { StatusCodes } = require("http-status-codes");

const errorHandlerMiddleware = (err, req, res, next) => {
  console.error(err); // 👈 always log the real error in backend for debugging

  let customError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || "Something went wrong, please try again later.",
  };

  // ✅ Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    customError.msg = Object.values(err.errors)
      .map((item) => item.message)
      .join(", ");
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  // ✅ Handle Mongoose duplicate key errors
  if (err.code && err.code === 11000) {
    const field = Object.keys(err.keyValue);
    customError.msg = `Duplicate value entered for ${field}, please choose another value.`;
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  // ✅ Handle invalid ObjectId errors
  if (err.name === "CastError") {
    customError.msg = `No item found with id: ${err.value}`;
    customError.statusCode = StatusCodes.NOT_FOUND;
  }

  // ✅ Handle JWT errors (if applicable)
  if (err.name === "JsonWebTokenError") {
    customError.msg = "Invalid authentication token.";
    customError.statusCode = StatusCodes.UNAUTHORIZED;
  }

  if (err.name === "TokenExpiredError") {
    customError.msg = "Your session has expired. Please log in again.";
    customError.statusCode = StatusCodes.UNAUTHORIZED;
  }

  // ✅ Send final structured response
  return res.status(customError.statusCode).json({
    success: false,
    message: customError.msg,
  });
};

module.exports = errorHandlerMiddleware;
