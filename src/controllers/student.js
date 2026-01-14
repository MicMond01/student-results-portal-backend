const { StatusCodes } = require("http-status-codes");
const Course = require("../models/Course");
const Result = require("../models/Result");
const User = require("../models/User");
const { NotFoundError } = require("../errors");
const {
  calculateAcademicStats,
  groupResultsBySession,
  groupCoursesBySession,
} = require("../utils/helpers");

const getMyResults = async (req, res) => {
  const studentId = req.user.userId;
  const { session, semester } = req.query;

  // Build filter
  const filter = { student: studentId };
  if (session) filter.session = session;
  if (semester) filter.semester = semester;

  // Fetch results
  const results = await Result.find(filter)
    .select("course ca exam total grade session semester createdAt updatedAt")
    .populate("course", "title code creditUnit level semester session")
    .sort({ session: -1, semester: 1 });

  // ✅ Check if results exist
  if (!results || results.length === 0) {
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "No results found",
      totalResults: 0,
      statistics: {
        cgpa: 0,
        totalCreditUnits: 0,
      },
      results: [],
    });
  }

  // Group results and calculate stats
  const groupedResults = groupResultsBySession(results);
  const stats = calculateAcademicStats(results);

  res.status(StatusCodes.OK).json({
    success: true,
    totalResults: results.length,
    statistics: {
      cgpa: stats.cgpa,
      totalCreditUnits: stats.totalCreditUnits,
    },
    results: groupedResults,
  });
};

const getOwnProfile = async (req, res) => {
  const studentId = req.user.userId;

  // Get student with all fields except password and lecturer-specific fields
  const student = await User.findById(studentId).select(
    "-password -staffId -rank -specialization -yearsOfExperience -officeLocation -highestDegree -institution -previousPasswords"
  );

  if (!student) {
    throw new NotFoundError("Student profile not found");
  }

  // // Fetch enrolled courses
  // const courses = await Course.find({ students: studentId })
  //   .select("title code creditUnit lecturer semester session level")
  //   .populate("lecturer", "name email")
  //   .sort({ semester: 1, level: 1 });

  // // Fetch all results
  // const results = await Result.find({ student: studentId })
  //   .select("course ca exam total grade session semester")
  //   .populate("course", "title code creditUnit level")
  //   .sort({ session: -1, semester: 1 });

  // // Calculate academic statistics
  // const stats = calculateAcademicStats(results);

  res.status(StatusCodes.OK).json({
    success: true,
    profile: {
      // ✅ Basic Info
      id: student._id,
      name: student.name,
      identifier: student.identifier,
      role: student.role,

      // ✅ Academic Info
      matricNo: student.matricNo,
      faculty: student.faculty,
      department: student.departmentName,
      level: student.level,
      program: student.program,
      admissionYear: student.admissionYear,
      session: student.session,
      academicAdvisor: student.academicAdvisor,
      status: student.status,
      school: student.school,

      // ✅ Personal Info
      profilePhoto: student.profilePhoto,
      gender: student.gender,
      dateOfBirth: student.dateOfBirth,
      phone: student.phone,
      email: student.email,
      address: student.address,
      placeOfBirth: student.placeOfBirth,
      stateOfOrigin: student.stateOfOrigin,

      // ✅ Account Info
      accountStatus: student.accountStatus,
      isVerified: student.isVerified,
      verifiedAt: student.verifiedAt,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    },
  });
};

const getMyCourses = async (req, res) => {
  const studentId = req.user.userId;
  const { session, semester, level } = req.query;

  const filter = { students: studentId };
  if (session) filter.session = session;
  if (semester) filter.semester = semester;
  if (level) filter.level = parseInt(level);

  const courses = await Course.find(filter)
    .select("title code creditUnit lecturer semester session level description")
    .populate("lecturer", "name email identifier")
    .sort({ session: -1, level: 1, semester: 1, code: 1 });

  // ✅ Group courses by session and semester
  const groupedCourses = groupCoursesBySession(courses);

  res.status(StatusCodes.OK).json({
    success: true,
    totalCourses: courses.length,
    groupedCourses,
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
