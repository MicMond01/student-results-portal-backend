const { StatusCodes } = require("http-status-codes");
const { StudentService } = require("../../services/admin");
const createStudent = async (req, res) => {
  const student = await StudentService.createStudent(req.body);
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Student created successfully",
    student: {
      id: student._id,
      name: student.name,
      identifier: student.identifier,
      department: student.department,
    },
  });
};

const bulkCreateStudents = async (req, res) => {
  const { students } = req.body;

  if (!students || !Array.isArray(students) || students.length === 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Please provide an array of students",
    });
  }

  const results = await StudentService.bulkCreateStudents(students);

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: `${results.success.length} students created successfully`,
    results: {
      successCount: results.success.length,
      failedCount: results.failed.length,
      success: results.success.map((s) => ({
        id: s._id,
        name: s.name,
        identifier: s.identifier,
      })),
      failed: results.failed,
    },
  });
};

const getAllStudents = async (req, res) => {
  const { department, level, status, session } = req.query;
  const students = await StudentService.getAllStudents({
    department,
    level,
    status,
    session,
  });

  res.status(StatusCodes.OK).json({
    success: true,
    count: students.length,
    students,
  });
};

const getStudentsByDepartment = async (req, res) => {
  const data = await StudentService.getStudentsByDepartment(req.params.deptId);
  res.status(StatusCodes.OK).json({
    success: true,
    ...data,
  });
};

const updateStudent = async (req, res) => {
  const student = await StudentService.updateStudent(req.params.id, req.body);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Student updated successfully",
    student,
  });
};

const deleteStudent = async (req, res) => {
  await StudentService.deleteStudent(req.params.id);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Student deleted successfully",
  });
};

module.exports = {
  createStudent,
  bulkCreateStudents,
  getAllStudents,
  getStudentsByDepartment,
  updateStudent,
  deleteStudent,
};
