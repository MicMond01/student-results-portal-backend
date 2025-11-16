const User = require("../../models/User");
const Course = require("../../models/Course");
const Department = require("../../models/Department");
const AcademicSession = require("../../models/AcademicSession");

class StatsService {
  async getDashboardStats() {
    const [
      totalStudents,
      totalLecturers,
      totalCourses,
      totalDepartments,
      activeSession,
      studentsByDepartment,
      studentsByLevel,
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "lecturer" }),
      Course.countDocuments(),
      Department.countDocuments({ isActive: true }),
      AcademicSession.findOne({ isCurrent: true }),
      User.aggregate([
        { $match: { role: "student" } },
        { $group: { _id: "$department", count: { $sum: 1 } } },
        {
          $lookup: {
            from: "departments",
            localField: "_id",
            foreignField: "_id",
            as: "department",
          },
        },
        { $unwind: "$department" },
        {
          $project: {
            departmentName: "$department.name",
            count: 1,
          },
        },
      ]),
      User.aggregate([
        { $match: { role: "student" } },
        { $group: { _id: "$level", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return {
      totalStudents,
      totalLecturers,
      totalCourses,
      totalDepartments,
      currentSession: activeSession ? activeSession.session : "Not Set",
      studentsByDepartment,
      studentsByLevel,
    };
  }
}

module.exports = new StatsService();
