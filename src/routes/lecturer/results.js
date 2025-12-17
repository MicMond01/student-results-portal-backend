const express = require("express");
const router = express.Router();

const {
  getResultWithStudentInfo,
  getAllResultsUplodedByLecturer,
  uploadResultForStudent,
  getAllResultsForMyCourses,
  editStudentResult,
  deleteResult,
  getResultsUploadTemplate,
  bulkUploadResults,
} = require("../../controllers/lecturer/lecturer");

const { canModifyResult } = require("../../middleware/resourceAuthorization");
const {
  checkSessionActive,
  checkResultSessionActive,
} = require("../../middleware/checkSessionActive");
const upload = require("../../middleware/fileUpload");

// List and create results
router
  .route("/")
  .get(getAllResultsUplodedByLecturer)
  .post(checkSessionActive, uploadResultForStudent);

// Read-only: no session check needed
router.route("/course-results").get(getAllResultsForMyCourses);

// Modify/delete results
router
  .route("/:id")
  .get(getResultWithStudentInfo)
  .patch(checkResultSessionActive, canModifyResult, editStudentResult)
  .delete(checkResultSessionActive, canModifyResult, deleteResult);

router.get("/template/:format", getResultsUploadTemplate);

router.post(
  "/bulk",
  upload.single("file"),
  checkSessionActive,
  bulkUploadResults
);

module.exports = router;
