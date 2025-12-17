const AcademicSession = require("../models/AcademicSession");
const Course = require("../models/Course");
const Result = require("../models/Result");
const Exam = require("../models/Exam");
const { BadRequestError, NotFoundError, ForbiddenError } = require("../errors");

/**
 * Generic session check - handles multiple document types
 * Used for POST (create) operations
 */
const checkSessionActive = async (req, res, next) => {
  try {
    let session;

    // Try to get session from multiple sources (in priority order)
    if (req.body.session) {
      // Explicit session in request body
      session = req.body.session;
    } else if (req.body.course) {
      // Course reference in body
      const course = await Course.findById(req.body.course);
      if (!course) throw new NotFoundError("Course not found");
      session = course.session;
      req.course = course;
    } else if (req.params.courseId) {
      // Course ID in URL params
      const course = await Course.findById(req.params.courseId);
      if (!course) throw new NotFoundError("Course not found");
      session = course.session;
      req.course = course;
    } else if (req.params.examId) {
      // Exam ID in URL params
      const exam = await Exam.findById(req.params.examId);
      if (!exam) throw new NotFoundError("Exam not found");
      session = exam.session;
      req.exam = exam;
    } else if (req.params.id) {
      // Generic ID - try to determine what it is
      let document = await Exam.findById(req.params.id);
      if (document) {
        session = document.session;
        req.exam = document;
      } else {
        document = await Result.findById(req.params.id).populate("course");
        if (document) {
          session = document.session;
          req.result = document;
        }
      }
    }

    if (!session) {
      throw new BadRequestError("Session information not found");
    }

    // Fetch academic session (handle both ObjectId and string storage)
    let academicSession = await AcademicSession.findById(session).catch(
      () => null
    );
    if (!academicSession) {
      academicSession = await AcademicSession.findOne({ session });
    }

    if (!academicSession) {
      throw new NotFoundError(`Academic session ${session} not found`);
    }

    // ENFORCE: Non-admin users cannot access closed sessions
    if (req.user.role !== "admin" && !academicSession.isActive) {
      throw new ForbiddenError(
        `Academic session ${session} is closed. Only administrators can modify historical data.`
      );
    }

    req.academicSession = academicSession;
    req.sessionData = { session, isActive: academicSession.isActive };
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Result-specific session check
 * Used for PATCH/DELETE on results
 */
const checkResultSessionActive = async (req, res, next) => {
  try {
    const resultId = req.params.id;

    if (!resultId) {
      throw new BadRequestError("Result ID is required");
    }

    const result = await Result.findById(resultId).populate("course");
    if (!result) throw new NotFoundError("Result not found");

    // Get session from result
    const session = result.session;
    if (!session) {
      throw new BadRequestError("Result has no associated session");
    }

    // Fetch academic session
    let academicSession = await AcademicSession.findById(session).catch(
      () => null
    );
    if (!academicSession) {
      academicSession = await AcademicSession.findOne({ session });
    }

    if (!academicSession) {
      throw new NotFoundError(`Academic session ${session} not found`);
    }

    // ENFORCE: Non-admin users cannot modify closed sessions
    if (req.user.role !== "admin" && !academicSession.isActive) {
      throw new ForbiddenError(
        `Academic session ${session} is closed. Only administrators can modify results from past sessions.`
      );
    }

    req.result = result;
    req.academicSession = academicSession;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Exam-specific session check
 * Used for PATCH/DELETE on exams
 */
const checkExamSessionActive = async (req, res, next) => {
  try {
    const examId = req.params.id || req.params.examId;

    if (!examId) {
      throw new BadRequestError("Exam ID is required");
    }

    const exam = await Exam.findById(examId);
    if (!exam) throw new NotFoundError("Exam not found");

    // Get session from exam
    const session = exam.session;
    if (!session) {
      throw new BadRequestError("Exam has no associated session");
    }

    // Fetch academic session
    let academicSession = await AcademicSession.findById(session).catch(
      () => null
    );
    if (!academicSession) {
      academicSession = await AcademicSession.findOne({ session });
    }

    if (!academicSession) {
      throw new NotFoundError(`Academic session ${session} not found`);
    }

    // ENFORCE: Non-admin users cannot modify closed sessions
    if (req.user.role !== "admin" && !academicSession.isActive) {
      throw new ForbiddenError(
        `Academic session ${session} is closed. Only administrators can modify exams from past sessions.`
      );
    }

    req.exam = exam;
    req.academicSession = academicSession;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Question-specific session check
 * Used for POST/PATCH/DELETE on exam questions
 * Handles both :id and :examId parameters
 */
const checkQuestionSessionActive = async (req, res, next) => {
  try {
    const examId = req.params.id || req.params.examId;

    if (!examId) {
      throw new BadRequestError("Exam ID is required");
    }

    const exam = await Exam.findById(examId);
    if (!exam) throw new NotFoundError("Exam not found");

    // Get session from exam
    const session = exam.session;
    if (!session) {
      throw new BadRequestError("Exam has no associated session");
    }

    // Fetch academic session
    let academicSession = await AcademicSession.findById(session).catch(
      () => null
    );
    if (!academicSession) {
      academicSession = await AcademicSession.findOne({ session });
    }

    if (!academicSession) {
      throw new NotFoundError(`Academic session ${session} not found`);
    }

    // ENFORCE: Non-admin users cannot modify closed sessions
    if (req.user.role !== "admin" && !academicSession.isActive) {
      throw new ForbiddenError(
        `Academic session ${session} is closed. Cannot add/modify questions for exams from past sessions.`
      );
    }

    req.exam = exam;
    req.academicSession = academicSession;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkSessionActive,
  checkResultSessionActive,
  checkExamSessionActive,
  checkQuestionSessionActive,
};
