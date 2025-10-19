const User = require("../models/User");
const Course = require("../models/Course");
const Result = require("../models/Result");

class LecturerService {
  static async getLecturerWithCourses(lecturerId) {
    const lecturer = await User.findById(lecturerId).select("-password");
    const courses = await Course.find({ lecturer: lecturerId })
      .select("title code level semester session creditUnit students")
      .sort({ session: -1, semester: 1 });

    return { lecturer, courses };
  }

  static async getLecturerStats(lecturerId, courses) {
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

    return { totalCourses, totalStudents, uniqueStudents, resultsUploaded };
  }

  static async updateLecturer(lecturerId, updates) {
    const lecturer = await User.findById(lecturerId);

    if (updates.name) lecturer.name = updates.name;
    if (updates.department) lecturer.department = updates.department;

    await lecturer.save();
    return lecturer;
  }
}

module.exports = LecturerService;
