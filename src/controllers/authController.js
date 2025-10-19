const { UnauthenticatedError } = require("../errors");
const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");

const register = async (req, res) => {
  const user = await User.create({ ...req.body });
  const token = user.createJWT();
  console.log(typeof user.identifier);
  res
    .status(StatusCodes.CREATED)
    .json({ user: { name: user.name, role: user.role }, token });
};

const login = async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    throw new BadRequestError("Please provide email and password");
  }

  const user = await User.findOne({ identifier });

  // compare password
  if (!user) {
    throw new UnauthenticatedError("Invalid Credentials");
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError("Invalid Credentials");
  }

  const token = user.createJWT();
  res
    .status(StatusCodes.OK)
    .json({ user: { name: user.name, role: user.role }, token });
};

const me = (req, res) => {
  res.send("My profile Route");
};

module.exports = {
  register,
  login,
  me,
};
