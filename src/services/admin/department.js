const Department = require("../../models/Department");
const User = require("../../models/User");
const Course = require("../../models/Course");
const { NotFoundError, BadRequestError } = require("../../errors");
const mongoose = require("mongoose");

class DepartmentService {
  async createDepartment(data) {
    const { name, code, faculty } = data;
    if (!name || !code || !faculty) {
      throw new BadRequestError("Please provide name, code, and faculty");
    }

    const exists = await Department.findOne({
      $or: [{ code }, { name }],
    });

    if (exists) {
      throw new BadRequestError(
        "Department with this name/code already exists"
      );
    }

    return await Department.create(data);
  }

  async getAllDepartments(includeInactive = false) {
    const filter = includeInactive ? {} : { isActive: true };
    return await Department.find(filter).sort({ faculty: 1, name: 1 });
  }

  async getDepartmentById(deptId) {
    const department = await Department.findById(deptId);
    if (!department) {
      throw new NotFoundError("Department not found");
    }

    // Convert deptId to ObjectId for proper comparison
    const departmentObjectId = new mongoose.Types.ObjectId(deptId);

    const [lecturers, students, courses, studentsByLevel, coursesByLevel] =
      await Promise.all([
        User.countDocuments({
          role: "lecturer",
          department: departmentObjectId,
        }),
        User.countDocuments({
          role: "student",
          department: departmentObjectId,
        }),
        Course.countDocuments({ department: departmentObjectId }),

        // Group students by level
        User.aggregate([
          {
            $match: {
              role: "student",
              department: departmentObjectId,
              level: { $ne: null }, // Exclude students without level
            },
          },
          { $group: { _id: "$level", count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),

        // Group courses by level
        Course.aggregate([
          { $match: { department: departmentObjectId } },
          { $group: { _id: "$level", count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
      ]);

    // Transform arrays into objects with level as key
    const studentLevelBreakdown = studentsByLevel.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const courseLevelBreakdown = coursesByLevel.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    return {
      department,
      statistics: {
        totalLecturers: lecturers,
        totalStudents: students,
        studentsByLevel: studentLevelBreakdown, // { 100: 20, 200: 15, 300: 10, 400: 5 }
        totalCourses: courses,
        coursesByLevel: courseLevelBreakdown, // { 100: 4, 200: 5, 300: 4, 400: 4 }
      },
    };
  }

  async updateDepartment(id, data) {
    const department = await Department.findById(id);
    if (!department) throw new NotFoundError("Department not found");

    if (data.name && department.name !== data.name) {
      const exists = await Department.findOne({ name: data.name });
      if (exists) {
        throw new BadRequestError("Department with this name already exists");
      }
    }

    // Handle HOD assignment/removal
    if ("hod" in data) {
      if (data.hod === null) {
        data.hodName = null;
        data.hodEmail = null;
      } else {
        const user = await User.findById(data.hod);
        if (!user) {
          throw new NotFoundError("User not found");
        }
        if (user.role !== "lecturer") {
          throw new BadRequestError("User is not a lecturer");
        }
        if (user.department.toString() !== id) {
          throw new BadRequestError("Lecturer is not in this department");
        }

        data.hodName = user.name;
        data.hodEmail = user.email;
      }
    }

    return await Department.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate("hod", "name email staffId rank");
  }

  async deleteDepartment(id) {
    const department = await Department.findById(id);
    if (!department) throw new NotFoundError("Department not found");

    const [lecturers, students, courses] = await Promise.all([
      User.exists({ role: "lecturer", department: id }),
      User.exists({ role: "student", department: id }),
      Course.exists({ department: id }),
    ]);

    if (lecturers || students || courses) {
      throw new BadRequestError(
        "Cannot delete department with existing lecturers, students, or courses"
      );
    }

    await department.deleteOne();
    return department;
  }
}

module.exports = new DepartmentService();
