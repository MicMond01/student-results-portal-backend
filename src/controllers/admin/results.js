const { StatusCodes } = require("http-status-codes");
const { ResultService } = require("../../services/admin");
const XLSX = require("xlsx");

const createResult = async (req, res) => {
  const result = await ResultService.createResult(req.body);
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Result created successfully",
    result,
  });
};

const getResultsUploadTemplate = async (req, res) => {
  const format = req.params.format.trim().toLowerCase();

  if (!["txt", "excel"].includes(format)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Invalid format. Use 'txt' or 'excel'",
    });
  }

  const template = await ResultService.getResultsUploadTemplate(format);

  if (format === "txt") {
    const txtContent = [
      "# RESULTS BULK UPLOAD TEMPLATE",
      "# Instructions:",
      `# - Required fields: ${template.instructions.requiredFields.join(", ")}`,
      `# - CA Range: ${template.instructions.caRange}`,
      `# - Exam Range: ${template.instructions.examRange}`,
      `# - ${template.instructions.matricNote}`,
      `# - ${template.instructions.nameNote}`,
      "# - Course and department will be selected during upload",
      "# - Each line represents one student's result",
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
      "attachment; filename=results_upload_template.txt"
    );
    res.status(StatusCodes.OK).send(txtContent);
  } else {
    const workbook = XLSX.utils.book_new();

    const instructionsData = [
      ["RESULTS BULK UPLOAD TEMPLATE - INSTRUCTIONS"],
      [""],
      ["Required Fields", ...template.instructions.requiredFields],
      [""],
      ["Matric Number", template.instructions.matricNote],
      ["Name Field", template.instructions.nameNote],
      [""],
      ["Note", template.instructions.note],
      [""],
    ];

    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");

    const templateSheet = XLSX.utils.json_to_sheet(template.sampleData, {
      header: template.headers,
    });
    XLSX.utils.book_append_sheet(workbook, templateSheet, "Results");

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
      "attachment; filename=results_upload_template.xlsx"
    );
    res.status(StatusCodes.OK).send(excelBuffer);
  }
};

const bulkCreateResults = async (req, res) => {
  let resultsData = [];
  const { courseId, departmentId } = req.body;

  if (!courseId || !departmentId) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Course and department are required",
    });
  }

  if (req.file) {
    const fileBuffer = req.file.buffer;
    const fileType = req.file.mimetype;

    if (fileType === "text/plain") {
      // Parse TXT
      const txtText = fileBuffer.toString("utf-8");
      const lines = txtText
        .split("\n")
        .filter((line) => line.trim() && !line.startsWith("#"));

      const headers = lines[0].split("\t").map((h) => h.trim());

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split("\t").map((v) => v.trim());
        const result = {};
        headers.forEach((header, index) => {
          const value = values[index];
          if (header === "ca" || header === "exam") {
            result[header] = value ? parseFloat(value) : null;
          } else {
            result[header] = value || null;
          }
        });
        resultsData.push(result);
      }
    } else if (
      fileType === "application/vnd.ms-excel" ||
      fileType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      // Parse Excel
      const workbook = XLSX.read(fileBuffer);
      const sheetName =
        workbook.SheetNames.find((name) => name === "Results") ||
        workbook.SheetNames[0];
      resultsData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid file type. Only TXT and Excel files allowed",
      });
    }
  } else {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "No file provided",
    });
  }

  if (!resultsData || resultsData.length === 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "No results data provided",
    });
  }

  const results = await ResultService.bulkCreateResults(
    resultsData,
    courseId,
    departmentId
  );

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: `${results.success.length} results uploaded successfully`,
    results: {
      successCount: results.success.length,
      failedCount: results.failed.length,
      success: results.success,
      failed: results.failed,
    },
  });
};

const getStudentResults = async (req, res) => {
  const { session, semester, level } = req.query;
  const data = await ResultService.getStudentResults(req.params.studentId, {
    session,
    semester,
    level,
  });

  res.status(StatusCodes.OK).json({
    success: true,
    count: data.results.length,
    student: data.student,
    results: data.results,
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

const getResultsByCourse = async (req, res) => {
  const { session, semester } = req.query;
  const results = await ResultService.getResultsByCourse(req.params.courseId, {
    session,
    semester,
  });

  res.status(StatusCodes.OK).json({
    success: true,
    count: results.length,
    results,
  });
};

const getResultsByLecturer = async (req, res) => {
  const { session, semester } = req.query;
  const data = await ResultService.getResultsByLecturer(req.params.lecturerId, {
    session,
    semester,
  });

  res.status(StatusCodes.OK).json({
    success: true,
    ...data,
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
  getStudentResults,
  getResultsUploadTemplate,
  getResultsByCourse,
  getResultsByLecturer,
  getAllResults,
  updateResult,
  deleteResult,
};
