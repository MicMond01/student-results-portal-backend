const { StatusCodes } = require("http-status-codes");
const userService = require("../services/userService");

const getAllUsers = async (req, res) => {
  const users = await userService.getAllUsers();
  res.status(StatusCodes.OK).json({
    success: true,
    count: users.length,
    users,
  });
};

const getUser = async (req, res) => {
  const { id: userId } = req.params;
  const data = await userService.getUserById(userId);
  res.status(StatusCodes.OK).json({ success: true, ...data });
};

const createNewUser = async (req, res) => {
  const newUser = await userService.createUser(req.body);
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "User created successfully",
    user: {
      id: newUser._id,
      name: newUser.name,
      role: newUser.role,
    },
  });
};

const updateUserDetails = async (req, res) => {
  const { id: userId } = req.params;
  const user = await userService.updateUser(userId, req.body);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "User details updated successfully",
    user: {
      id: user._id,
      name: user.name,
      identifier: user.identifier,
      role: user.role,
    },
  });
};

const deleteUser = async (req, res) => {
  await userService.deleteUser(req.params.id);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "User deleted successfully",
  });
};

const getAllLecturers = async (req, res) => {
  const lecturers = await userService.getUsersByRole("lecturer");
  res.status(StatusCodes.OK).json({
    success: true,
    count: lecturers.length,
    lecturers,
  });
};

const getAllStudents = async (req, res) => {
  const students = await userService.getUsersByRole("student");
  res.status(StatusCodes.OK).json({
    success: true,
    count: students.length,
    students,
  });
};

module.exports = {
  getAllUsers,
  getUser,
  createNewUser,
  updateUserDetails,
  deleteUser,
  getAllLecturers,
  getAllStudents,
};
