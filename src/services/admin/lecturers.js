const User = require("../../models/User");
const Course = require("../../models/Course");
const Department = require("../../models/Department");
const bcrypt = require("bcryptjs");
const { NotFoundError, BadRequestError } = require("../../errors");

class LecturerService {
  async createLecturer(data) {
    const { name, identifier, password, department } = data;

    if (!name || !identifier || !password || !department) {
      throw new BadRequestError("Missing required fields");
    }

    const deptExists = await Department.findById(department);
    if (!deptExists) throw new NotFoundError("Department not found");

    const exists = await User.findOne({ identifier });
    if (exists) throw new BadRequestError("Identifier already exists");

    return await User.create({ ...data, role: "lecturer" });
  }

  async getAllLecturers(filters = {}) {
    const { department } = filters;
    const query = { role: "lecturer" };

    if (department) query.department = department;

    const lecturers = await User.find(query)
      .select("-password")

      .populate("department", "name code faculty hod")
      .sort({ name: 1 });

    const result = lecturers.map((lecturer) => {
      const lec = lecturer.toObject();
      lec.isHod = !!(
        lec.department &&
        lec.department.hod &&
        lec.department.hod.toString() === lecturer._id.toString()
      );
      return lec;
    });

    return result;
  }

  async getLecturersByDepartment(deptId) {
    const dept = await Department.findById(deptId);
    if (!dept) throw new NotFoundError("Department not found");

    const lecturers = await User.find({
      role: "lecturer",
      department: deptId,
    })
      .select("-password")
      .sort({ name: 1 });

    const result = lecturers.map((lecturer) => {
      const lec = lecturer.toObject();
      lec.isHod = dept.hod && dept.hod.toString() === lecturer._id.toString();
      return lec;
    });

    return {
      department: dept,
      count: result.length,
      lecturers: result,
    };
  }

  async updateLecturer(id, data) {
    const lecturer = await User.findById(id);
    if (!lecturer || lecturer.role !== "lecturer") {
      throw new NotFoundError("Lecturer not found");
    }

    if (data.department) {
      const exists = await Department.findById(data.department);
      if (!exists) throw new NotFoundError("Department not found");
    }

    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password, salt);
    }

    Object.assign(lecturer, data);
    await lecturer.save();
    return lecturer;
  }

  async deleteLecturer(id) {
    const lecturer = await User.findById(id);
    if (!lecturer || lecturer.role !== "lecturer") {
      throw new NotFoundError("Lecturer not found");
    }

    const hasCourses = await Course.exists({ lecturer: id });
    if (hasCourses) {
      throw new BadRequestError("Reassign courses before deleting lecturer");
    }

    await lecturer.deleteOne();
    return lecturer;
  }
}

module.exports = new LecturerService();
