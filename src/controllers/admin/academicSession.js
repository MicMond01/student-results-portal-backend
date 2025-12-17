const { StatusCodes } = require("http-status-codes");
const { SessionService } = require("../../services/admin");

const createAcademicSession = async (req, res) => {
  const session = await SessionService.createAcademicSession(req.body);
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Academic session created successfully",
    session,
  });
};

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

const updateAcademicSession = async (req, res) => {
  const session = await SessionService.updateAcademicSession(
    req.params.id,
    req.body
  );
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Academic session updated successfully",
    session,
  });
};

const closeAcademicSession = async (req, res) => {
  const session = await SessionService.closeSession(req.params.id);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Academic session closed successfully",
    session,
  });
};

const reopenAcademicSession = async (req, res) => {
  const session = await SessionService.reopenSession(req.params.id);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Academic session reopened successfully",
    session,
  });
};

const deleteAcademicSession = async (req, res) => {
  await SessionService.deleteAcademicSession(req.params.id);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Academic session deleted successfully",
  });
};

module.exports = {
  createAcademicSession,
  getAllAcademicSessions,
  getCurrentAcademicSession,
  closeAcademicSession,
  reopenAcademicSession,
  updateAcademicSession,
  deleteAcademicSession,
};
