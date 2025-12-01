const express = require("express");
const router = express.Router();

const {
  createLecturer,
  getAllLecturers,
  getLecturersByDepartment,
  updateLecturer,
  deleteLecturer,
  getLecturerDetails,
  resetLecturerPassword,
} = require("../../controllers/admin/lecturers");

router.route("/").post(createLecturer).get(getAllLecturers);

router.get("/department/:deptId", getLecturersByDepartment);
router.patch("/:id/reset-password", resetLecturerPassword);

router
  .route("/:id")
  .get(getLecturerDetails)
  .patch(updateLecturer)
  .delete(deleteLecturer);

module.exports = router;
