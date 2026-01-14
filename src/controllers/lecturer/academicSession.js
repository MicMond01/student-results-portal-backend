const { StatusCodes } = require("http-status-codes");
const { SessionService } = require("../../services/admin");

const getAllAcademicSessions = async (req, res) => {
  const sessions = await SessionService.getAllAcademicSessions();
  res.status(StatusCodes.OK).json({
    success: true,
    count: sessions.length,
    sessions,
  });
};

const getCurrentAcademicSession = async (req, res) => {
  const session = await SessionService.getCurrentAcademicSession();
  res.status(StatusCodes.OK).json({
    success: true,
    session,
  });
};

const getAcademicSession = async (req, res) => {
  const session = await SessionService.getAcademicSession(req.params.id);
  res.status(StatusCodes.OK).json({
    success: true,
    session,
  });
};

module.exports = {
  getAllAcademicSessions,
  getCurrentAcademicSession,
  getAcademicSession,
};
