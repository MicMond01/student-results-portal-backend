const User = require("../models/User");
const Course = require("../models/Course");
const Result = require("../models/Result");
const { NotFoundError, BadRequestError } = require("../errors");
const { validateIdentifierForRole } = require("../utils/validators");
const bcrypt = require("bcryptjs");

class UserService {
  async getAllUsers(excludeAdmin = true) {
    const filter = excludeAdmin ? { role: { $ne: "admin" } } : {};
    return await User.find(filter).select("-password");
  }

  async getUserById(userId, includeExtraData = true) {
    const user = await User.findById(userId).select("-password");
    
    if (!user || user.role === "admin") {
      throw new NotFoundError(`No user found with id: ${userId}`);
    }

    if (!includeExtraData) return { user };

    let extraData = {};

    if (user.role === "student") {
      extraData = await this._getStudentData(user._id);
    } else if (user.role === "lecturer") {
      extraData = await this._getLecturerData(user._id);
    }

    return { user, ...extraData };
  }

  async _getStudentData(studentId) {
    const courses = await Course.find({ students: studentId })
      .select("title code creditUnit lecturer semester session level")
      .populate("lecturer", "name email");

    const results = await Result.find({ student: studentId })
      .select("course ca exam total grade session semester")
      .populate("course", "title code creditUnit");

    return {
      totalCourses: courses.length,
      totalResults: results.length,
      courses,
      results,
    };
  }

  async _getLecturerData(lecturerId) {
    const coursesTaught = await Course.find({ lecturer: lecturerId })
      .select("title code level semester session students")
      .lean();

    return {
      totalCourses: coursesTaught.length,
      coursesTaught: coursesTaught.map((course) => ({
        ...course,
        totalStudents: course.students.length,
        students: undefined,
      })),
    };
  }

  async createUser({ name, identifier, password, role }) {
    if (!name || !identifier || !password || !role) {
      throw new BadRequestError("Please provide name, identifier, password, and role.");
    }

    if (!["student", "lecturer"].includes(role)) {
      throw new BadRequestError("Role must be either 'student' or 'lecturer'.");
    }

    validateIdentifierForRole(identifier, role);

    const existingUser = await User.findOne({ identifier });
    if (existingUser) {
      throw new BadRequestError("User with this identifier already exists.");
    }

    return await User.create({ name, identifier, password, role });
  }

  async updateUser(userId, { name, identifier, password, role }) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError(`No user found with id: ${userId}`);

    if (user.role === "admin") {
      throw new BadRequestError("Admin accounts cannot be updated through this route.");
    }

    if (role && !["student", "lecturer"].includes(role)) {
      throw new BadRequestError("Role must be either 'student' or 'lecturer'.");
    }

    const idToCheck = identifier || user.identifier;
    validateIdentifierForRole(idToCheck, role || user.role);

    if (identifier) {
      const existingUser = await User.findOne({ identifier });
      if (existingUser && existingUser._id.toString() !== userId) {
        throw new BadRequestError("Another user already uses this identifier.");
      }
      user.identifier = identifier;
    }

    if (name) user.name = name;
    if (role) user.role = role;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    return user;
  }

  async deleteUser(userId) {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    if (user.role === "admin") {
      throw new BadRequestError("Cannot delete another admin account");
    }

    await user.deleteOne();
    return user;
  }

  async getUsersByRole(role) {
    return await User.find({ role }).select("-password");
  }
}

module.exports = new UserService();