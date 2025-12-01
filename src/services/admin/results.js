const Result = require("../../models/Result");
const User = require("../../models/User");
const Course = require("../../models/Course");
const { NotFoundError, BadRequestError } = require("../../errors");

class ResultService {
  async createResult(data) {
    const { student, course, ca, exam } = data;

    if (!student || !course || ca === undefined || exam === undefined) {
      throw new BadRequestError("Missing required fields");
    }

    const [studentExists, courseExists] = await Promise.all([
      User.findOne({ _id: student, role: "student" }),
      Course.findById(course),
    ]);

    if (!studentExists) throw new NotFoundError("Student not found");
    if (!courseExists) throw new NotFoundError("Course not found");

    const exists = await Result.findOne({ student, course });
    if (exists) throw new BadRequestError("Result already exists");

    return await Result.create(data);
  }

  async bulkCreateResults(resultsData) {
    const results = { success: [], failed: [] };

    for (const item of resultsData) {
      try {
        const [studentExists, courseExists] = await Promise.all([
          User.findOne({ _id: item.student, role: "student" }),
          Course.findById(item.course),
        ]);

        if (!studentExists) {
          results.failed.push({ data: item, error: "Student not found" });
          continue;
        }

        if (!courseExists) {
          results.failed.push({ data: item, error: "Course not found" });
          continue;
        }

        const exists = await Result.findOne({
          student: item.student,
          course: item.course,
        });

        if (exists) {
          results.failed.push({ data: item, error: "Result exists" });
          continue;
        }

        const created = await Result.create(item);
        results.success.push(created);
      } catch (err) {
        results.failed.push({ data: item, error: err.message });
      }
    }

    return results;
  }

  async getStudentResults(studentId, filters = {}) {
    const { session, semester, level } = filters;

    // Verify student exists
    const student = await User.findOne({ _id: studentId, role: "student" })
      .select("-password")
      .populate({
        path: "department",
        select: "name code faculty",
      });

    if (!student) {
      throw new NotFoundError("Student not found");
    }

    const query = { student: studentId };

    if (session) query.session = session;
    if (semester) query.semester = semester;

    let results = await Result.find(query)
      .populate({
        path: "course",
        select: "title code creditUnit level semester session department",
        populate: {
          path: "department",
          select: "name code",
        },
      })
      .sort({ session: -1, semester: 1, createdAt: -1 });

    // Filter by course level if provided
    if (level) {
      results = results.filter((r) => r.course.level === parseInt(level));
    }

    return {
      student,
      results,
    };
  }

  async getResultsByCourse(courseId, filters = {}) {
    const { session, semester } = filters;

    const course = await Course.findById(courseId);
    if (!course) {
      throw new NotFoundError("Course not found");
    }

    const query = { course: courseId };

    if (session) query.session = session;
    if (semester) query.semester = semester;

    const results = await Result.find(query)
      .populate({
        path: "student",
        select:
          "name matricNo department level email phone gender status program session admissionYear",

        populate: {
          path: "department",
          select: "name code faculty",
        },
      })
      .populate({
        path: "course",
        select: "title code creditUnit level semester session",
      })
      .sort({ total: -1 }); // Sort by highest score first

    return results;
  }

  async getResultsByLecturer(lecturerId, filters = {}) {
    const { session, semester } = filters;

    const lecturer = await User.findOne({ _id: lecturerId, role: "lecturer" });
    if (!lecturer) {
      throw new NotFoundError("Lecturer not found");
    }

    // Get all courses taught by this lecturer
    const courseQuery = { lecturer: lecturerId };
    if (session) courseQuery.session = session;
    if (semester) courseQuery.semester = semester;

    const courses = await Course.find(courseQuery).select("_id title code");
    const courseIds = courses.map((c) => c._id);

    if (courseIds.length === 0) {
      return {
        lecturer: {
          _id: lecturer._id,
          name: lecturer.name,
          email: lecturer.email,
        },
        courses: [],
        totalResults: 0,
        results: [],
      };
    }

    const results = await Result.find({ course: { $in: courseIds } })
      .populate({
        path: "student",
        select: "name matricNo department level",
        populate: {
          path: "department",
          select: "name code",
        },
      })
      .populate({
        path: "course",
        select: "title code creditUnit level semester session",
      })
      .sort({ createdAt: -1 });

    return {
      lecturer: {
        _id: lecturer._id,
        name: lecturer.name,
        email: lecturer.email,
      },
      courses: courses.map((c) => ({
        _id: c._id,
        title: c.title,
        code: c.code,
      })),
      totalResults: results.length,
      results,
    };
  }

  async getAllResults(filters = {}) {
    const { student, course, department, session, semester } = filters;
    const query = {};

    if (student) query.student = student;
    if (course) query.course = course;
    if (session) query.session = session;
    if (semester) query.semester = semester;

    let q = Result.find(query)
      .populate({
        path: "student",
        select:
          "name matricNo department level email phone gender status program session admissionYear",
        populate: {
          path: "department",
          select: "name code faculty",
        },
      })
      .populate({
        path: "course",
        select: "title code creditUnit level semester session department",
        populate: {
          path: "department",
          select: "name code",
        },
      });

    if (department) {
      q = q.populate({
        path: "student",
        match: { department },
      });
    }

    const results = await q.sort({ createdAt: -1 });

    return department ? results.filter((r) => r.student) : results;
  }

  async updateResult(id, data) {
    const result = await Result.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    })
      .populate("student", "name matricNo")
      .populate("course", "title code");

    if (!result) throw new NotFoundError("Result not found");

    return result;
  }

  async deleteResult(id) {
    const result = await Result.findById(id);
    if (!result) throw new NotFoundError("Result not found");

    await result.deleteOne();
    return result;
  }
}

module.exports = new ResultService();
