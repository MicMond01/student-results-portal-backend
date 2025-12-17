const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../../errors");
const ResultService = require("../../services/resultService");
const LecturerService = require("../../services/lecturerService");
const {
  groupResultsByCourse,
  groupResultsByStudent,
} = require("../../utils/resultFormatters");
const {
  calculateSessionGPA,
  calculateOverallStats,
  calculatePassRate,
  getAtRiskStudents,
} = require("../../utils/gradeCalculations");
const Course = require("../../models/Course");
const User = require("../../models/User");

const XLSX = require("xlsx");
const CourseService = require("../../services/courseService");

const getAllResultsUplodedByLecturer = async (req, res) => {
  const lecturerId = req.user.userId;
  const results = await ResultService.getResultsUploadedBy(lecturerId);
  const groupedByCourse = groupResultsByCourse(results);

  res.status(StatusCodes.OK).json({
    totalResults: results.length,
    totalCourses: Object.keys(groupedByCourse).length,
    data: groupedByCourse,
  });
};

const getAllResultsForMyCourses = async (req, res) => {
  const lecturerId = req.user.userId;
  const { results, courses } = await ResultService.getResultsForLecturerCourses(
    lecturerId
  );

  if (courses.length === 0) {
    return res.status(StatusCodes.OK).json({
      results: [],
      message: "No courses assigned",
    });
  }

  const groupedResults = groupResultsByStudent(results);

  res.status(StatusCodes.OK).json({
    totalResults: results.length,
    totalStudents: groupedResults.length,
    data: groupedResults,
  });
};

const getMyCoursesAnalytics = async (req, res) => {
  const lecturerId = req.user.userId;
  const { session } = req.query; // Optional filter by session

  const { results, courses } = await ResultService.getResultsForLecturerCourses(
    lecturerId
  );

  if (courses.length === 0) {
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "No courses assigned",
      analytics: null,
    });
  }

  // Filter by session if provided
  let filteredResults = results;
  if (session) {
    filteredResults = results.filter((r) => r.session === session);
  }

  const groupedResults = groupResultsByStudent(filteredResults);
  const sessionStats = calculateSessionGPA(groupedResults);
  const overallStats = calculateOverallStats(sessionStats);

  // Calculate course-specific stats
  const courseStats = {};
  courses.forEach((course) => {
    const courseResults = filteredResults.filter(
      (r) => r.course._id.toString() === course._id.toString()
    );

    if (courseResults.length > 0) {
      const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
      courseResults.forEach((r) => {
        gradeDistribution[r.grade]++;
      });

      const passCount = courseResults.filter((r) =>
        ["A", "B", "C", "D", "E"].includes(r.grade)
      ).length;

      courseStats[course.code] = {
        courseId: course._id,
        title: course.title,
        code: course.code,
        totalStudents: courseResults.length,
        passRate: ((passCount / courseResults.length) * 100).toFixed(2) + "%",
        gradeDistribution,
        averageScore: (
          courseResults.reduce((sum, r) => sum + r.total, 0) /
          courseResults.length
        ).toFixed(2),
      };
    }
  });

  res.status(StatusCodes.OK).json({
    success: true,
    analytics: {
      overall: {
        ...overallStats,
        totalCourses: courses.length,
        passRate: calculatePassRate(filteredResults) + "%",
      },
      byCourse: Object.values(courseStats),
      bySession: Object.values(sessionStats).map((s) => ({
        session: s.session,
        averageGPA: s.averageGPA,
        students: s.students,
        gradeDistribution: s.gradeDistribution,
      })),
    },
  });
};

const uploadResultForStudent = async (req, res) => {
  const { student, course, ca, exam, semester, session } = req.body;
  const lecturerId = req.user.userId;

  if (
    !student ||
    !course ||
    ca === undefined ||
    exam === undefined ||
    !semester ||
    !session
  ) {
    throw new BadRequestError("Please provide all required fields");
  }

  const studentDoc = await User.findOne({
    matricNo: student,
    role: "student",
  });
  if (!studentDoc) {
    throw new NotFoundError("Student not found");
  }

  const studentId = studentDoc._id;

  // Check for duplicate
  const existingResult = await ResultService.checkDuplicateResult(
    studentId,
    course,
    session
  );
  if (existingResult) {
    throw new BadRequestError(
      "Result already exists for this student in this course and session"
    );
  }

  // Validate student

  const result = await ResultService.createResult({
    student: studentId,
    course,
    ca,
    exam,
    semester,
    session,
    uploadedBy: lecturerId,
  });

  res.status(StatusCodes.CREATED).json({
    msg: "Result uploaded successfully",
    result,
  });
};

