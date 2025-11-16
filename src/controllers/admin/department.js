const { StatusCodes } = require("http-status-codes");
const { DepartmentService } = require("../../services/admin");

const createDepartment = async (req, res) => {
  const department = await DepartmentService.createDepartment(req.body);
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Department created successfully",
    department,
  });
};

const getAllDepartments = async (req, res) => {
  const { includeInactive } = req.query;
  const departments = await DepartmentService.getAllDepartments(
    includeInactive === "true"
  );
  res.status(StatusCodes.OK).json({
    success: true,
    count: departments.length,
    departments,
  });
};

const getDepartment = async (req, res) => {
  const data = await DepartmentService.getDepartmentById(req.params.id);
  res.status(StatusCodes.OK).json({
    success: true,
    ...data,
  });
};

const updateDepartment = async (req, res) => {
  const department = await DepartmentService.updateDepartment(
    req.params.id,
    req.body
  );
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Department updated successfully",
    department,
  });
};

const deleteDepartment = async (req, res) => {
  await DepartmentService.deleteDepartment(req.params.id);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Department deleted successfully",
  });
};

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartment,
  updateDepartment,
  deleteDepartment,
};
