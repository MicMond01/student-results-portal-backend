const { StatusCodes } = require("http-status-codes");
const examService = require("../../services/examService");

const getAllExams = async (req, res) => {
  const { course, department, session, semester, lecturer } = req.query;
  const exams = await examService.getAllExams({
    course,
    department,
    session,
    semester,
    lecturer,
  });

  res.status(StatusCodes.OK).json({
    success: true,
    count: exams.length,
    exams,
  });
};

const updateExam = async (req, res) => {
  const exam = await examService.updateExam(req.params.id, req.body);

  res.status(StatusCodes.OK).json({
    success: true,
    exam,
  });
};

const deleteExam = async (req, res) => {
  await examService.deleteExam(req.params.id);

  res.status(StatusCodes.NO_CONTENT).json({
    success: true,
  });
};

module.exports = {
  getAllExams,
  updateExam,
  deleteExam,
};
