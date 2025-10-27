const { UnauthenticatedError, BadRequestError } = require("../errors");
const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");

const register = async (req, res) => {
  const user = await User.create({ ...req.body });
  const token = user.createJWT();
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

const loggedInUser = async (req, res) => {
  try {
    // req.user comes from your authenticationMiddleware
    const user = await User.findById(req.user.userId).select("-password -__v");

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });
    }

    // Send only relevant user info
    res.status(StatusCodes.OK).json({
      user: {
        id: user._id,
        name: user.name,
        identifier: user.identifier,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Something went wrong" });
  }
};

module.exports = {
  register,
  login,
  loggedInUser,
};
