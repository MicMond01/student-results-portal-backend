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

const groupCoursesBySession = (courses) => {
  const grouped = {};

  courses.forEach((course) => {
    const sessionKey = course.session;

    if (!grouped[sessionKey]) {
      grouped[sessionKey] = {
        session: course.session,
        semesters: {
          First: [],
          Second: [],
        },
        totalCourses: 0,
        totalCreditUnits: 0,
      };
    }

    const semesterData = {
      id: course._id,
      title: course.title,
      code: course.code,
      creditUnit: course.creditUnit,
      level: course.level,
      description: course.description,
      lecturer: course.lecturer
        ? {
            id: course.lecturer._id,
            name: course.lecturer.name,
            email: course.lecturer.email,
          }
        : null,
    };

    grouped[sessionKey].semesters[course.semester].push(semesterData);
    grouped[sessionKey].totalCourses++;
    grouped[sessionKey].totalCreditUnits += course.creditUnit;
  });

  return Object.values(grouped).sort((a, b) => {
    const [yearA] = a.session.split("/");
    const [yearB] = b.session.split("/");
    return parseInt(yearB) - parseInt(yearA);
  });
};

module.exports = {
  calculateAcademicStats,
  groupResultsBySession,
  groupCoursesBySession,
};
