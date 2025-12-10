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
  getResultsUploadTemplate,
} = require("../../controllers/admin/results");
const upload = require("../../middleware/fileUpload");

router.route("/").post(createResult).get(getAllResults);

router.post("/bulk", upload.single("file"), bulkCreateResults);
router.get("/course/:courseId", getResultsByCourse);
router.get("/lecturer/:lecturerId", getResultsByLecturer);
router.get("/student/:studentId", getStudentResults);
router.route("/:id").patch(updateResult).delete(deleteResult);
router.get("/template/:format", getResultsUploadTemplate);

module.exports = router;
