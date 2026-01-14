const User = require("../models/User.js");
const AcademicSession = require("../models/AcademicSession.js");
const {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} = require("../errors/index.js");
const Course = require("../models/Course.js");
const Session = require("../models/AcademicSession.js");

class CourseRegistrationService {
  static async _checkCoursePermission(courseId, userId, userRole) {
    const course = await Course.findById(courseId);

    if (!course) {
      throw new NotFoundError("Course not found");
    }

    // Admin can modify any course
    if (userRole === "admin") {
      return course;
    }

    // Lecturer can only modify their own courses
    if (userRole === "lecturer") {
      if (course.lecturer.toString() !== userId.toString()) {
        throw new ForbiddenError(
          "You can only modify registration for your own courses"
        );
      }
      return course;
    }

    throw new ForbiddenError(
      "You don't have permission to modify course registration"
    );
  }

  //=============== STUDENT METHODS =============
  // Get available courses for student registration (NOT YET REGISTERED)
  static async getAvailableCoursesForStudent(studentId) {
    const student = await User.findById(studentId).select(
      "department level name matricNo"
    );

    if (!student) {
      throw new NotFoundError("Student not found");
    }

    const activeSession = await Session.findOne({ isActive: true });

    if (!activeSession) {
      throw new NotFoundError("No active session found. Please contact admin.");
    }

    // Find ALL courses for student's department, level, and session
    const courses = await Course.find({
      department: student.department,
      level: student.level,
      session: activeSession.session,
      isActive: true,
    })
      .populate("lecturer", "name email identifier")
      .populate("department", "name code")
      .lean();

    // Filter and map courses - ONLY SHOW UNREGISTERED COURSES
    const availableCourses = courses
      .filter((course) => {
        // Check if student is NOT registered
        const isRegistered = course.students.some(
          (s) => s.toString() === studentId.toString()
        );

        // Only include courses where student is NOT registered
        return !isRegistered;
      })
      .map((course) => {
        const isOpen = this._checkIfRegistrationOpen(course);

        // Remove sensitive student data before returning
        const { students, ...courseWithoutStudents } = course;

        return {
          ...courseWithoutStudents,
          isRegistered: false, // Will always be false in available courses
          isRegistrationOpen: isOpen,
          canRegister: isOpen, // Can register if open (since not registered)
          unit: course.creditUnit,
        };
      });

    return availableCourses;
  }

  // Register student for a course
  static async registerStudentForCourse(studentId, courseId) {
    const student = await User.findById(studentId).select(
      "department level name matricNo"
    );

    if (!student) {
      throw new NotFoundError("Student not found");
    }

    const course = await Course.findById(courseId);

    if (!course) {
      throw new NotFoundError("Course not found");
    }

    // Check if student is in the correct department
    if (student.department.toString() !== course.department.toString()) {
      throw new BadRequestError(
        "You can only register for courses in your department"
      );
    }

    // Check if student is at the correct level
    if (student.level !== course.level) {
      throw new BadRequestError(
        `This course is for level ${course.level} students`
      );
    }

    // Check if already registered
    const isAlreadyRegistered = course.students.some(
      (s) => s.toString() === studentId.toString()
    );

    if (isAlreadyRegistered) {
      throw new BadRequestError("You are already registered for this course");
    }

    // Check if registration is open
    if (!course.isRegistrationOpen()) {
      throw new ForbiddenError("Registration for this course is closed");
    }

    // Add student to course
    course.students.push(studentId);
    await course.save();

    return {
      message: "Successfully registered for course",
      course: {
        code: course.code,
        title: course.title,
        unit: course.creditUnit,
        semester: course.semester,
      },
    };
  }

  // Unregister student from a course (before deadline)
  static async unregisterStudentFromCourse(studentId, courseId) {
    const course = await Course.findById(courseId);

    if (!course) {
      throw new NotFoundError("Course not found");
    }

    // Check if student is registered
    const studentIndex = course.students.findIndex(
      (s) => s.toString() === studentId.toString()
    );

    if (studentIndex === -1) {
      throw new BadRequestError("You are not registered for this course");
    }

    // Check if registration is still open (can only unregister while registration is open)
    if (!course.isRegistrationOpen()) {
      throw new ForbiddenError("Cannot unregister after registration deadline");
    }

    // Remove student from course
    course.students.splice(studentIndex, 1);
    await course.save();

    return {
      message: "Successfully unregistered from course",
      course: {
        code: course.code,
        title: course.title,
      },
    };
  }

  // Get student's registered courses (ALREADY REGISTERED)
  static async getStudentRegisteredCourses(studentId) {
    const student = await User.findById(studentId).select("department level");

    if (!student) {
      throw new NotFoundError("Student not found");
    }

    const activeSession = await Session.findOne({ isActive: true });

    if (!activeSession) {
      throw new NotFoundError("No active session found");
    }

    // Only get courses where student is IN the students array
    const courses = await Course.find({
      session: activeSession.session,
      students: studentId, // This filters to only registered courses
    })
      .populate("lecturer", "name email identifier")
      .populate("department", "name code")
      .lean();

    return courses.map((course) => {
      const isOpen = this._checkIfRegistrationOpen(course);

      // Remove sensitive student data before returning
      const { students, ...courseWithoutStudents } = course;

      return {
        ...courseWithoutStudents,
        isRegistered: true,
        isRegistrationOpen: isOpen,
        canRegister: false,
        unit: course.creditUnit,
      };
    });
  }

