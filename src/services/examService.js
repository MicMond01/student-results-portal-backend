const Exam = require("../models/Exam");
const Course = require("../models/Course");
const { NotFoundError, BadRequestError } = require("../errors");

class ExamService {
  async createExam(examData) {
    // Verify course exists
    const course = await Course.findById(examData.course);
    if (!course) {
      throw new NotFoundError("Course not found");
    }

    // Calculate total marks from questions
    const totalMarks = examData.questions.reduce((sum, q) => sum + q.marks, 0);

    if (totalMarks !== examData.totalMarks) {
      throw new BadRequestError(
        `Total marks mismatch. Sum of question marks (${totalMarks}) should equal totalMarks (${examData.totalMarks})`
      );
    }

    const exam = await Exam.create(examData);
    return await Exam.findById(exam._id).populate("course", "title code level");
  }

  async getAllExams(filters = {}) {
    const query = {};
    if (filters.course) query.course = filters.course;
    if (filters.session) query.session = filters.session;
    if (filters.semester) query.semester = filters.semester;
    if (filters.examType) query.examType = filters.examType;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;

    return await Exam.find(query)
      .populate("course", "title code level department")
      .populate("createdBy", "name identifier")
      .sort({ createdAt: -1 });
  }

  async getExamById(examId) {
    const exam = await Exam.findById(examId)
      .populate("course", "title code level department creditUnit")
      .populate("createdBy", "name identifier");

    if (!exam) {
      throw new NotFoundError("Exam not found");
    }

    return exam;
  }

  async updateExam(examId, updateData) {
    const exam = await Exam.findById(examId);
    if (!exam) {
      throw new NotFoundError("Exam not found");
    }

    // If questions are updated, recalculate total marks
    if (updateData.questions) {
      const totalMarks = updateData.questions.reduce(
        (sum, q) => sum + q.marks,
        0
      );
      updateData.totalMarks = totalMarks;
    }

    Object.keys(updateData).forEach((key) => {
      exam[key] = updateData[key];
    });

    await exam.save();
    return await Exam.findById(examId).populate("course", "title code level");
  }

  async deleteExam(examId) {
    const exam = await Exam.findByIdAndDelete(examId);
    if (!exam) {
      throw new NotFoundError("Exam not found");
    }
    return exam;
  }

  async addQuestion(examId, questionData) {
    const exam = await Exam.findById(examId);
    if (!exam) {
      throw new NotFoundError("Exam not found");
    }

    exam.questions.push(questionData);
    exam.totalMarks += questionData.marks;

    await exam.save();
    return exam;
  }

  async updateQuestion(examId, questionId, questionData) {
    const exam = await Exam.findById(examId);
    if (!exam) {
      throw new NotFoundError("Exam not found");
    }

    const question = exam.questions.id(questionId);
    if (!question) {
      throw new NotFoundError("Question not found");
    }

    const oldMarks = question.marks;

    Object.keys(questionData).forEach((key) => {
      question[key] = questionData[key];
    });

    // Update total marks
    exam.totalMarks = exam.totalMarks - oldMarks + question.marks;

    await exam.save();
    return exam;
  }

  async deleteQuestion(examId, questionId) {
    const exam = await Exam.findById(examId);
    if (!exam) {
      throw new NotFoundError("Exam not found");
    }

    // Find the question first to get its marks
    const question = exam.questions.id(questionId);
    if (!question) {
      throw new NotFoundError("Question not found");
    }

    // Store the marks before removing
    const questionMarks = question.marks;

    // Remove the question from the array
    exam.questions.pull(questionId);

    // Update total marks
    exam.totalMarks -= questionMarks;

    await exam.save();
    return exam;
  }

  async getExamsByCourse(courseId) {
    return await Exam.find({ course: courseId })
      .populate("createdBy", "name identifier")
      .sort({ createdAt: -1 });
  }
}

module.exports = new ExamService();
