const { StatusCodes } = require("http-status-codes");
const Result = require("../models/Result");

const getAllResult = async (req, res) => {
  try {
    const { session } = req.query; //  filter by session

    const filter = {};
    if (session) filter.session = session;

    const results = await Result.find(filter)
      .populate("student", "name matricNo department level")
      .populate("course", "title code creditUnit semester")
      .sort("student.session");

    // Group results by student and session
    const grouped = {};

    results.forEach((r) => {
      const studentId = r.student._id.toString();
      const key = `${studentId}_${r.session}`;

      if (!grouped[key]) {
        grouped[key] = {
          student: r.student,
          session: r.session,
          results: { First: [], Second: [] },
        };
      }

      grouped[key].results[r.semester].push({
        course: r.course.code,
        title: r.course.title,
        creditUnit: r.course.creditUnit,
        ca: r.ca,
        exam: r.exam,
        total: r.total,
        grade: r.grade,
      });
    });

    res.status(StatusCodes.OK).json({
      success: true,
      count: Object.keys(grouped).length,
      results: Object.values(grouped),
    });
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, msg: "Error fetching grouped results" });
  }
};

module.exports = getAllResult;
