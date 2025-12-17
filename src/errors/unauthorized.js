const { StatusCodes } = require("http-status-codes");
const CustomAPIError = require("./custom-api");

class UnauthorizedError extends CustomAPIError {
  constructor(message = "Unauthorized access") {
    super(message, StatusCodes.UNAUTHORIZED); // ✅ 401
  }
}

module.exports = UnauthorizedError;
