const { StatusCodes } = require("http-status-codes");
const CourseRegistrationService = require("../../services/courseRegistration");
const User = require("../../models/User");
const Course = require("../../models/Course");
const { SessionService } = require("../../services/admin");
const AcademicSession = require("../../models/AcademicSession");

const getAvailableCourses = async (req, res) => {
  const studentId = req.user.userId;

  const courses = await CourseRegistrationService.getAvailableCoursesForStudent(
    studentId
  );

  res.status(StatusCodes.OK).json({
    success: true,
    count: courses.length,
    courses,
  });
};

const registerForCourse = async (req, res) => {
  const studentId = req.user.userId;
  const { courseId } = req.body;

  if (!courseId) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Course ID is required",
    });
  }

  const result = await CourseRegistrationService.registerStudentForCourse(
    studentId,
    courseId
  );

  res.status(StatusCodes.OK).json({
    success: true,
    ...result,
  });
};

const unregisterFromCourse = async (req, res) => {
  const studentId = req.user.userId;
  const { courseId } = req.params;

  const result = await CourseRegistrationService.unregisterStudentFromCourse(
    studentId,
    courseId
  );

  res.status(StatusCodes.OK).json({
    success: true,
    ...result,
  });
};

const getMyRegisteredCourses = async (req, res) => {
  const studentId = req.user.userId;

  const courses = await CourseRegistrationService.getStudentRegisteredCourses(
    studentId
  );

  res.status(StatusCodes.OK).json({
    success: true,
    count: courses.length,
    courses,
  });
};

// Add this temporarily to your controller
// const getAvailableCourses = async (req, res) => {
//   const studentId = req.user.userId;

//   const student = await User.findById(studentId).select('department level name matricNo');
//   console.log("=== STUDENT INFO ===");
//   console.log("Student:", student);

//   const activeSession = await AcademicSession.findOne({ isActive: true });
//   console.log("\n=== ACTIVE SESSION ===");
//   console.log("Session:", activeSession);

//   const coursesRaw = await Course.find({
//     department: student.department,
//     level: student.level,
//     session: activeSession?.name,
//   });
//   console.log("\n=== COURSES FOUND (RAW) ===");
//   console.log(`Found ${coursesRaw.length} courses`);
//   console.log("Courses:", coursesRaw.map(c => ({
//     code: c.code,
//     title: c.title,
//     level: c.level,
//     session: c.session,
//     department: c.department,
//     isActive: c.isActive,
//     studentsCount: c.students.length
//   })));

//   const courses = await CourseRegistrationService.getAvailableCoursesForStudent(studentId);

//   res.status(StatusCodes.OK).json({
//     success: true,
//     count: courses.length,
//     courses,
//   });
// };

module.exports = {
  getAvailableCourses,
  registerForCourse,
  unregisterFromCourse,
  getMyRegisteredCourses,
  getAvailableCourses,
};
