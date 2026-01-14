const express = require("express");
const router = express.Router();

const {
  getAllAcademicSessions,
  getCurrentAcademicSession,
  getAcademicSession,
} = require("../../controllers/lecturer/academicSession");

router.get("/academic-sessions", getAllAcademicSessions);
router.get("/academic-sessions/current", getCurrentAcademicSession);
router.get("/academic-sessions/:id", getAcademicSession);

module.exports = router;
