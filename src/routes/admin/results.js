const express = require("express");
const router = express.Router();

const {
  createResult,
  bulkCreateResults,
  getAllResults,
  updateResult,
  deleteResult,
  getStudentResults,
  getResultsByCourse,
  getResultsByLecturer,
} = require("../../controllers/admin/results");

router.route("/").post(createResult).get(getAllResults);

router.post("/bulk", bulkCreateResults);
router.get("/course/:courseId", getResultsByCourse);
router.get("/lecturer/:lecturerId", getResultsByLecturer);
router.get("/student/:studentId", getStudentResults);
router.route("/:id").patch(updateResult).delete(deleteResult);

module.exports = router;
