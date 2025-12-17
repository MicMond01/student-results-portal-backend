const { StatusCodes } = require("http-status-codes");
const CourseRegistrationService = require("../../services/courseRegistration");

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

module.exports = {
  getAvailableCourses,
  registerForCourse,
  unregisterFromCourse,
  getMyRegisteredCourses,
};
