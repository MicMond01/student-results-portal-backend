const { StatusCodes } = require("http-status-codes");
const { StudentService } = require("../../services/admin");
const XLSX = require("xlsx");
const Department = require("../../models/Department");
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

const getStudentUploadTemplate = async (req, res) => {
  const format = req.params.format.trim().toLowerCase();

  if (!["txt", "excel"].includes(format)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Invalid format. Use 'txt' or 'excel'",
    });
  }

  const template = await StudentService.getStudentUploadTemplate(format);

  if (format === "txt") {
    const txtContent = [
      "# STUDENT UPLOAD TEMPLATE",
      "# Instructions:",
      `# - Required fields: ${template.instructions.requiredFields.join(", ")}`,
      `# - Gender options: ${template.instructions.genderOptions.join(", ")}`,
      `# - Level options: ${template.instructions.levelOptions.join(", ")}`,
      `# - Status options: ${template.instructions.statusOptions.join(", ")}`,
      "# - Department will be selected during upload on the frontend",
      "# - Each line represents one student",
      "# - Fields are separated by tabs",
      "#",
      "",
      template.headers.join("\t"),
      "",
      ...template.sampleData.map((row) =>
        template.headers.map((h) => row[h] || "").join("\t")
      ),
    ].join("\n");

    res.setHeader("Content-Type", "text/plain");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=student_upload_template.txt"
    );
    res.status(StatusCodes.OK).send(txtContent);
  } else {
    const workbook = XLSX.utils.book_new();

    // Instructions in separate rows, each in its own column
    const instructionsData = [
      ["STUDENT UPLOAD TEMPLATE - INSTRUCTIONS"],
      [""],
      ["Required Fields", ...template.instructions.requiredFields],
      ["Optional Fields", ...template.instructions.optionalFields],
      [""],
      ["Gender Options", ...template.instructions.genderOptions],
      ["Level Options", ...template.instructions.levelOptions],
      ["Status Options", ...template.instructions.statusOptions],
      [""],
      ["Note", template.instructions.note],
      [""],
      [
        "Important",
        "Department will be selected during upload on the frontend",
      ],
    ];

    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");

    // Template sheet - each column is separate
    const templateSheet = XLSX.utils.json_to_sheet(template.sampleData, {
      header: template.headers,
    });
    XLSX.utils.book_append_sheet(workbook, templateSheet, "Students");

    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=student_upload_template.xlsx"
    );
    res.status(StatusCodes.OK).send(excelBuffer);
  }
};

const bulkCreateStudents = async (req, res) => {
  let studentsData = [];
  const departmentId = req.body.department; // Get department from form data

  if (!departmentId) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Department is required",
    });
  }

  // Verify department exists
  const department = await Department.findById(departmentId);
  if (!department) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Invalid department",
    });
  }

  if (req.file) {
    const fileBuffer = req.file.buffer;
    const fileType = req.file.mimetype;

    if (fileType === "text/plain") {
      // Parse TXT (tab-separated)
      const txtText = fileBuffer.toString("utf-8");
      const lines = txtText
        .split("\n")
        .filter((line) => line.trim() && !line.startsWith("#"));

      const headers = lines[0].split("\t").map((h) => h.trim());

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split("\t").map((v) => v.trim());
        const student = {};
        headers.forEach((header, index) => {
          const value = values[index];
          if (header === "level" || header === "admissionYear") {
            student[header] = value ? parseInt(value) : null;
          } else {
            student[header] = value || null;
          }
        });
        // Add department to each student
        student.department = departmentId;
        studentsData.push(student);
      }
    } else if (
      fileType === "application/vnd.ms-excel" ||
      fileType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      // Parse Excel
      const workbook = XLSX.read(fileBuffer);
      const sheetName =
        workbook.SheetNames.find((name) => name === "Students") ||
        workbook.SheetNames[0];
      const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      // Add department to each student
      studentsData = rawData.map((student) => ({
        ...student,
        department: departmentId,
      }));
    } else {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid file type. Only TXT and Excel files allowed",
      });
    }
  } else {
    // JSON body fallback
    studentsData = req.body.students || [];
    // Add department to each student if not present
    studentsData = studentsData.map((s) => ({
      ...s,
      department: s.department || departmentId,
    }));
  }

  if (!studentsData || studentsData.length === 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "No student data provided",
    });
  }

  const results = await StudentService.bulkCreateStudents(studentsData);

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
        matricNo: s.matricNo,
        department: s.department,
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

const getStudentDetails = async (req, res) => {
  const data = await StudentService.getStudentDetails(req.params.id);
  res.status(StatusCodes.OK).json({
    success: true,
    ...data,
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
  getStudentUploadTemplate,
  updateStudent,
  getStudentDetails,
  deleteStudent,
};
