const Result = require("../../models/Result");
const User = require("../../models/User");
const Course = require("../../models/Course");
const { NotFoundError, BadRequestError } = require("../../errors");
const Department = require("../../models/Department");

class ResultService {
  async createResult(data) {
    const { student, course, ca, exam } = data;
    console.log(student, course, ca, exam);

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

  async getResultsUploadTemplate(format) {
    const template = {
      headers: ["matricNo", "name", "ca", "exam"],
      sampleData: [
        {
          matricNo: "LASU/CS/2024/000001",
          name: "John Doe",
          ca: 28,
          exam: 55,
        },
        {
          matricNo: "LASU/CS/2024/000002",
          name: "Jane Smith",
          ca: 30,
          exam: 60,
        },
      ],
      instructions: {
        note: "Course and department will be selected during upload",
        requiredFields: [
          "matricNo",
          "name - Optional Field ",
          "ca - (0-40)",
          "exam - (0-60)",
        ],
        matricNote: "Matric number is used to identify students",
        nameNote: "Name is for reference only, not used for matching",
      },
    };

    return template;
  }

  async bulkCreateResults(resultsData, courseId, departmentId) {
    const results = { success: [], failed: [] };

    // Verify course exists
    const course = await Course.findById(courseId).populate("department");
    if (!course) {
      throw new NotFoundError("Course not found");
    }

    // Verify course belongs to department
    if (course.department._id.toString() !== departmentId) {
      throw new BadRequestError(
        "Course does not belong to selected department"
      );
    }

    // Verify department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      throw new NotFoundError("Department not found");
    }

    for (const data of resultsData) {
      try {
        const { matricNo, name, ca, exam } = data;

        // Validate required fields
        if (!matricNo) {
          results.failed.push({
            data,
            error: "Matric number is required",
          });
          continue;
        }

        if (ca === undefined || ca === null) {
          results.failed.push({
            data,
            error: "CA score is required",
          });
          continue;
        }

        if (exam === undefined || exam === null) {
          results.failed.push({
            data,
            error: "Exam score is required",
          });
          continue;
        }

        // Validate score ranges
        if (ca < 0 || ca > 40) {
          results.failed.push({
            data,
            error: "CA must be between 0 and 40",
          });
          continue;
        }

        if (exam < 0 || exam > 60) {
          results.failed.push({
            data,
            error: "Exam must be between 0 and 60",
          });
          continue;
        }

        // Find student by matric number
        const student = await User.findOne({
          matricNo: matricNo.trim(),
          role: "student",
        });

        if (!student) {
          results.failed.push({
            data,
            error: `Student with matric ${matricNo} not found`,
          });
          continue;
        }

        // Check if student is in the correct department
        if (student.department.toString() !== departmentId) {
          results.failed.push({
            data,
            error: `Student ${matricNo} is not in ${department.name} department`,
          });
          continue;
        }

        // Check if result already exists
        const existingResult = await Result.findOne({
          student: student._id,
          course: courseId,
          session: course.session,
          semester: course.semester,
        });

        if (existingResult) {
          results.failed.push({
            data,
            error: `Result already exists for ${matricNo} in ${course.code}`,
          });
          continue;
        }

        // Create result
        const result = await Result.create({
          student: student._id,
          course: courseId,
          session: course.session,
          semester: course.semester,
          ca: parseFloat(ca),
          exam: parseFloat(exam),
          uploadedBy: course.lecturer,
        });

        results.success.push({
          matricNo,
          name: student.name,
          ca: result.ca,
          exam: result.exam,
          total: result.total,
          grade: result.grade,
        });
      } catch (error) {
        results.failed.push({
          data,
          error: error.message,
        });
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
        path: "student",
        select: "name matricNo department",
        populate: {
          path: "department",
          select: "name code",
        },
      })
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

  async updateResult(resultId, data) {
    const result = await Result.findById(resultId);

    if (!result) {
      throw new NotFoundError("Result not found");
    }

    // Update fields
    if (data.ca !== undefined) result.ca = data.ca;
    if (data.exam !== undefined) result.exam = data.exam;
    if (data.session) result.session = data.session;
    if (data.semester) result.semester = data.semester;

    await result.save();

    // Populate and return
    const updatedResult = await Result.findById(result._id)
      .populate("student", "name matricNo department")
      .populate("course", "title code creditUnit");

    return updatedResult;
  }

  async deleteResult(id) {
    const result = await Result.findById(id);
    if (!result) throw new NotFoundError("Result not found");

    await result.deleteOne();
    return result;
  }
}

module.exports = new ResultService();
