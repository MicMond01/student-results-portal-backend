const calculateAcademicStats = (results) => {
  if (!results || results.length === 0) {
    return {
      cgpa: 0,
      totalCreditUnits: 0,
    };
  }

  let totalPoints = 0;
  let totalCredits = 0;

  const gradePoints = {
    A: 5.0,
    B: 4.0,
    C: 3.0,
    D: 2.0,
    E: 1.0,
    F: 0.0,
  };

  results.forEach((result) => {
    const creditUnit = result.course.creditUnit || 0;
    const gradePoint = gradePoints[result.grade] || 0;

    totalPoints += gradePoint * creditUnit;
    totalCredits += creditUnit;
  });

  const cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;

  return {
    cgpa: parseFloat(cgpa),
    totalCreditUnits: totalCredits,
  };
};

// Helper function to group results by session and semester
const groupResultsBySession = (results) => {
  const grouped = {};

  results.forEach((r) => {
    const sessionKey = r.session;

    if (!grouped[sessionKey]) {
      grouped[sessionKey] = {
        session: r.session,
        semesters: {
          First: [],
          Second: [],
        },
      };
    }

    grouped[sessionKey].semesters[r.semester].push({
      course: r.course.code,
      title: r.course.title,
      level: r.course.level,
      creditUnit: r.course.creditUnit,
      ca: r.ca,
      exam: r.exam,
      total: r.total,
      grade: r.grade,
    });
  });

  return Object.values(grouped);
};

module.exports = {
  calculateAcademicStats,
  groupResultsBySession,
};
