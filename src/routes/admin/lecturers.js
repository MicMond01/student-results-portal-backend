const express = require("express");
const router = express.Router();

const {
  createLecturer,
  getAllLecturers,
  getLecturersByDepartment,
  updateLecturer,
  deleteLecturer,
} = require("../../controllers/admin/lecturers");

router.route("/").post(createLecturer).get(getAllLecturers);

router.get("/department/:deptId", getLecturersByDepartment);

router.route("/:id").patch(updateLecturer).delete(deleteLecturer);

module.exports = router;
