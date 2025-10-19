const { StatusCodes } = require("http-status-codes");
const Course = require("../models/Course");
const Result = require("../models/Result");
const { BadRequestError, NotFoundError } = require("../errors");
const User = require("../models/User");

const getAllResultsUplodedByLecturer = async (req, res) => {
  try {
    const lecturerId = req.user.userId;

    const results = await Result.find({ uploadedBy: lecturerId })
      .populate("student", "name identifier")
      .populate("course", "code title semester session level creditUnit")
      .sort({ "course.code": 1, "student.name": 1 });

    // Group by course
    const groupedByCourse = {};
    results.forEach((result) => {
      const courseCode = result.course.code;
      if (!groupedByCourse[courseCode]) {
        groupedByCourse[courseCode] = {
          course: {
            code: result.course.code,
            title: result.course.title,
            semester: result.course.semester,
            session: result.course.session,
            level: result.course.level,
            creditUnit: result.course.creditUnit,
          },
          results: [],
        };
      }
      groupedByCourse[courseCode].results.push({
        _id: result._id,
        student: result.student,
        ca: result.ca,
        exam: result.exam,
        total: result.total,
        grade: result.grade,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      });
    });

    res.status(StatusCodes.OK).json({
      totalResults: results.length,
      totalCourses: Object.keys(groupedByCourse).length,
      data: groupedByCourse,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Error fetching results",
    });
  }
};

const getAllResultsForMyCourses = async (req, res) => {
  try {
    const lecturerId = req.user.userId;

    const courses = await Course.find({ lecturer: lecturerId });

    if (courses.length === 0) {
      return res.status(StatusCodes.OK).json({
        results: [],
        message: "No courses assigned",
      });
    }

    const courseIds = courses.map((course) => course._id);

    const results = await Result.find({ course: { $in: courseIds } })
      .populate("student", "name identifier")
      .populate("course", "code title semester session level creditUnit")
      .sort({ "student.identifier": 1, createdAt: -1 });

    // Group results by student
    const studentResultsMap = {};

    results.forEach((result) => {
      const studentId = result.student._id.toString();

      if (!studentResultsMap[studentId]) {
        studentResultsMap[studentId] = {
          student: {
            _id: result.student._id,
            name: result.student.name,
            identifier: result.student.identifier,
          },
          results: [],
        };
      }

      studentResultsMap[studentId].results.push({
        _id: result._id,
        course: result.course,
        semester: result.semester,
        session: result.session,
        ca: result.ca,
        exam: result.exam,
        total: result.total,
        grade: result.grade,
        uploadedBy: result.uploadedBy,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      });
    });

    const groupedResults = Object.values(studentResultsMap);

    res.status(StatusCodes.OK).json({
      totalResults: results.length,
      totalStudents: groupedResults.length,
      data: groupedResults,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: "Error fetching results",
    });
  }
};

const uploadResultForStudent = async (req, res) => {
  try {
    const { student, course, ca, exam, semester, session } = req.body;
    const lecturerId = req.user.userId;

    // Validate required fields
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

    const courseDoc = await Course.findOne({
      _id: course,
      lecturer: lecturerId,
    });

    if (!courseDoc) {
      throw new UnauthorizedError(
        "You are not authorized to upload results for this course"
      );
    }

    const studentDoc = await User.findOne({ _id: student, role: "student" });

    if (!studentDoc) {
      throw new NotFoundError("Student not found");
    }

    const existingResult = await Result.findOne({
      student,
      course,
      session,
    });

    if (existingResult) {
      throw new BadRequestError(
        "Result already exists for this student in this course and session"
      );
    }

    const result = await Result.create({
      student,
      course,
      ca,
      exam,
      semester,
      session,
      uploadedBy: lecturerId,
    });

    const populatedResult = await Result.findById(result._id)
      .populate("student", "name identifier")
      .populate("course", "code title semester session level creditUnit");

    res.status(StatusCodes.CREATED).json({
      msg: "Result uploaded successfully",
      result: populatedResult,
    });
  } catch (error) {
    console.error(error);

    if (error.name === "ValidationError") {
      throw new BadRequestError(error.message);
    }

    throw error;
  }
};
const editStudentResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { ca, exam, semester, session } = req.body;
    const lecturerId = req.user.userId;

    // Find the result
    const result = await Result.findById(id).populate("course");

    if (!result) {
      throw new NotFoundError(`No result found with id ${id}`);
    }

    // Verify lecturer is authorized (either teaches the course or uploaded the result)
    if (
      result.course.lecturer.toString() !== lecturerId &&
      result.uploadedBy?.toString() !== lecturerId
    ) {
      throw new UnauthorizedError("You are not authorized to edit this result");
    }

    // Update fields if provided
    if (ca !== undefined) result.ca = ca;
    if (exam !== undefined) result.exam = exam;
    if (semester) result.semester = semester;
    if (session) result.session = session;

    // Save (this will trigger the pre-save hook to recalculate total and grade)
    await result.save();

    // Populate and return updated result
    const updatedResult = await Result.findById(result._id)
      .populate("student", "name identifier")
      .populate("course", "code title semester session level creditUnit");

    res.status(StatusCodes.OK).json({
      msg: "Result updated successfully",
      result: updatedResult,
    });
  } catch (error) {
    console.error(error);

    if (error.name === "CastError") {
      throw new BadRequestError("Invalid result ID");
    }

    throw error;
  }
};

