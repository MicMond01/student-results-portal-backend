const User = require("../../models/User");
const Course = require("../../models/Course");
const Department = require("../../models/Department");
const bcrypt = require("bcryptjs");
const { NotFoundError, BadRequestError } = require("../../errors");
const Result = require("../../models/Result");
const Exam = require("../../models/Exam");

class LecturerService {
  async createLecturer(data) {
    const { name, identifier, password, department } = data;

    if (!name || !identifier || !password || !department) {
      throw new BadRequestError("Missing required fields");
    }

    const deptExists = await Department.findById(department);
    if (!deptExists) throw new NotFoundError("Department not found");

    const exists = await User.findOne({ identifier });
    if (exists) throw new BadRequestError("Identifier already exists");

    return await User.create({ ...data, role: "lecturer" });
  }

  async getAllLecturers(filters = {}) {
    const { department } = filters;
    const query = { role: "lecturer" };

    if (department) query.department = department;

    const lecturers = await User.find(query)
      .select("-password")

      .populate("department", "name code faculty hod")
      .sort({ name: 1 });

    const result = lecturers.map((lecturer) => {
      const lec = lecturer.toObject();
      lec.isHod = !!(
        lec.department &&
        lec.department.hod &&
        lec.department.hod.toString() === lecturer._id.toString()
      );
      return lec;
    });

    return result;
  }

  async getLecturersByDepartment(deptId) {
    const dept = await Department.findById(deptId);
    if (!dept) throw new NotFoundError("Department not found");

    const lecturers = await User.find({
      role: "lecturer",
      department: deptId,
    })
      .select("-password")
      .sort({ name: 1 });

    const result = lecturers.map((lecturer) => {
      const lec = lecturer.toObject();
      lec.isHod = dept.hod && dept.hod.toString() === lecturer._id.toString();
      return lec;
    });

    return {
      department: dept,
      count: result.length,
      lecturers: result,
    };
  }

  async getLecturerDetails(lecturerId) {
    // Get lecturer with department details
    const lecturer = await User.findOne({ _id: lecturerId, role: "lecturer" })
      .select("-password")
      .populate("department", "name code faculty");

    if (!lecturer) {
      throw new NotFoundError("Lecturer not found");
    }

    // Get all courses taught by this lecturer
    const courses = await Course.find({ lecturer: lecturerId })
      .populate("department", "name code")
      .sort({ session: -1, semester: 1, level: 1 });

    // Get all results for courses taught by this lecturer
    const courseIds = courses.map((c) => c._id);
    const results = await Result.find({ course: { $in: courseIds } })
      .populate("student", "name matricNo")
      .populate("course", "code title");

    // Calculate statistics
    const stats = {
      totalCourses: courses.length,
      totalStudentsAcrossAllCourses: courses.reduce(
        (sum, c) => sum + c.students.length,
        0
      ),
      totalResultsUploaded: results.length,

      // Courses by session
      coursesBySession: courses.reduce((acc, course) => {
        acc[course.session] = (acc[course.session] || 0) + 1;
        return acc;
      }, {}),

      // Courses by level
      coursesByLevel: courses.reduce((acc, course) => {
        acc[course.level] = (acc[course.level] || 0) + 1;
        return acc;
      }, {}),

      // Courses by semester
      coursesBySemester: {
        First: courses.filter((c) => c.semester === "First").length,
        Second: courses.filter((c) => c.semester === "Second").length,
      },

      // Average performance across all courses
      averagePerformance:
        results.length > 0
          ? (
              results.reduce((sum, r) => sum + r.total, 0) / results.length
            ).toFixed(2)
          : 0,

      // Grade distribution
      gradeDistribution: results.reduce((acc, r) => {
        acc[r.grade] = (acc[r.grade] || 0) + 1;
        return acc;
      }, {}),

      // Pass rate (grades A-E)
      passRate:
        results.length > 0
          ? (
              (results.filter((r) => r.grade !== "F").length / results.length) *
              100
            ).toFixed(2)
          : 0,
    };

    // Courses with detailed stats per course
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const courseResults = results.filter(
          (r) => r.course._id.toString() === course._id.toString()
        );

        return {
          _id: course._id,
          code: course.code,
          title: course.title,
          level: course.level,
          semester: course.semester,
          session: course.session,
          department: course.department,
          totalStudents: course.students.length,
          totalResults: courseResults.length,
          averageScore:
            courseResults.length > 0
              ? (
                  courseResults.reduce((sum, r) => sum + r.total, 0) /
                  courseResults.length
                ).toFixed(2)
              : 0,
          passRate:
            courseResults.length > 0
              ? (
                  (courseResults.filter((r) => r.grade !== "F").length /
                    courseResults.length) *
                  100
                ).toFixed(2)
              : 0,
          gradeDistribution: courseResults.reduce((acc, r) => {
            acc[r.grade] = (acc[r.grade] || 0) + 1;
            return acc;
          }, {}),
        };
      })
    );

    // Get exams created by this lecturer
    const exams = await Exam.find({ createdBy: lecturerId })
      .populate("course", "code title")
      .select("title examType session semester totalMarks isActive")
      .sort({ createdAt: -1 });

    return {
      lecturer,
      stats,
      courses: coursesWithStats,
      exams,
      recentResults: results.slice(0, 10).map((r) => ({
        _id: r._id,
        student: r.student,
        course: r.course,
        total: r.total,
        grade: r.grade,
        session: r.session,
        semester: r.semester,
      })),
    };
  }

  async updateLecturer(id, data) {
    const lecturer = await User.findById(id);
    if (!lecturer || lecturer.role !== "lecturer") {
      throw new NotFoundError("Lecturer not found");
    }

    if (data.department) {
      const exists = await Department.findById(data.department);
      if (!exists) throw new NotFoundError("Department not found");
    }

    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password, salt);
    }

    if (data.password === "" || data.password === undefined) {
      delete data.password;
    }

    Object.assign(lecturer, data);
    await lecturer.save();
    return lecturer;
  }

  async resetLecturerPassword(lecturerId, newPassword) {
    if (!newPassword) {
      throw new BadRequestError("Please provide new password");
    }

    const lecturer = await User.findById(lecturerId);
    if (!lecturer || lecturer.role !== "lecturer") {
      throw new NotFoundError("Lecturer not found");
    }

    const salt = await bcrypt.genSalt(10);
    lecturer.password = await bcrypt.hash(newPassword, salt);
    lecturer.isUsingDefaultPassword = true;
    lecturer.isFirstLogin = true;

    await lecturer.save();
    return lecturer;
  }

  async deleteLecturer(id) {
    const lecturer = await User.findById(id);
    if (!lecturer || lecturer.role !== "lecturer") {
      throw new NotFoundError("Lecturer not found");
    }

    const hasCourses = await Course.exists({ lecturer: id });
    if (hasCourses) {
      throw new BadRequestError("Reassign courses before deleting lecturer");
    }

    await lecturer.deleteOne();
    return lecturer;
  }
}

module.exports = new LecturerService();
