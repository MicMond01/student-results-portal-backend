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
    // ✅ skip if course is missing or not populated
    if (!result.course || !result.course.creditUnit) return;

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
    // ✅ skip if course not found or not populated
    if (!r.course || !r.course.code) return;

    const sessionKey = r.session || "Unknown Session";
    const semester = r.semester || "First";

    if (!grouped[sessionKey]) {
      grouped[sessionKey] = {
        session: sessionKey,
        semesters: {
          First: [],
          Second: [],
        },
      };
    }

    grouped[sessionKey].semesters[semester].push({
      course: r.course.code,
      title: r.course.title || "Untitled Course",
      level: r.course.level || "N/A",
      creditUnit: r.course.creditUnit || 0,
      ca: r.ca || 0,
      exam: r.exam || 0,
      total: r.total || 0,
      grade: r.grade || "-",
    });
  });

  return Object.values(grouped);
};

const groupCoursesBySession = (courses) => {
  const grouped = {};

  courses.forEach((course) => {
    if (!course || !course.session) return;

    const sessionKey = course.session;
    const semester = course.semester || "First";

    if (!grouped[sessionKey]) {
      grouped[sessionKey] = {
        session: sessionKey,
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
      title: course.title || "Untitled Course",
      code: course.code || "N/A",
      creditUnit: course.creditUnit || 0,
      level: course.level || "N/A",
      description: course.description || "",
      lecturer: course.lecturer
        ? {
            id: course.lecturer._id,
            name: course.lecturer.name || "Unknown Lecturer",
            email: course.lecturer.email || "No Email",
          }
        : null,
    };

    grouped[sessionKey].semesters[semester].push(semesterData);
    grouped[sessionKey].totalCourses++;
    grouped[sessionKey].totalCreditUnits += course.creditUnit || 0;
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
