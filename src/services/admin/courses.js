const Course = require("../../models/Course");
const mongoose = require("mongoose");
const User = require("../../models/User");
const Department = require("../../models/Department");
const Result = require("../../models/Result");
const { NotFoundError, BadRequestError } = require("../../errors");

class CourseService {
  async createCourse(data) {
    const { title, code, department, lecturer } = data;

    if (!title || !code || !department || !lecturer) {
      throw new BadRequestError("Missing required fields");
    }

    const [dept, lecturerExists] = await Promise.all([
      Department.findById(department),
      User.findOne({ _id: lecturer, role: "lecturer" }),
    ]);

    if (!dept) throw new NotFoundError("Department not found");
    if (!lecturerExists) throw new NotFoundError("Lecturer not found");

    const exists = await Course.findOne({ code });
    if (exists) throw new BadRequestError("Course code already exists");

    return await Course.create(data);
  }

  async getAllCourses(filters = {}) {
    const { department, level, semester, session, lecturer } = filters;
    const query = {};

    if (department) {
      if (!mongoose.Types.ObjectId.isValid(department)) {
        throw new BadRequestError("Invalid department ID format");
      }
      query.department = new mongoose.Types.ObjectId(department);
    }

    if (level) query.level = level;
    if (semester) query.semester = semester;
    if (session) query.session = session;
    if (lecturer) {
      if (!mongoose.Types.ObjectId.isValid(lecturer)) {
        throw new BadRequestError("Invalid lecturer ID format");
      }
      query.lecturer = lecturer;
    }

    return await Course.find(query)
      .populate("department", "name code faculty")
      .populate("lecturer", "name email")
      .sort({ code: 1 });
  }

  async getCoursesByDepartment(deptId) {
    const courses = await Course.find({ department: deptId })
      .populate("lecturer", "name email")
      .populate("department", "name code faculty");

    if (!courses.length) throw new NotFoundError(`No courses found`);
    return courses;
  }

  async updateCourse(id, data) {
    if (data.department) {
      const dept = await Department.findById(data.department);
      if (!dept) throw new NotFoundError("Department not found");
    }

    if (data.lecturer) {
      const exists = await User.findOne({
        _id: data.lecturer,
        role: "lecturer",
      });
      if (!exists) throw new NotFoundError("Lecturer not found");
    }

    const course = await Course.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    })
      .populate("department", "name code faculty")
      .populate("lecturer", "name email");

    if (!course) throw new NotFoundError("Course not found");

    return course;
  }

  async deleteCourse(id) {
    const course = await Course.findById(id);
    if (!course) throw new NotFoundError("Course not found");

    const hasResults = await Result.exists({ course: id });
    if (hasResults) {
      throw new BadRequestError("Cannot delete course with existing results");
    }

    await course.deleteOne();
    return course;
  }
}

module.exports = new CourseService();
