const Course = require("../models/Course");
const User = require("../models/User");
const { NotFoundError, BadRequestError } = require("../errors");
const { isValidCourseCode, isValidSession } = require("../utils/validators");
const Result = require("../models/Result");

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

  async getCourseDetails(courseId, lecturerId) {
    // Verify course belongs to lecturer
    const course = await Course.findById(courseId)
      .populate("department", "name code faculty")
      .populate("lecturer", "name email staffId");

    if (!course) {
      throw new NotFoundError("Course not found");
    }

    if (course.lecturer._id.toString() !== lecturerId.toString()) {
      throw new ForbiddenError("You don't have permission to view this course");
    }

    // Get registered students
    const students = await User.find({
      _id: { $in: course.students },
      role: "student",
    })
      .select("name matricNo email level department")
      .populate("department", "name code")
      .sort({ name: 1 });

    // Get all results for this course
    const results = await Result.find({ course: courseId })
      .populate("student", "name matricNo level")
      .sort({ createdAt: -1 });

    // Calculate statistics
    const stats = {
      totalStudents: course.students.length,
      totalResults: results.length,
      pendingResults: course.students.length - results.length,
      averageScore:
        results.length > 0
          ? (
              results.reduce((sum, r) => sum + r.total, 0) / results.length
            ).toFixed(2)
          : 0,
      passRate:
        results.length > 0
          ? (
              (results.filter((r) => r.grade !== "F").length / results.length) *
              100
            ).toFixed(2)
          : 0,
      gradeDistribution: results.reduce((acc, r) => {
        acc[r.grade] = (acc[r.grade] || 0) + 1;
        return acc;
      }, {}),
    };

    // Get students without results
    const studentsWithResults = new Set(
      results.map((r) => r.student._id.toString())
    );
    const studentsWithoutResults = students.filter(
      (s) => !studentsWithResults.has(s._id.toString())
    );

    return {
      course: {
        _id: course._id,
        title: course.title,
        code: course.code,
        creditUnit: course.creditUnit,
        level: course.level,
        semester: course.semester,
        session: course.session,
        department: course.department,
        isActive: course.isActive,
      },
      stats,
      students,
      results,
      studentsWithoutResults,
    };
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
