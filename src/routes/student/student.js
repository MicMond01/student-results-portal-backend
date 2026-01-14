const express = require("express");
const router = express.Router();

const {
  getMyResults,
  getOwnProfile,
  updateOwnProfile,
  getMyCourses,
} = require("../../controllers/student");
const {
  getAvailableCourses,
  registerForCourse,
  unregisterFromCourse,
  getMyRegisteredCourses,
} = require("../../controllers/student/courseRegistration");
const {
  getAllAcademicSessions,
  getCurrentAcademicSession,
  getAcademicSession,
} = require("../../controllers/student/academicSession");

router.route("/results").get(getMyResults);
router.route("/courses").get(getMyCourses);
router.route("/profile").get(getOwnProfile).patch(updateOwnProfile);

router.get("/course-registration/available", getAvailableCourses);

router.post("/course-registration/register", registerForCourse);

router.delete(
  "/course-registration/unregister/:courseId",
  unregisterFromCourse
);

router.get("/course-registration/my-courses", getMyRegisteredCourses);

router.get("/academic-sessions", getAllAcademicSessions);
router.get("/academic-sessions/current", getCurrentAcademicSession);
router.get("/academic-sessions/:id", getAcademicSession);

module.exports = router;
