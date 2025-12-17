const express = require("express");
const router = express.Router();

const {
  createAcademicSession,
  getAllAcademicSessions,
  getCurrentAcademicSession,
  updateAcademicSession,
  deleteAcademicSession,
  reopenAcademicSession,
  closeAcademicSession,
} = require("../../controllers/admin/academicSession");

router.route("/").post(createAcademicSession).get(getAllAcademicSessions);
router.route("/:id/close").patch(closeAcademicSession);
router.route("/:id/reopen").patch(reopenAcademicSession);

router.get("/current", getCurrentAcademicSession);

router.route("/:id").patch(updateAcademicSession).delete(deleteAcademicSession);

module.exports = router;
