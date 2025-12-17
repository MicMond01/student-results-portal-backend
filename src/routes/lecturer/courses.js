const express = require("express");
const router = express.Router();

const {
  viewCoursesAssignedToLecturer,
  getMyCoursesAnalytics,
  getCourseDetails,
} = require("../../controllers/lecturer/lecturer");

router.get("/", viewCoursesAssignedToLecturer);
router.get("/analytics", getMyCoursesAnalytics);

router.get("/:courseId", getCourseDetails);

module.exports = router;
