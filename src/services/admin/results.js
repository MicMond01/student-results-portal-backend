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

  async getAllResults(filters = {}) {
    const { student, course, department, session, semester } = filters;
    const query = {};

    if (student) query.student = student;
    if (course) query.course = course;
    if (session) query.session = session;
    if (semester) query.semester = semester;

    let q = Result.find(query)
      .populate("student", "name matricNo department")
      .populate("course", "title code department");

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
