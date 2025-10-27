const { StatusCodes } = require("http-status-codes");
const courseService = require("../services/courseService");

const addNewCourse = async (req, res) => {
  const course = await courseService.createCourse(req.body);
  const lecturer = course.lecturer;
  
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Course created successfully",
    course: { 
      id: course._id,
      title: course.title,
      code: course.code,
      lecturer: lecturer?.name,
      level: course.level,
      creditUnit: course.creditUnit,
      semester: course.semester,
      session: course.session,
      department: course.department,
    },
  });
};

const listAllCourse = async (req, res) => {
  const courses = await courseService.getAllCourses();

  if (!courses.length) {
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "No courses found",
      data: [],
    });
  }

  const formattedCourses = courses.map((course) => ({
    id: course._id,
    title: course.title,
    code: course.code,
    lecturer: course.lecturer ? {
      id: course.lecturer._id,
      name: course.lecturer.fullName,
      email: course.lecturer.email,
    } : null,
    department: course.department,
    level: course.level,
    creditUnit: course.creditUnit,
    semester: course.semester,
    session: course.session,
    isActive: course.isActive,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  }));

  res.status(StatusCodes.OK).json({
    success: true,
    count: formattedCourses.length,
    data: formattedCourses,
  });
};

const getCourse = async (req, res) => {
  const course = await courseService.getCourseById(req.params.id);
  
  res.status(StatusCodes.OK).json({
    success: true,
    course: {
      id: course._id,
      title: course.title,
      code: course.code,
      lecturer: course.lecturer ? {
        id: course.lecturer._id,
        name: course.lecturer.name,
        email: course.lecturer.email,
      } : null,
      department: course.department,
      level: course.level,
      creditUnit: course.creditUnit,
      semester: course.semester,
      session: course.session,
      description: course.description,
      isActive: course.isActive,
      totalStudents: course.students?.length || 0,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    },
  });
};

const updateACourse = async (req, res) => {
  const updatedCourse = await courseService.updateCourse(req.params.id, req.body);
  
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Course updated successfully",
    course: {
      id: updatedCourse._id,
      title: updatedCourse.title,
      code: updatedCourse.code,
      lecturer: updatedCourse.lecturer ? {
        id: updatedCourse.lecturer._id,
        name: updatedCourse.lecturer.fullName,
        email: updatedCourse.lecturer.email,
      } : null,
      department: updatedCourse.department,
      level: updatedCourse.level,
      creditUnit: updatedCourse.creditUnit,
      semester: updatedCourse.semester,
      session: updatedCourse.session,
      isActive: updatedCourse.isActive,
      totalStudents: updatedCourse.students?.length || 0,
      createdAt: updatedCourse.createdAt,
      updatedAt: updatedCourse.updatedAt,
    },
  });
};

const deleteACourse = async (req, res) => {
  const course = await courseService.deleteCourse(req.params.id);
  res.status(StatusCodes.OK).json({
    success: true,
    message: `Course "${course.title}" (${course.code}) deleted successfully.`,
  });
};

module.exports = {
  addNewCourse,
  listAllCourse,
  getCourse,
  updateACourse,
  deleteACourse,
};