const { StatusCodes } = require("http-status-codes");
const Course = require("../models/Course");
const Result = require("../models/Result");
const User = require("../models/User");
const { NotFoundError } = require("../errors");
const {
  calculateAcademicStats,
  groupResultsBySession,
} = require("../utils/helpers");

const getMyResults = async (req, res) => {
  const studentId = req.user.userId;

  const results = await Result.find({ student: studentId })
    .select("course ca exam total grade session semester")
    .populate("course", "title code creditUnit level")
    .sort({ session: -1, semester: 1 });

  const groupedResults = groupResultsBySession(results);
  const stats = calculateAcademicStats(results);

  res.status(StatusCodes.OK).json({
    success: true,
    count: results.length,
    statistics: {
      cgpa: stats.cgpa,
      totalCreditUnits: stats.totalCreditUnits,
    },
    results: groupedResults,
  });
};

const getOwnProfile = async (req, res) => {
  const studentId = req.user.userId;

  const student = await User.findById(studentId).select("-password");

  if (!student) {
    throw new NotFoundError("Student profile not found");
  }

  // Fetch enrolled courses
  const courses = await Course.find({ students: studentId })
    .select("title code creditUnit lecturer semester session level")
    .populate("lecturer", "name email")
    .sort({ semester: 1, level: 1 });

  // Fetch all results
  const results = await Result.find({ student: studentId })
    .select("course ca exam total grade session semester")
    .populate("course", "title code creditUnit level")
    .sort({ session: -1, semester: 1 });

  // Calculate academic statistics
  const stats = calculateAcademicStats(results);

  res.status(StatusCodes.OK).json({
    success: true,
    profile: {
      id: student._id,
      name: student.name,
      identifier: student.identifier,
      role: student.role,
    },
    academics: {
      totalCourses: courses.length,
      totalResults: results.length,
      cgpa: stats.cgpa,
      totalCreditUnits: stats.totalCreditUnits,
    },
    courses,
    results: groupResultsBySession(results),
  });
};

const getMyCourses = async (req, res) => {
  const studentId = req.user.userId;
  const { session, semester, level } = req.query;

  const filter = { students: studentId };
  if (session) filter.session = session;
  if (semester) filter.semester = semester;
  if (level) filter.level = level;

  const courses = await Course.find(filter)
    .select("title code creditUnit lecturer semester session level description")
    .populate("lecturer", "name email")
    .sort({ level: 1, semester: 1 });

  res.status(StatusCodes.OK).json({
    success: true,
    count: courses.length,
    courses,
  });
};

const updateOwnProfile = async (req, res) => {
  const studentId = req.user.userId;
  const { name, password } = req.body; // Only allow updating certain fields

  const student = await User.findById(studentId);
  if (!student) {
    throw new NotFoundError("Student not found");
  }

  // Students shouldn't be able to change identifier or role
  if (name) student.name = name;

  if (password) {
    const bcrypt = require("bcryptjs");
    const salt = await bcrypt.genSalt(10);
    student.password = await bcrypt.hash(password, salt);
  }

  await student.save();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Profile updated successfully",
    profile: {
      id: student._id,
      name: student.name,
      identifier: student.identifier,
      role: student.role,
    },
  });
};

module.exports = {
  getMyResults,
  getOwnProfile,
  updateOwnProfile,
  getMyCourses,
};
