const User = require("../../models/User");
const Course = require("../../models/Course");
const Result = require("../../models/Result");
const Department = require("../../models/Department");
const bcrypt = require("bcryptjs");
const { NotFoundError, BadRequestError } = require("../../errors");

class StudentService {
  async createStudent(data) {
    const { name, identifier, password, department } = data;

    if (!name || !identifier || !password || !department) {
      throw new BadRequestError("Missing required fields");
    }

    const deptExists = await Department.findById(department);
    if (!deptExists) throw new NotFoundError("Department not found");

    const exists = await User.findOne({ identifier });
    if (exists) throw new BadRequestError("Identifier already exists");

    return await User.create({ ...data, role: "student" });
  }

  async bulkCreateStudents(studentsData) {
    const results = { success: [], failed: [] };

    for (const student of studentsData) {
      try {
        if (student.department) {
          const deptExists = await Department.findById(student.department);
          if (!deptExists) {
            results.failed.push({
              data: student,
              error: "Department not found",
            });
            continue;
          }
        }

        const exists = await User.findOne({ identifier: student.identifier });
        if (exists) {
          results.failed.push({ data: student, error: "Identifier exists" });
          continue;
        }

        const created = await User.create({ ...student, role: "student" });
        results.success.push(created);
      } catch (err) {
        results.failed.push({ data: student, error: err.message });
      }
    }

    return results;
  }

  async getAllStudents(filters = {}) {
    const { department, level, status, session } = filters;
    const query = { role: "student" };

    if (department) query.department = department;
    if (level) query.level = level;
    if (status) query.status = status;
    if (session) query.session = session;

    return await User.find(query)
      .select("-password")
      .populate({
        path: "department",
        select: "name code faculty",
        strictPopulate: false,
      })
      .sort({ name: 1 });
  }

  async getStudentsByDepartment(deptId) {
    const dept = await Department.findById(deptId);
    if (!dept) throw new NotFoundError("Department not found");

    const students = await User.find({
      role: "student",
      department: deptId,
    })
      .select("-password")
      .sort({ level: 1, name: 1 });

    return { department: dept, count: students.length, students };
  }

  async updateStudent(id, data) {
    const student = await User.findById(id);
    if (!student || student.role !== "student") {
      throw new NotFoundError("Student not found");
    }

    if (data.department) {
      const deptExists = await Department.findById(data.department);
      if (!deptExists) throw new NotFoundError("Department not found");
    }

    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password, salt);
    }

    Object.assign(student, data);
    await student.save();
    return student;
  }

  async deleteStudent(id) {
    const student = await User.findById(id);
    if (!student || student.role !== "student") {
      throw new NotFoundError("Student not found");
    }

    const hasResults = await Result.exists({ student: id });
    if (hasResults) {
      throw new BadRequestError("Cannot delete student with existing results");
    }

    await Course.updateMany({ students: id }, { $pull: { students: id } });

    await student.deleteOne();
    return student;
  }
}

module.exports = new StudentService();
