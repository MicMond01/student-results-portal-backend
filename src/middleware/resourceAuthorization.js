const { UnauthorizedError, NotFoundError } = require("../errors");
const Result = require("../models/Result");
const Course = require("../models/Course");

const canModifyResult = async (req, res, next) => {
  const { id } = req.params;
  const lecturerId = req.user.userId;

  const result = await Result.findById(id).populate("course");

  if (!result) {
    throw new NotFoundError(`No result found with id ${id}`);
  }

  // Check if lecturer teaches the course or uploaded the result
  const isAuthorized =
    result.course.lecturer.toString() === lecturerId ||
    result.uploadedBy?.toString() === lecturerId;

  if (!isAuthorized) {
    throw new UnauthorizedError("You are not authorized to modify this result");
  }

  req.result = result; // Pass to controller
  next();
};

const canAccessCourse = async (req, res, next) => {
  const { course } = req.body;
  const lecturerId = req.user.userId;

  const courseDoc = await Course.findOne({
    _id: course,
    lecturer: lecturerId,
  });

  if (!courseDoc) {
    throw new UnauthorizedError("You are not authorized to access this course");
  }

  req.courseDoc = courseDoc; // Pass to controller
  next();
};

module.exports = { canModifyResult, canAccessCourse };
