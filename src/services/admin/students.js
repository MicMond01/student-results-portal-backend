const User = require("../../models/User");
const Course = require("../../models/Course");
const Result = require("../../models/Result");
const Department = require("../../models/Department");
const bcrypt = require("bcryptjs");
const { NotFoundError, BadRequestError } = require("../../errors");
const mongoose = require("mongoose");

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

  async getStudentUploadTemplate(format) {
    const template = {
      headers: [
        "name",
        "identifier",
        "password",
        "matricNo",
        "email",
        "phone",
        "gender",
        "dateOfBirth",
        "level",
        "faculty",
        "program",
        "admissionYear",
        "session",
        "status",
        "address",
        "stateOfOrigin",
        "placeOfBirth",
        "jambNo",
      ],
      sampleData: [
        {
          name: "John Doe",
          identifier: "24000000001",
          password: "Student@2024",
          matricNo: "LASU/CS/2024/000001",
          email: "john.doe@student.lasu.edu.ng",
          phone: "+234 801 234 5678",
          gender: "Male",
          dateOfBirth: "2005-01-15",
          level: 100,
          faculty: "Faculty of Science",
          program: "B.Sc. Computer Science",
          admissionYear: 2024,
          session: "2024/2025",
          status: "Active",
          address: "123 Main Street, Lagos",
          stateOfOrigin: "Lagos",
          placeOfBirth: "Lagos",
          jambNo: "12345678901",
        },
        {
          name: "Jane Smith",
          identifier: "24000000002",
          password: "Student@2024",
          matricNo: "LASU/CS/2024/000002",
          email: "jane.smith@student.lasu.edu.ng",
          phone: "+234 802 345 6789",
          gender: "Female",
          dateOfBirth: "2004-03-20",
          level: 100,
          faculty: "Faculty of Science",
          program: "B.Sc. Computer Science",
          admissionYear: 2024,
          session: "2024/2025",
          status: "Active",
          address: "456 Second Avenue, Ibadan",
          stateOfOrigin: "Oyo",
          placeOfBirth: "Ibadan",
          jambNo: "98765432109",
        },
      ],
      instructions: {
        note: "Replace sample data with actual student information. Department will be selected during upload.",
        requiredFields: ["name", "identifier", "password", "level"],
        optionalFields: [
          "email",
          "phone",
          "gender",
          "dateOfBirth",
          "address",
          "matricNo",
        ],
        genderOptions: ["Male", "Female", "Other"],
        levelOptions: [100, 200, 300, 400, 500],
        statusOptions: ["Active", "Inactive", "Graduated", "Suspended"],
      },
    };

    return template;
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

  async getStudentDetails(studentId) {
    // Get student with department details
    const student = await User.findOne({ _id: studentId, role: "student" })
      .select("-password")
      .populate("department", "name code faculty");

    if (!student) {
      throw new NotFoundError("Student not found");
    }

    if (
      !studentId ||
      studentId === "undefined" ||
      !mongoose.Types.ObjectId.isValid(studentId)
    ) {
      throw new BadRequestError("Invalid or missing student ID");
    }

    // Get all courses the student is registered for
    const courses = await Course.find({ students: studentId })
      .populate("lecturer", "name email rank")
      .populate("department", "name code")
      .sort({ session: -1, level: 1, semester: 1 });

    // Get all results for this student
    const results = await Result.find({ student: studentId })
      .populate("course", "code title creditUnit level semester session")
      .sort({ session: -1, semester: 1 });

    // Calculate GPA and statistics
    const currentSessionResults = results.filter(
      (r) => r.session === student.session
    );

    // Grade point mapping
    const gradePoints = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };

    // Calculate CGPA (all results)
    let totalPoints = 0;
    let totalCredits = 0;

    results.forEach((result) => {
      if (result.course && result.grade) {
        const points = gradePoints[result.grade] || 0;
        const credits = result.course.creditUnit || 0;
        totalPoints += points * credits;
        totalCredits += credits;
      }
    });

    const cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;

    // Calculate current session GPA
    let sessionPoints = 0;
    let sessionCredits = 0;

    currentSessionResults.forEach((result) => {
      if (result.course && result.grade) {
        const points = gradePoints[result.grade] || 0;
        const credits = result.course.creditUnit || 0;
        sessionPoints += points * credits;
        sessionCredits += credits;
      }
    });

    const currentGPA =
      sessionCredits > 0 ? (sessionPoints / sessionCredits).toFixed(2) : 0;

    // Statistics
    const stats = {
      totalCoursesRegistered: courses.length,
      totalResults: results.length,
      cgpa: parseFloat(cgpa),
      currentSessionGPA: parseFloat(currentGPA),
      totalCreditUnits: totalCredits,

      // Results by session
      resultsBySession: results.reduce((acc, result) => {
        const session = result.session || "Unknown";
        if (!acc[session]) {
          acc[session] = { count: 0, courses: [] };
        }
        acc[session].count++;
        acc[session].courses.push({
          code: result.course?.code,
          title: result.course?.title,
          grade: result.grade,
          total: result.total,
        });
        return acc;
      }, {}),

      // Grade distribution
      gradeDistribution: results.reduce((acc, r) => {
        acc[r.grade] = (acc[r.grade] || 0) + 1;
        return acc;
      }, {}),

      // Performance metrics
      averageScore:
        results.length > 0
          ? (
              results.reduce((sum, r) => sum + r.total, 0) / results.length
            ).toFixed(2)
          : 0,

      passRate:
        results.length > 0
          ? (
              (results.filter((r) => r.grade !== "F").length / results.length) *
              100
            ).toFixed(2)
          : 0,

      // Academic standing
      academicStanding:
        parseFloat(cgpa) >= 4.5
          ? "First Class"
          : parseFloat(cgpa) >= 3.5
          ? "Second Class Upper"
          : parseFloat(cgpa) >= 2.5
          ? "Second Class Lower"
          : parseFloat(cgpa) >= 1.5
          ? "Third Class"
          : "Pass",
    };

    // Courses by level and semester
    const coursesByLevel = courses.reduce((acc, course) => {
      if (!acc[course.level]) {
        acc[course.level] = { First: [], Second: [] };
      }
      acc[course.level][course.semester].push({
        _id: course._id,
        code: course.code,
        title: course.title,
        creditUnit: course.creditUnit,
        lecturer: course.lecturer,
        session: course.session,
      });
      return acc;
    }, {});

    // Results grouped by semester
    const resultsBySemester = {
      First: results.filter((r) => r.semester === "First"),
      Second: results.filter((r) => r.semester === "Second"),
    };

    return {
      student: {
        ...student.toObject(),
        cgpa: parseFloat(cgpa),
      },
      stats,
      courses: coursesByLevel,
      results: resultsBySemester,
      allResults: results,
    };
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
