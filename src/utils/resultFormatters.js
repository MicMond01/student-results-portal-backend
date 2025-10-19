const groupResultsByCourse = (results) => {
  const grouped = {};

  results.forEach((result) => {
    const courseCode = result.course.code;
    if (!grouped[courseCode]) {
      grouped[courseCode] = {
        course: {
          code: result.course.code,
          title: result.course.title,
          semester: result.course.semester,
          session: result.course.session,
          level: result.course.level,
          creditUnit: result.course.creditUnit,
        },
        results: [],
      };
    }
    grouped[courseCode].results.push({
      _id: result._id,
      student: result.student,
      ca: result.ca,
      exam: result.exam,
      total: result.total,
      grade: result.grade,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    });
  });

  return grouped;
};

const groupResultsByStudent = (results) => {
  const studentMap = {};

  results.forEach((result) => {
    const studentId = result.student._id.toString();

    if (!studentMap[studentId]) {
      studentMap[studentId] = {
        student: {
          _id: result.student._id,
          name: result.student.name,
          identifier: result.student.identifier,
        },
        results: [],
      };
    }

    studentMap[studentId].results.push({
      _id: result._id,
      course: result.course,
      semester: result.semester,
      session: result.session,
      ca: result.ca,
      exam: result.exam,
      total: result.total,
      grade: result.grade,
      uploadedBy: result.uploadedBy,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    });
  });

  return Object.values(studentMap);
};

module.exports = { groupResultsByCourse, groupResultsByStudent };
