const { StatusCodes } = require("http-status-codes");
const ExamService = require("../services/examService");
const Course = require("../models/Course");
const { BadRequestError, UnauthorizedError, NotFoundError } = require("../errors");

// Helper: Verify lecturer owns the course
const verifyLecturerCourse = async (lecturerId, courseId) => {
  const course = await Course.findById(courseId);
  if (!course) {
    throw new NotFoundError("Course not found");
  }
  if (course.lecturer.toString() !== lecturerId) {
    throw new UnauthorizedError("You can only manage exams for your own courses");
  }
  return course;
};

// Helper: Verify lecturer owns the exam
const verifyLecturerExam = async (lecturerId, examId) => {
  const exam = await ExamService.getExamById(examId);
  
  const course = await Course.findById(exam.course);
  if (course.lecturer.toString() !== lecturerId) {
    throw new UnauthorizedError("You can only manage exams for your own courses");
  }
  return exam;
};

// Create new exam (lecturer can only create for their courses)
const createExam = async (req, res) => {
  const lecturerId = req.user.userId;
  const {
    course,
    title,
    examType,
    duration,
    totalMarks,
    passingMarks,
    instructions,
    questions,
    session,
    semester,
    startDate,
    endDate,
  } = req.body;

  if (!course || !title || !examType || !duration || !totalMarks || !passingMarks || !session || !semester) {
    throw new BadRequestError("Please provide all required fields");
  }

  if (!questions || questions.length === 0) {
    throw new BadRequestError("Please provide at least one question");
  }

  // ✅ Verify lecturer owns this course
  await verifyLecturerCourse(lecturerId, course);

  const exam = await ExamService.createExam({
    course,
    title,
    examType,
    duration,
    totalMarks,
    passingMarks,
    instructions,
    questions,
    session,
    semester,
    startDate,
    endDate,
    createdBy: lecturerId,
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Exam created successfully",
    exam,
  });
};

// Get all exams for lecturer's courses only
const getMyExams = async (req, res) => {
  const lecturerId = req.user.userId;
  const { session, semester, examType, isActive } = req.query;

  // ✅ Get only courses taught by this lecturer
  const myCourses = await Course.find({ lecturer: lecturerId }).select("_id");
  const myCourseIds = myCourses.map(c => c._id);

  if (myCourseIds.length === 0) {
    return res.status(StatusCodes.OK).json({
      success: true,
      count: 0,
      exams: [],
      message: "No courses assigned to you yet",
    });
  }

  // Get exams for lecturer's courses
  const exams = await ExamService.getAllExams({
    session,
    semester,
    examType,
    isActive: isActive === "true" ? true : isActive === "false" ? false : undefined,
  });

  // ✅ Filter to only lecturer's courses
  const myExams = exams.filter(exam => 
    myCourseIds.some(id => id.toString() === exam.course._id.toString())
  );

  res.status(StatusCodes.OK).json({
    success: true,
    count: myExams.length,
    exams: myExams,
  });
};

// Get single exam (only if lecturer owns the course)
const getExam = async (req, res) => {
  const lecturerId = req.user.userId;
  const { id: examId } = req.params;

  // ✅ Verify ownership
  const exam = await verifyLecturerExam(lecturerId, examId);

  res.status(StatusCodes.OK).json({
    success: true,
    exam,
  });
};

// Update exam (only own courses)
const updateExam = async (req, res) => {
  const lecturerId = req.user.userId;
  const { id: examId } = req.params;

  // ✅ Verify ownership
  await verifyLecturerExam(lecturerId, examId);

  const exam = await ExamService.updateExam(examId, req.body);
 
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Exam updated successfully",
    exam,
  });
};

// Delete exam (only own courses)
const deleteExam = async (req, res) => {
  const lecturerId = req.user.userId;
  const { id: examId } = req.params;

  // ✅ Verify ownership
  await verifyLecturerExam(lecturerId, examId);

  await ExamService.deleteExam(examId);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Exam deleted successfully",
  });
};

// Add question to exam (only own courses)
const addQuestion = async (req, res) => {
  const lecturerId = req.user.userId;
  const { id: examId } = req.params;
  const questionData = req.body;

  if (!questionData.question || !questionData.questionType || !questionData.marks) {
    throw new BadRequestError("Please provide question, type, and marks");
  }

  if (questionData.questionType === "objective") {
    if (!questionData.options || questionData.options.length < 2) {
      throw new BadRequestError("Objective questions must have at least 2 options");
    }
    if (!questionData.correctAnswer) {
      throw new BadRequestError("Please provide correct answer for objective question");
    }
  }

  // ✅ Verify ownership
  await verifyLecturerExam(lecturerId, examId);

  const exam = await ExamService.addQuestion(examId, questionData);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Question added successfully",
    exam,
  });
};

// Update question (only own courses)
const updateQuestion = async (req, res) => {
  const lecturerId = req.user.userId;
  const { examId, questionId } = req.params;

  // ✅ Verify ownership
  await verifyLecturerExam(lecturerId, examId);

  const exam = await ExamService.updateQuestion(examId, questionId, req.body);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Question updated successfully",
    exam,
  });
};

// Delete question (only own courses)
const deleteQuestion = async (req, res) => {
  const lecturerId = req.user.userId;
  const { examId, questionId } = req.params;

  // ✅ Verify ownership
  await verifyLecturerExam(lecturerId, examId);

  const exam = await ExamService.deleteQuestion(examId, questionId);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Question deleted successfully",
    exam,
  });
};

// Get exams for a specific course (only lecturer's own courses)
const getExamsByCourse = async (req, res) => {
  const lecturerId = req.user.userId;
  const { courseId } = req.params;

  // ✅ Verify lecturer owns this course
  await verifyLecturerCourse(lecturerId, courseId);

  const exams = await ExamService.getExamsByCourse(courseId);

  res.status(StatusCodes.OK).json({
    success: true,
    count: exams.length,
    exams,
  });
};

// Get all lecturer's courses (for dropdown/selection)
const getMyCourses = async (req, res) => {
  const lecturerId = req.user.userId; 

  const courses = await Course.find({ lecturer: lecturerId })
    .select("title code level semester session department")
    .sort({ level: 1, code: 1 });

  res.status(StatusCodes.OK).json({
    success: true,
    count: courses.length,
    courses,
  });
};

module.exports = {
  createExam,
  getMyExams,
  getExam,
  updateExam,
  deleteExam,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getExamsByCourse,
  getMyCourses,
};