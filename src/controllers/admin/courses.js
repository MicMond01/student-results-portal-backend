const { StatusCodes } = require("http-status-codes");
const { CourseService } = require("../../services/admin");

const createCourse = async (req, res) => {
  const course = await CourseService.createCourse(req.body);
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Course created successfully",
    course,
  });
};

const getAllCourses = async (req, res) => {
  const { department, level, semester, session, lecturer } = req.query;
  const courses = await CourseService.getAllCourses({
    department,
    level,
    semester,
    session,
    lecturer,
  });

  res.status(StatusCodes.OK).json({
    success: true,
    count: courses.length,
    courses,
  });
};

const getCoursesByDepartment = async (req, res) => {
  const data = await CourseService.getCoursesByDepartment(req.params.deptId);
  res.status(StatusCodes.OK).json({
    success: true,
    count: data.length,
    courses: data,
  });
};

const updateCourse = async (req, res) => {
  const course = await CourseService.updateCourse(req.params.id, req.body);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Course updated successfully",
    course,
  });
};

const deleteCourse = async (req, res) => {
  await CourseService.deleteCourse(req.params.id);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Course deleted successfully",
  });
};

module.exports = {
  createCourse,
  getAllCourses,
  getCoursesByDepartment,
  updateCourse,
  deleteCourse,
};
