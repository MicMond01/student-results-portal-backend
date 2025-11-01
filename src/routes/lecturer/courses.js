const express = require("express");
const router = express.Router();

const {
  viewCoursesAssignedToLecturer,
  getMyCoursesAnalytics,
} = require("../../controllers/lecturer");

router.get("/", viewCoursesAssignedToLecturer);
router.get("/analytics", getMyCoursesAnalytics);

module.exports = router;