  // ADMIN/LECTURER: Update course registration settings
  static async updateCourseRegistrationSettings(
    courseId,
    settings,
    userId,
    userRole
  ) {
    const course = await Course.findById(courseId);

    if (!course) {
      throw new NotFoundError("Course not found");
    }

    // Check permission
    if (
      userRole !== "admin" &&
      course.lecturer.toString() !== userId.toString()
    ) {
      throw new ForbiddenError(
        "You don't have permission to update this course"
      );
    }

    // Update settings
    if (settings.registrationOpen !== undefined) {
      course.registrationOpen = settings.registrationOpen;
    }

    if (settings.registrationDeadline !== undefined) {
      course.registrationDeadline = settings.registrationDeadline;
    }

    if (settings.registrationOpenDate !== undefined) {
      course.registrationOpenDate = settings.registrationOpenDate;
    }

    if (settings.maxStudents !== undefined) {
      course.maxStudents = settings.maxStudents;
    }

    await course.save();

    return course;
  }

  // ADMIN/LECTURER: Close registration for a course
  static async closeRegistration(courseId, userId, userRole) {
    return this.updateCourseRegistrationSettings(
      courseId,
      { registrationOpen: false },
      userId,
      userRole
    );
  }

  // ADMIN/LECTURER: Open registration for a course
  static async openRegistration(courseId, userId, userRole) {
    return this.updateCourseRegistrationSettings(
      courseId,
      { registrationOpen: true },
      userId,
      userRole
    );
  }

  // ===== ADMIN ONLY METHODS =====
  static async bulkSetDeadlineForDepartment(
    departmentId,
    deadline,
    adminId,
    adminRole
  ) {
    if (adminRole !== "admin") {
      throw new ForbiddenError("Only admins can perform bulk operations");
    }

    const activeSession = await Session.findOne({ isActive: true });

    if (!activeSession) {
      throw new NotFoundError("No active session found");
    }

    const result = await Course.updateMany(
      {
        department: departmentId,
        session: activeSession.session,
      },
      {
        $set: { registrationDeadline: deadline },
      }
    );

    return {
      message: "Bulk deadline update completed",
      coursesUpdated: result.modifiedCount,
    };
  }

  static async bulkSetDeadlineForSession(deadline, adminId, adminRole) {
    if (adminRole !== "admin") {
      throw new ForbiddenError("Only admins can perform bulk operations");
    }

    const activeSession = await Session.findOne({ isActive: true });

    if (!activeSession) {
      throw new NotFoundError("No active session found");
    }

    const result = await Course.updateMany(
      { session: activeSession.session },
      { $set: { registrationDeadline: deadline } }
    );

    return {
      message: "Bulk deadline update completed for entire session",
      coursesUpdated: result.modifiedCount,
    };
  }

  static async getRegistrationStatistics(adminId, adminRole) {
    if (adminRole !== "admin") {
      throw new ForbiddenError("Only admins can view registration statistics");
    }

    const activeSession = await Session.findOne({ isActive: true });

    if (!activeSession) {
      throw new NotFoundError("No active session found");
    }

    const courses = await Course.find({
      session: activeSession.session,
    })
      .populate("department", "name")
      .lean();

    const stats = {
      totalCourses: courses.length,
      openRegistration: 0,
      closedRegistration: 0,
      totalStudentsRegistered: 0,
      averageStudentsPerCourse: 0,
      byDepartment: {},
    };

    courses.forEach((course) => {
      const isOpen = this._checkIfRegistrationOpen(course);

      if (isOpen) stats.openRegistration++;
      else stats.closedRegistration++;

      stats.totalStudentsRegistered += course.students.length;

      const deptName = course.department.name;
      if (!stats.byDepartment[deptName]) {
        stats.byDepartment[deptName] = {
          totalCourses: 0,
          openRegistration: 0,
          totalStudents: 0,
        };
      }

      stats.byDepartment[deptName].totalCourses++;
      if (isOpen) stats.byDepartment[deptName].openRegistration++;
      stats.byDepartment[deptName].totalStudents += course.students.length;
    });

    stats.averageStudentsPerCourse =
      stats.totalCourses > 0
        ? (stats.totalStudentsRegistered / stats.totalCourses).toFixed(2)
        : 0;

    return stats;
  }

  // ===== HELPER METHOD =====
  static _checkIfRegistrationOpen(course) {
    if (!course.registrationOpen) return false;

    if (
      course.registrationDeadline &&
      new Date() > new Date(course.registrationDeadline)
    ) {
      return false;
    }

    if (
      course.registrationOpenDate &&
      new Date() < new Date(course.registrationOpenDate)
    ) {
      return false;
    }

    if (course.maxStudents && course.students.length >= course.maxStudents) {
      return false;
    }

    return true;
  }
}

module.exports = CourseRegistrationService;
