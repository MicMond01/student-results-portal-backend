const express = require("express");
const {
  updateRegistrationSettings,
  closeRegistration,
  openRegistration,
  bulkSetDeadlineForDepartment,
  bulkSetDeadlineForSession,
  getRegistrationStatistics,
} = require("../../controllers/admin/courseRegistration");

const router = express.Router();

router.patch("/:courseId/settings", updateRegistrationSettings);

router.patch("/:courseId/close", closeRegistration);

router.patch("/:courseId/open", openRegistration);

router.patch("/bulk-deadline-department", bulkSetDeadlineForDepartment);

router.patch("/bulk-deadline-session", bulkSetDeadlineForSession);

router.get("/statistics", getRegistrationStatistics);

module.exports = router;
