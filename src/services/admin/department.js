const Department = require("../../models/Department");
const User = require("../../models/User");
const Course = require("../../models/Course");
const { NotFoundError, BadRequestError } = require("../../errors");

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

    const [lecturers, students, courses] = await Promise.all([
      User.countDocuments({ role: "lecturer", department: deptId }),
      User.countDocuments({ role: "student", department: deptId }),
      Course.countDocuments({ department: deptId }),
    ]);

    return {
      department,
      statistics: {
        totalLecturers: lecturers,
        totalStudents: students,
        totalCourses: courses,
      },
    };
  }

  async updateDepartment(id, data) {
    const updated = await Department.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!updated) throw new NotFoundError("Department not found");

    return updated;
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