const editStudentResult = async (req, res) => {
  const { ca, exam, semester, session } = req.body;
  const result = req.result; // From middleware

  const updatedResult = await ResultService.updateResult(result, {
    ca,
    exam,
    semester,
    session,
  });

  res.status(StatusCodes.OK).json({
    msg: "Result updated successfully",
    result: updatedResult,
  });
};

const getResultWithStudentInfo = async (req, res) => {
  const { id: resultId } = req.params;

  const data = await ResultService.getResultWithStudent(resultId);

  res.status(StatusCodes.OK).json({
    ...data,
  });
};

const deleteResult = async (req, res) => {
  const { id: resultId } = req.params;
  // Authorization already checked in middleware

  await ResultService.deleteResult(resultId);

  res.status(StatusCodes.OK).json({
    msg: "Result deleted successfully",
    deletedResultId: resultId,
  });
};

const viewCoursesAssignedToLecturer = async (req, res) => {
  const lecturerId = req.user.userId;
  const courses = await Course.find({ lecturer: lecturerId })
    .select("-students -__v")
    .sort({ level: 1, semester: 1 });

  if (!courses || courses.length === 0) {
    throw new NotFoundError("No courses assigned to you yet");
  }

  res.status(StatusCodes.OK).json({
    success: true,
    totalCourses: courses.length,
    lecturerId,
    courses,
  });
};
const viewOwnProfile = async (req, res) => {
  const lecturerId = req.user.userId;
  const { lecturer, courses } = await LecturerService.getLecturerWithCourses(
    lecturerId
  );

  if (!lecturer || lecturer.role !== "lecturer") {
    throw new NotFoundError("Lecturer not found");
  }

  const stats = await LecturerService.getLecturerStats(lecturerId, courses);
  const latestCourse =
    courses.length > 0
      ? courses.sort((a, b) => b.createdAt - a.createdAt)[0]
      : null;

  res.status(StatusCodes.OK).json({
    success: true,
    lecturer: {
      // Basic Info
      id: lecturer._id,
      name: lecturer.name,
      email: lecturer.identifier,
      role: lecturer.role,

      // Personal Information
      profilePhoto: lecturer.profilePhoto || null,
      gender: lecturer.gender || null,
      dateOfBirth: lecturer.dateOfBirth || null,
      phone: lecturer.phone || null,
      address: lecturer.address || null,

      // Academic/Professional Information
      staffId: lecturer.staffId || null,
      department: lecturer.department || "Computer Science",
      faculty: lecturer.faculty || "Faculty of Science",
      school: lecturer.school || "Lagos State University",
      rank: lecturer.rank || "Lecturer",
      specialization: lecturer.specialization || null,
      yearsOfExperience: lecturer.yearsOfExperience || null,
      officeLocation: lecturer.officeLocation || null,
      highestDegree: lecturer.highestDegree || null,
      institution: lecturer.institution || null,
    },
    stats,
    latestCourse: latestCourse
      ? {
          id: latestCourse._id,
          title: latestCourse.title,
          code: latestCourse.code,
          semester: latestCourse.semester,
          session: latestCourse.session,
          level: latestCourse.level,
          studentCount: latestCourse.students?.length || 0,
        }
      : null,
    courses: courses.map((c) => ({
      id: c._id,
      title: c.title,
      code: c.code,
      semester: c.semester,
      session: c.session,
      level: c.level,
      studentCount: c.students?.length || 0,
    })),
  });
};

