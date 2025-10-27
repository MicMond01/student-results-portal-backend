const Result = require("../models/Result");
const Course = require("../models/Course");

// Common population config
const RESULT_POPULATE = [
  { path: "student", select: "name identifier" },
  { path: "course", select: "code title semester session level creditUnit" },
];

class ResultService {
  static async getResultsUploadedBy(lecturerId) {
    return await Result.find({ uploadedBy: lecturerId })
      .populate(RESULT_POPULATE)
      .sort({ "course.code": 1, "student.name": 1 });
  }

  static async getResultsForLecturerCourses(lecturerId) {
    const courses = await Course.find({ lecturer: lecturerId });

    if (courses.length === 0) {
      return { results: [], courses: [] };
    }

    const courseIds = courses.map((course) => course._id);
    const results = await Result.find({ course: { $in: courseIds } })
      .populate(RESULT_POPULATE)
      .sort({ "student.identifier": 1, createdAt: -1 });

    return { results, courses };
  }

  static async createResult(data) {
    const result = await Result.create(data);
    return await Result.findById(result._id).populate(RESULT_POPULATE);
  }

  static async updateResult(result, updates) {
    const { ca, exam, semester, session } = updates;

    if (ca !== undefined) result.ca = ca;
    if (exam !== undefined) result.exam = exam;
    if (semester) result.semester = semester;
    if (session) result.session = session;

    await result.save();
    return await Result.findById(result._id).populate(RESULT_POPULATE);
  }

  static async getResultWithStudent(resultId) {
    const result = await Result.findById(resultId)
      .populate({
        path: "student",
        select: "name identifier level department", // choose what you want
      })
      .populate({
        path: "course",
        select: "code title creditUnit level semester session",
      })
      .populate({
        path: "uploadedBy",
        select: "name email role",
      });

    if (!result) {
      throw new NotFoundError("Result not found");
    }

    // Structure output as requested
    return {
      result,
      student: result.student,
    };
  }

  static async deleteResult(resultId) {
    return await Result.findByIdAndDelete(resultId);
  }

  static async checkDuplicateResult(student, course, session) {
    return await Result.findOne({ student, course, session });
  }
}

module.exports = ResultService;
