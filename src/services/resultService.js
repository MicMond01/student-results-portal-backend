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
        select: "name identifier level department matricNo", // choose what you want
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

  static async getResultsUploadTemplate(format) {
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
        requiredFields: ["matricNo", "ca", "exam"],
        optionalFields: ["name"],
        caRange: "0-40",
        examRange: "0-60",
        matricNote: "Matric number is used to identify students",
        nameNote: "Name is for reference only, not used for matching",
      },
    };

    return template;
  }

  static async bulkUploadResults(resultsData, courseId, lecturerId) {
    const results = { success: [], failed: [] };

    // Verify course exists and belongs to lecturer
    const course = await Course.findById(courseId).populate("department");
    if (!course) {
      throw new NotFoundError("Course not found");
    }

    if (course.lecturer.toString() !== lecturerId.toString()) {
      throw new ForbiddenError(
        "You don't have permission to upload results for this course"
      );
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
        if (
          student.department.toString() !== course.department._id.toString()
        ) {
          results.failed.push({
            data,
            error: `Student ${matricNo} is not in ${course.department.name} department`,
          });
          continue;
        }

        // Check if student is registered for this course
        const isRegistered = course.students.some(
          (s) => s.toString() === student._id.toString()
        );

        if (!isRegistered) {
          results.failed.push({
            data,
            error: `Student ${matricNo} is not registered for ${course.code}`,
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
          existingResult.ca = parseFloat(ca);
          existingResult.exam = parseFloat(exam);
          existingResult.uploadedBy = lecturerId;

          await existingResult.save(); // triggers total & grade recalculation

          results.success.push({
            matricNo,
            name: student.name,
            ca: existingResult.ca,
            exam: existingResult.exam,
            total: existingResult.total,
            grade: existingResult.grade,
            updated: true,
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
          uploadedBy: lecturerId,
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

  static async deleteResult(resultId) {
    return await Result.findByIdAndDelete(resultId);
  }

  static async checkDuplicateResult(student, course, session) {
    return await Result.findOne({ student, course, session });
  }
}

module.exports = ResultService;
