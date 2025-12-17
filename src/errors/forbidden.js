// src/errors/ForbiddenError.js
const CustomError = require("./custom-api");
const { StatusCodes } = require("http-status-codes");

class ForbiddenError extends CustomError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.FORBIDDEN;
  }
}

module.exports = ForbiddenError;
