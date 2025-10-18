const User = require("../models/User");

const getAllUsers = async (req, res) => {
  const users = await User.find();
  res.status(StatusCodes.OK).json({  });
};

const getUser = (req, res) => {
  res.send("Get user");
};

const createNewUser = (req, res) => {
  res.send("Create new user");
};

const updateUserDetails = (req, res) => {
  res.send("Update user details");
};

const deleteUser = (req, res) => {
  res.send("Delete User");
};

const getAllLecturers = (req, res) => {
  res.send("Get all Lecturers");
};

const getAllStudents = (req, res) => {
  res.send("Get all Students");
};

const addNewCourse = (req, res) => {
  res.send("Add New course");
};
const listAllCourse = (req, res) => {
  res.send("List all course");
};
const updateACourse = (req, res) => {
  res.send("Update A course");
};
const deleteACourse = (req, res) => {
  res.send("Delete A course");
};

module.exports = {
  getAllUsers,
  getUser,
  createNewUser,
  updateUserDetails,
  deleteUser,
  getAllLecturers,
  getAllStudents,
  addNewCourse,
  listAllCourse,
  updateACourse,
  deleteACourse,
};
