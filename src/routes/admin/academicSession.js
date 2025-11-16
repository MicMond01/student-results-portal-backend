const express = require("express");
const router = express.Router();

const {
  createAcademicSession,
  getAllAcademicSessions,
  getCurrentAcademicSession,
  updateAcademicSession,
  deleteAcademicSession,
} = require("../../controllers/admin/academicSession");

router.route("/").post(createAcademicSession).get(getAllAcademicSessions);

router.get("/current", getCurrentAcademicSession);

router.route("/:id").patch(updateAcademicSession).delete(deleteAcademicSession);

module.exports = router;
