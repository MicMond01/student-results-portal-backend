const express = require("express");
const router = express.Router();

const {
  getResultWithStudentInfo,
  getAllResultsUplodedByLecturer,
  uploadResultForStudent,
  getAllResultsForMyCourses,
  editStudentResult,
  deleteResult,
} = require("../../controllers/lecturer");
const { canModifyResult } = require("../../middleware/resourceAuthorization");

router
  .route("/")
  .get(getAllResultsUplodedByLecturer)
  .post(uploadResultForStudent);

router.route("/course-results").get(getAllResultsForMyCourses);

router
  .route("/:id")
  .get(getResultWithStudentInfo)
  .patch(canModifyResult, editStudentResult)
  .delete(canModifyResult, deleteResult);

module.exports = router;
