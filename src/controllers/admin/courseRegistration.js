const { StatusCodes } = require("http-status-codes");
const CourseRegistrationService = require("../../services/courseRegistration");

const updateRegistrationSettings = async (req, res) => {
  const { courseId } = req.params;
  const settings = req.body;
  const userId = req.user.userId;
  const userRole = req.user.role;

  console.log(settings)

  const course =
    await CourseRegistrationService.updateCourseRegistrationSettings(
      courseId,
      settings,
      userId,
      userRole
    );

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Registration settings updated successfully",
    course,
  });
};

const closeRegistration = async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.userId;
  const userRole = req.user.role;

  const course = await CourseRegistrationService.closeRegistration(
    courseId,
    userId,
    userRole
  );

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Course registration closed successfully",
    course,
  });
};

const openRegistration = async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.userId;
  const userRole = req.user.role;

  const course = await CourseRegistrationService.openRegistration(
    courseId,
    userId,
    userRole
  );

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Course registration opened successfully",
    course,
  });
};

const bulkSetDeadlineForDepartment = async (req, res) => {
  const departmentId = req.body.departmentId;
  const deadline = req.body.deadline;
  const userId = req.user.userId;
  const userRole = req.user.role;

  const result = await CourseRegistrationService.bulkSetDeadlineForDepartment(
    departmentId,
    deadline,
    userId,
    userRole
  );

  res.status(StatusCodes.OK).json({
    success: true,
    ...result,
  });
};

const bulkSetDeadlineForSession = async (req, res) => {
  const deadline = req.body.deadline;
  const userId = req.user.userId;
  const userRole = req.user.role;

  const result = await CourseRegistrationService.bulkSetDeadlineForSession(
    deadline,
    userId,
    userRole
  );

  res.status(StatusCodes.OK).json({
    success: true,
    ...result,
  });
};

const getRegistrationStatistics = async (req, res) => {
  const userId = req.user.userId;
  const userRole = req.user.role;

  const stats = await CourseRegistrationService.getRegistrationStatistics(
    userId,
    userRole
  );

  res.status(StatusCodes.OK).json({
    success: true,
    stats,
  });
};

module.exports = {
  updateRegistrationSettings,
  closeRegistration,
  openRegistration,
  bulkSetDeadlineForDepartment,
  bulkSetDeadlineForSession,
  getRegistrationStatistics,
};
