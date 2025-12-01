const { StatusCodes } = require("http-status-codes");
const { LecturerService } = require("../../services/admin");

const createLecturer = async (req, res) => {
  const lecturer = await LecturerService.createLecturer(req.body);
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Lecturer created successfully",
    lecturer: {
      id: lecturer._id,
      name: lecturer.name,
      identifier: lecturer.identifier,
      department: lecturer.department,
    },
  });
};

const getAllLecturers = async (req, res) => {
  const { department } = req.query;
  const lecturers = await LecturerService.getAllLecturers({ department });

  res.status(StatusCodes.OK).json({
    success: true,
    count: lecturers.length,
    lecturers,
  });
};

const getLecturersByDepartment = async (req, res) => {
  const data = await LecturerService.getLecturersByDepartment(
    req.params.deptId
  );
  res.status(StatusCodes.OK).json({
    success: true,
    ...data,
  });
};

const getLecturerDetails = async (req, res) => {
  const data = await LecturerService.getLecturerDetails(req.params.id);
  res.status(StatusCodes.OK).json({
    success: true,
    ...data,
  });
};

const updateLecturer = async (req, res) => {
  const lecturer = await LecturerService.updateLecturer(
    req.params.id,
    req.body
  );
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Lecturer updated successfully",
    lecturer,
  });
};

const resetLecturerPassword = async (req, res) => {
  const { newPassword } = req.body;
  const lecturer = await lecturerService.resetLecturerPassword(
    req.params.id,
    newPassword
  );

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Password reset successfully",
    lecturer: {
      id: lecturer._id,
      name: lecturer.name,
      email: lecturer.email,
    },
  });
};

const deleteLecturer = async (req, res) => {
  await LecturerService.deleteLecturer(req.params.id);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Lecturer deleted successfully",
  });
};

module.exports = {
  createLecturer,
  getAllLecturers,
  getLecturersByDepartment,
  updateLecturer,
  deleteLecturer,
  resetLecturerPassword,
  getLecturerDetails,
};
