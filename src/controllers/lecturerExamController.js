const { StatusCodes } = require("http-status-codes");
const ExamService = require("../services/examService");
const Course = require("../models/Course");
const {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} = require("../errors");

const multer = require("multer");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

// Helper: Verify lecturer owns the course
const verifyLecturerCourse = async (lecturerId, courseId) => {
  const course = await Course.findById(courseId);
  if (!course) {
    throw new NotFoundError("Course not found");
  }
  if (course.lecturer.toString() !== lecturerId) {
    throw new UnauthorizedError(
      "You can only manage exams for your own courses"
    );
  }
  return course;
};

// Helper: Verify lecturer owns the exam
const verifyLecturerExam = async (lecturerId, examId) => {
  const exam = await ExamService.getExamById(examId);

  const course = await Course.findById(exam.course);
  if (course.lecturer.toString() !== lecturerId) {
    throw new UnauthorizedError(
      "You can only manage exams for your own courses"
    );
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

  if (
    !course ||
    !title ||
    !examType ||
    !duration ||
    !totalMarks ||
    !passingMarks ||
    !session ||
    !semester
  ) {
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
  const myCourseIds = myCourses.map((c) => c._id);

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
    isActive:
      isActive === "true" ? true : isActive === "false" ? false : undefined,
  });

  // ✅ Filter to only lecturer's courses
  const myExams = exams.filter((exam) => {
    if (!exam.course) return false;

    let examCourseId;

    if (typeof exam.course === "object" && exam.course !== null) {
      examCourseId = exam.course._id?.toString();
    } else {
      examCourseId = exam.course.toString();
    }

    return myCourseIds.some((id) => id.toString() === examCourseId);
  });

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

  if (
    !questionData.question ||
    !questionData.questionType ||
    !questionData.marks
  ) {
    throw new BadRequestError("Please provide question, type, and marks");
  }

  if (questionData.questionType === "objective") {
    if (!questionData.options || questionData.options.length < 2) {
      throw new BadRequestError(
        "Objective questions must have at least 2 options"
      );
    }
    if (!questionData.correctAnswer) {
      throw new BadRequestError(
        "Please provide correct answer for objective question"
      );
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

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/questions");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "text/plain",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only TXT and Excel files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Parse TXT file
const parseTxtFile = (filePath) => {
  const content = fs.readFileSync(filePath, "utf-8");
  const questions = [];

  // Expected format:
  // TYPE: objective or theory
  // QUESTION: Your question here
  // MARKS: 2
  // OPTIONS: A) option1 | B) option2 | C) option3 | D) option4 (for objective)
  // ANSWER: B (for objective)
  // MODEL_ANSWER: Model answer here (for theory)
  // ---

  const questionBlocks = content.split("---").filter((block) => block.trim());

  questionBlocks.forEach((block) => {
    const lines = block.split("\n").filter((line) => line.trim());
    const questionData = {};

    lines.forEach((line) => {
      if (line.startsWith("TYPE:")) {
        questionData.questionType = line.replace("TYPE:", "").trim();
      } else if (line.startsWith("QUESTION:")) {
        questionData.question = line.replace("QUESTION:", "").trim();
      } else if (line.startsWith("MARKS:")) {
        questionData.marks = parseInt(line.replace("MARKS:", "").trim());
      } else if (line.startsWith("OPTIONS:")) {
        const optionsStr = line.replace("OPTIONS:", "").trim();
        questionData.options = optionsStr
          .split("|")
          .map((opt) => opt.trim().replace(/^[A-D]\)\s*/, ""));
      } else if (line.startsWith("ANSWER:")) {
        questionData.correctAnswer = line.replace("ANSWER:", "").trim();
      } else if (line.startsWith("MODEL_ANSWER:")) {
        questionData.modelAnswer = line.replace("MODEL_ANSWER:", "").trim();
      }
    });

    if (
      questionData.question &&
      questionData.questionType &&
      questionData.marks
    ) {
      questions.push(questionData);
    }
  });

  return questions;
};

// Parse Excel file
const parseExcelFile = (filePath) => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);

  // Expected columns:
  // Type | Question | Marks | OptionA | OptionB | OptionC | OptionD | Answer | ModelAnswer

  const questions = data.map((row) => {
    const questionData = {
      questionType: row.Type?.toLowerCase(),
      question: row.Question,
      marks: parseInt(row.Marks),
    };

    if (questionData.questionType === "objective") {
      questionData.options = [
        row.OptionA,
        row.OptionB,
        row.OptionC,
        row.OptionD,
      ].filter(Boolean);
      questionData.correctAnswer = row.Answer;
    } else if (questionData.questionType === "theory") {
      questionData.modelAnswer = row.ModelAnswer || "";
    }

    return questionData;
  });

  return questions.filter((q) => q.question && q.questionType && q.marks);
};