const updateProfileInfo = async (req, res) => {
  const lecturerId = req.user.userId;
  const {
    name,
    phone,
    address,
    gender,
    department,
    specialization,
    officeLocation,
  } = req.body;

  if (
    !name &&
    !phone &&
    !address &&
    !gender &&
    !department &&
    !specialization &&
    !officeLocation
  ) {
    throw new BadRequestError("Please provide at least one field to update");
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (gender) updateData.gender = gender;
  if (phone) updateData.phone = phone;
  if (address) updateData.address = address;
  if (department) updateData.department = department;
  if (specialization) updateData.specialization = specialization;
  if (officeLocation) updateData.officeLocation = officeLocation;

  const lecturer = await LecturerService.updateLecturer(lecturerId, updateData);

  if (!lecturer || lecturer.role !== "lecturer") {
    throw new NotFoundError("Lecturer not found");
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Profile updated successfully",
    lecturer: {
      id: lecturer._id,
      name: lecturer.name,
      email: lecturer.identifier,
      department: lecturer.department,
      phone: lecturer.phone,
      address: lecturer.address,
      gender: lecturer.gender,
      specialization: lecturer.specialization,
      officeLocation: lecturer.officeLocation,
      role: lecturer.role,
    },
  });
};

const updateProfilePhoto = async (req, res) => {
  try {
    const lecturerId = req.user.userId;
    const { profilePhoto } = req.body;

    if (!profilePhoto) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Please provide a profile photo URL",
      });
    }

    // Enhanced URL validation
    const urlPattern = /^https?:\/\/.+\..+$/;
    if (!urlPattern.test(profilePhoto)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Please provide a valid URL",
      });
    }

    // Validate URL points to an image
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const isImageUrl = imageExtensions.some((ext) =>
      profilePhoto.toLowerCase().includes(ext)
    );

    if (!isImageUrl) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "URL must point to a valid image file",
      });
    }

    const lecturer = await LecturerService.updateLecturer(lecturerId, {
      profilePhoto,
    });

    if (!lecturer) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Lecturer not found",
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Profile photo updated successfully",
      profilePhoto: lecturer.profilePhoto,
    });
  } catch (error) {
    console.error("Update profile photo error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const changePassword = async (req, res) => {
  const lecturerId = req.user.userId;
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!oldPassword || !newPassword || !confirmPassword) {
    throw new BadRequestError(
      "Please provide old password, new password, and confirm password"
    );
  }

  if (newPassword.length < 6) {
    throw new BadRequestError(
      "New password must be at least 6 characters long"
    );
  }

  if (newPassword !== confirmPassword) {
    throw new BadRequestError("New passwords do not match");
  }

  if (oldPassword === newPassword) {
    throw new BadRequestError(
      "New password cannot be the same as old password"
    );
  }

  const lecturer = await User.findById(lecturerId);

  if (!lecturer || lecturer.role !== "lecturer") {
    throw new NotFoundError("Lecturer not found");
  }

  const isPasswordCorrect = await lecturer.comparePassword(oldPassword);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError("Old password is incorrect");
  }

  lecturer.password = newPassword;
  await lecturer.save();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Password changed successfully",
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
      "# - Course will be selected during upload",
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
      ["Optional Fields", ...template.instructions.optionalFields],
      [""],
      ["CA Score Range", template.instructions.caRange],
      ["Exam Score Range", template.instructions.examRange],
      [""],
      ["Matric Number", template.instructions.matricNote],
      ["Name Field", template.instructions.nameNote],
      [""],
      ["Note", template.instructions.note],
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

const bulkUploadResults = async (req, res) => {
  let resultsData = [];
  const { courseId } = req.body;
  const lecturerId = req.user.userId;

  if (!courseId) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Course is required",
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

  console.log(resultsData);

  const results = await ResultService.bulkUploadResults(
    resultsData,
    courseId,
    lecturerId
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

const getCourseDetails = async (req, res) => {
  const lecturerId = req.user.userId;

  const data = await CourseService.getCourseDetails(
    req.params.courseId,
    lecturerId
  );

  res.status(StatusCodes.OK).json({
    success: true,
    ...data,
  });
};

module.exports = {
  getAllResultsUplodedByLecturer,
  getAllResultsForMyCourses,
  getMyCoursesAnalytics,
  uploadResultForStudent,
  getResultWithStudentInfo,
  editStudentResult,
  updateProfilePhoto,
  changePassword,
  deleteResult,
  viewCoursesAssignedToLecturer,
  viewOwnProfile,
  updateProfileInfo,
  getResultsUploadTemplate,
  bulkUploadResults,
  getCourseDetails,
};
