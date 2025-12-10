const Exam = require("../../models/Exam");
const Course = require("../../models/Course");
const { NotFoundError } = require("../../errors");

class ExamService {
  async getAllExams(filters = {}) {
    const { course, department, session, semester, lecturer } = filters;
    const query = {};

    // Only add to query if it's not "all" and exists
    if (course && course !== "all") query.course = course;
    if (session && session !== "all") query.session = session;
    if (semester && semester !== "all") query.semester = semester;

    let examsQuery = Exam.find(query)
      .populate({
        path: "course",
        select: "title code level semester session department lecturer",
        populate: [
          {
            path: "department",
            select: "name code",
          },
          {
            path: "lecturer",
            select: "name email staffId",
          },
        ],
      })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    let exams = await examsQuery;

    // Filter by department if provided and not "all"
    if (department && department !== "all") {
      exams = exams.filter(
        (exam) =>
          exam.course?.department?._id.toString() === department.toString()
      );
    }

    // Filter by lecturer if provided and not "all"
    if (lecturer && lecturer !== "all") {
      exams = exams.filter(
        (exam) => exam.course?.lecturer?._id.toString() === lecturer.toString()
      );
    }

    return exams;
  }

  async updateExam(examId, data) {
    const exam = await Exam.findById(examId);
    if (!exam) throw new NotFoundError("Exam not found");

    // Clean the data before updating
    const cleanData = { ...data };

    // If course is an object (populated), extract just the ID
    if (cleanData.course) {
      if (typeof cleanData.course === "object") {
        cleanData.course = cleanData.course._id;
      }
      // Additional check: if course is "all" or invalid, remove it
      if (cleanData.course === "all" || !cleanData.course) {
        delete cleanData.course;
      }
    }

    // Remove any other populated fields that shouldn't be updated
    delete cleanData.createdBy;
    delete cleanData._id;
    delete cleanData.__v;
    delete cleanData.createdAt;
    delete cleanData.updatedAt;

    return await Exam.findByIdAndUpdate(examId, cleanData, {
      new: true,
      runValidators: true,
    }).populate({
      path: "course",
      select: "title code level semester session department lecturer",
      populate: [
        {
          path: "department",
          select: "name code",
        },
        {
          path: "lecturer",
          select: "name email staffId",
        },
      ],
    });
  }

  async deleteExam(examId) {
    const exam = await Exam.findById(examId);
    if (!exam) throw new NotFoundError("Exam not found");

    // Check if exam has submissions (if you have that feature)
    // const submissions = await ExamSubmission.countDocuments({ exam: examId });
    // if (submissions > 0) {
    //   throw new BadRequestError("Cannot delete exam with existing submissions");
    // }

    await exam.deleteOne();
    return exam;
  }
}

module.exports = new ExamService();