const deleteResult = async (req, res) => {
  try {
    const { id: resultId } = req.params;
    const lecturerId = req.user.userId;

    // Check if result exists
    const result = await Result.findById(resultId).populate("course");

    if (!result) {
      throw new NotFoundError(`No result found with id ${resultId}`);
    }

    // Check authorization — only the lecturer who teaches the course or uploaded the result can delete it
    if (
      result.course.lecturer.toString() !== lecturerId &&
      result.uploadedBy?.toString() !== lecturerId
    ) {
      throw new UnauthorizedError(
        "You are not authorized to delete this result"
      );
    }

    await Result.findByIdAndDelete(resultId);

    res.status(StatusCodes.OK).json({
      msg: "Result deleted successfully",
      deletedResultId: resultId,
    });
  } catch (error) {
    console.error(error);

    if (error.name === "CastError") {
      throw new BadRequestError("Invalid result ID");
    }

    throw error;
  }
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

  const lecturer = await User.findById(lecturerId).select("-password");

  if (!lecturer || lecturer.role !== "lecturer") {
    throw new NotFoundError("Lecturer not found");
  }

  const courses = await Course.find({ lecturer: lecturerId })
    .select("title code level semester session creditUnit students")
    .sort({ session: -1, semester: 1 });

  const totalCourses = courses.length;
  const totalStudents = courses.reduce(
    (sum, c) => sum + (c.students?.length || 0),
    0
  );

  const uniqueStudents = new Set(
    courses.flatMap((c) => c.students.map((s) => s.toString()))
  ).size;

  const resultsUploaded = await Result.countDocuments({
    uploadedBy: lecturerId,
  });

  const latestCourse =
    courses.length > 0
      ? courses.sort((a, b) => b.createdAt - a.createdAt)[0]
      : null;

  res.status(StatusCodes.OK).json({
    success: true,
    lecturer: {
      id: lecturer._id,
      name: lecturer.name,
      email: lecturer.identifier,
      department: lecturer.department || "Computer Science",
      role: lecturer.role,
    },
    stats: {
      totalCourses,
      totalStudents,
      uniqueStudents,
      resultsUploaded,
    },
    latestCourse: latestCourse
      ? {
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
  const { name, department } = req.body;

  // Only lecturers can use this route
  const lecturer = await User.findById(lecturerId);
  if (!lecturer || lecturer.role !== "lecturer") {
    throw new NotFoundError("Lecturer not found");
  }

  // Check if at least one field is provided
  if (!name && !department) {
    throw new BadRequestError("Please provide at least one field to update");
  }

  // Update profile info
  if (name) lecturer.name = name;
  if (department) lecturer.department = department;

  await lecturer.save();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Profile updated successfully",
    lecturer: {
      id: lecturer._id,
      name: lecturer.name,
      email: lecturer.identifier,
      department: lecturer.department || "Computer Science",
      role: lecturer.role,
    },
  });
};

module.exports = {
  getAllResultsUplodedByLecturer,
  getAllResultsForMyCourses,
  uploadResultForStudent,
  editStudentResult,
  deleteResult,
  viewCoursesAssignedToLecturer,
  viewOwnProfile,
  updateProfileInfo,
};
