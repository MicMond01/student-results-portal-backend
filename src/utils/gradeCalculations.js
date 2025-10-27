const GRADE_POINTS = {
  A: 5.0,
  B: 4.0,
  C: 3.0,
  D: 2.0,
  E: 1.0,
  F: 0.0,
};

/**
 * Calculate GPA for a single student's results
 * @param {Array} results - Array of result objects with grade and creditUnit
 * @returns {Object} - GPA and total credit units
 */
const calculateStudentGPA = (results) => {
  let totalPoints = 0;
  let totalCredits = 0;

  results.forEach((result) => {
    const gradePoint = GRADE_POINTS[result.grade] || 0;
    const creditUnit = result.course.creditUnit || 0;

    totalPoints += gradePoint * creditUnit;
    totalCredits += creditUnit;
  });

  const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;

  return {
    gpa: parseFloat(gpa.toFixed(2)),
    totalCredits,
    totalPoints,
  };
};

/**
 * Calculate average GPA per session for all students
 * @param {Array} data - Response data from backend
 * @returns {Object} - Session-wise statistics
 */
const calculateSessionGPA = (data) => {
  const sessionStats = {};

  // Process each student
  data.forEach((studentData) => {
    const { student, results } = studentData;

    // Group results by session
    results.forEach((result) => {
      const session = result.session;

      if (!sessionStats[session]) {
        sessionStats[session] = {
          session,
          students: new Set(),
          totalGPA: 0,
          studentGPAs: [],
          totalResults: 0,
          gradeDistribution: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 },
          totalCreditUnits: 0,
        };
      }

      // Track unique students per session
      sessionStats[session].students.add(student._id);
      sessionStats[session].totalResults++;
      sessionStats[session].gradeDistribution[result.grade]++;
      sessionStats[session].totalCreditUnits += result.course.creditUnit;
    });
  });

  // Calculate student GPAs per session
  data.forEach((studentData) => {
    const { student, results } = studentData;

    // Group student's results by session
    const sessionResults = {};
    results.forEach((result) => {
      if (!sessionResults[result.session]) {
        sessionResults[result.session] = [];
      }
      sessionResults[result.session].push(result);
    });

    // Calculate GPA for each session
    Object.entries(sessionResults).forEach(([session, sessionResultList]) => {
      const { gpa, totalCredits } = calculateStudentGPA(sessionResultList);

      if (sessionStats[session]) {
        sessionStats[session].studentGPAs.push({
          studentId: student._id,
          studentName: student.name,
          gpa,
          totalCredits,
        });
      }
    });
  });

  // Calculate average GPA per session
  Object.values(sessionStats).forEach((stat) => {
    stat.students = stat.students.size;

    if (stat.studentGPAs.length > 0) {
      const totalGPA = stat.studentGPAs.reduce((sum, s) => sum + s.gpa, 0);
      stat.averageGPA = parseFloat(
        (totalGPA / stat.studentGPAs.length).toFixed(2)
      );

      // Sort students by GPA (highest first)
      stat.studentGPAs.sort((a, b) => b.gpa - a.gpa);

      // Get highest and lowest
      stat.highestGPA = stat.studentGPAs[0];
      stat.lowestGPA = stat.studentGPAs[stat.studentGPAs.length - 1];
    } else {
      stat.averageGPA = 0;
    }
  });

  return sessionStats;
};

/**
 * Calculate overall statistics across all sessions
 * @param {Object} sessionStats - Session statistics from calculateSessionGPA
 * @returns {Object} - Overall statistics
 */
const calculateOverallStats = (sessionStats) => {
  const sessions = Object.values(sessionStats);

  const totalStudents = new Set();
  let totalResults = 0;
  let totalGPA = 0;
  const allGradeDistribution = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };

  sessions.forEach((stat) => {
    stat.studentGPAs.forEach((s) => totalStudents.add(s.studentId));
    totalResults += stat.totalResults;
    totalGPA += stat.averageGPA;

    Object.keys(allGradeDistribution).forEach((grade) => {
      allGradeDistribution[grade] += stat.gradeDistribution[grade];
    });
  });

  return {
    totalStudents: totalStudents.size,
    totalResults,
    totalSessions: sessions.length,
    overallAverageGPA:
      sessions.length > 0
        ? parseFloat((totalGPA / sessions.length).toFixed(2))
        : 0,
    gradeDistribution: allGradeDistribution,
  };
};

const calculatePassRate = (results) => {
  const passed = results.filter((r) =>
    ["A", "B", "C", "D", "E"].includes(r.grade)
  ).length;
  const total = results.length;
  return ((passed / total) * 100).toFixed(2);
};

const getAtRiskStudents = (sessionStats) => {
  return sessionStats.studentGPAs
    .filter((s) => s.gpa < 2.0)
    .map((s) => ({
      name: s.studentName,
      gpa: s.gpa,
      status: "At Risk",
    }));
};

module.exports = {
  calculateStudentGPA,
  calculateSessionGPA,
  calculateOverallStats,
  calculatePassRate,
  getAtRiskStudents,
  GRADE_POINTS,
};
