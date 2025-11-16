const { StatusCodes } = require("http-status-codes");
const { ResultService } = require("../../services/admin");

const createResult = async (req, res) => {
  const result = await ResultService.createResult(req.body);
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Result created successfully",
    result,
  });
};

const bulkCreateResults = async (req, res) => {
  const { results } = req.body;

  if (!results || !Array.isArray(results) || results.length === 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Please provide an array of results",
    });
  }

  const data = await ResultService.bulkCreateResults(results);

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: `${data.success.length} results created successfully`,
    results: {
      successCount: data.success.length,
      failedCount: data.failed.length,
      success: data.success,
      failed: data.failed,
    },
  });
};

const getAllResults = async (req, res) => {
  const { student, course, department, session, semester } = req.query;
  const results = await ResultService.getAllResults({
    student,
    course,
    department,
    session,
    semester,
  });

  res.status(StatusCodes.OK).json({
    success: true,
    count: results.length,
    results,
  });
};

const updateResult = async (req, res) => {
  const result = await ResultService.updateResult(req.params.id, req.body);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Result updated successfully",
    result,
  });
};

const deleteResult = async (req, res) => {
  await ResultService.deleteResult(req.params.id);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Result deleted successfully",
  });
};

module.exports = {
  createResult,
  bulkCreateResults,
  getAllResults,
  updateResult,
  deleteResult,
};
