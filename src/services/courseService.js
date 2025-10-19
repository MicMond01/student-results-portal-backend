const Course = require("../models/Course");
const User = require("../models/User");
const { NotFoundError, BadRequestError } = require("../errors");
const { isValidCourseCode, isValidSession } = require("../utils/validators");

class CourseService {
  async createCourse(courseData) {
    const {
      title,
      code,
      lecturer,
      department,
      level,
      creditUnit,
      semester,
      session,
      description,
    } = courseData;

    if (
      !title ||
      !code ||
      !lecturer ||
      !department ||
      !level ||
      !creditUnit ||
      !semester ||
      !session
    ) {
      throw new BadRequestError("Please provide all required course details.");
    }

    const assignedLecturer = await User.findById(lecturer);
    if (!assignedLecturer) throw new NotFoundError("Lecturer not found.");
    if (assignedLecturer.role !== "lecturer") {
      throw new BadRequestError("Only a lecturer can be assigned to a course.");
    }

    const existingCourse = await Course.findOne({ code });
    if (existingCourse) {
      throw new BadRequestError("A course with this code already exists.");
    }

    return await Course.create({
      title,
      code,
      lecturer,
      department,
      level,
      creditUnit,
      semester,
      description,
      session,
    });
  }

  async getAllCourses() {
    return await Course.find()
      .populate("lecturer", "fullName email role")
      .sort({ level: 1, code: 1 });
  }

  async getCourseById(courseId) {
    const course = await Course.findById(courseId)
      .populate("lecturer", "name email role")
      .populate({
        path: "students",
        select: "name identifier role",
        options: { limit: 3 },
      });

    if (!course)
      throw new NotFoundError(`No course found with ID: ${courseId}`);
    return course;
  }

  async updateCourse(courseId, updates) {
    const restrictedFields = ["_id", "students", "createdAt", "updatedAt"];
    restrictedFields.forEach((field) => delete updates[field]);

    if (Object.keys(updates).length === 0) {
      throw new BadRequestError("Please provide fields to update.");
    }

    if (updates.code && !isValidCourseCode(updates.code)) {
      throw new BadRequestError("Invalid course code format. Example: CSC101");
    }

    if (updates.session && !isValidSession(updates.session)) {
      throw new BadRequestError("Invalid session format. Example: 2024/2025");
    }

    const updatedCourse = await Course.findByIdAndUpdate(courseId, updates, {
      new: true,
      runValidators: true,
    }).populate("lecturer", "fullName email role");

    if (!updatedCourse)
      throw new NotFoundError(`No course found with ID: ${courseId}`);
    return updatedCourse;
  }

  async deleteCourse(courseId) {
    const course = await Course.findByIdAndDelete(courseId);
    if (!course)
      throw new NotFoundError(`No course found with ID: ${courseId}`);
    return course;
  }
}

module.exports = new CourseService();