// Bulk upload questions controller
const bulkUploadQuestions = async (req, res) => {
  const lecturerId = req.user.userId;
  const { examId } = req.params;

  if (!req.file) {
    throw new BadRequestError("Please upload a file");
  }

  try {
    // Verify ownership
    await verifyLecturerExam(lecturerId, examId);

    const filePath = req.file.path;
    let questions = [];

    // Parse based on file type
    if (req.file.mimetype === "text/plain") {
      questions = parseTxtFile(filePath);
    } else {
      questions = parseExcelFile(filePath);
    }

    if (questions.length === 0) {
      throw new BadRequestError("No valid questions found in file");
    }

    // Validate questions
    const invalidQuestions = questions.filter((q) => {
      if (q.questionType === "objective") {
        return !q.options || q.options.length < 2 || !q.correctAnswer;
      }
      return false;
    });

    if (invalidQuestions.length > 0) {
      throw new BadRequestError(
        `${invalidQuestions.length} questions have invalid format`
      );
    }

    // Add all questions to exam
    const exam = await ExamService.getExamById(examId);
    questions.forEach((q) => {
      exam.questions.push(q);
      exam.totalMarks += q.marks;
    });

    await exam.save();

    // Delete uploaded file
    fs.unlinkSync(filePath);

    res.status(StatusCodes.OK).json({
      success: true,
      message: `Successfully uploaded ${questions.length} questions`,
      questionsAdded: questions.length,
      exam,
    });
  } catch (error) {
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
};

// Download template files
const downloadTemplate = async (req, res) => {
  const { format } = req.params; // 'txt' or 'excel'

  if (format === "txt") {
    const template = `TYPE: objective
QUESTION: What is the capital of France?
MARKS: 2
OPTIONS: A) London | B) Paris | C) Berlin | D) Madrid
ANSWER: Paris
---
TYPE: theory
QUESTION: Explain the concept of object-oriented programming.
MARKS: 10
MODEL_ANSWER: OOP is a programming paradigm that uses objects and classes...
---`;

    res.setHeader("Content-Type", "text/plain");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=question-template.txt"
    );
    res.send(template);
  } else if (format === "excel") {
    const wb = XLSX.utils.book_new();
    const wsData = [
      [
        "Type",
        "Question",
        "Marks",
        "OptionA",
        "OptionB",
        "OptionC",
        "OptionD",
        "Answer",
        "ModelAnswer",
      ],
      ["objective", "What is 2+2?", 2, "3", "4", "5", "6", "4", ""],
      [
        "theory",
        "Explain inheritance",
        15,
        "",
        "",
        "",
        "",
        "",
        "Inheritance allows...",
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Questions");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=question-template.xlsx"
    );
    res.send(buffer);
  } else {
    throw new BadRequestError("Invalid format. Use 'txt' or 'excel'");
  }
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

  upload,
  bulkUploadQuestions,
  downloadTemplate,
};
