const express = require("express");
const router = express.Router();
const {
  createExam,
  getMyExams,
  getExam,
  updateExam,
  deleteExam,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getExamsByCourse,
  getMyCourses,
  upload,
  bulkUploadQuestions,
  downloadTemplate,
} = require("../../controllers/lecturer/lecturerExamController");

const {
  checkSessionActive,
  checkExamSessionActive,
  checkQuestionSessionActive,
} = require("../../middleware/checkSessionActive");

// Create new exam
router.route("/").get(getMyExams).post(checkSessionActive, createExam);

// Read/Update/Delete exam
router
  .route("/:id")
  .get(getExam)
  .patch(checkExamSessionActive, updateExam)
  .delete(checkExamSessionActive, deleteExam);

// ✅ FIXED: Use checkQuestionSessionActive (exam-aware)
router.post("/:id/questions", checkQuestionSessionActive, addQuestion);

router.patch(
  "/:examId/questions/:questionId",
  checkQuestionSessionActive,
  updateQuestion
);

router.delete(
  "/:examId/questions/:questionId",
  checkQuestionSessionActive,
  deleteQuestion
);

// Bulk upload
router.post(
  "/:examId/questions/bulk",
  checkQuestionSessionActive,
  upload.single("file"),
  bulkUploadQuestions
);

// Other endpoints (these don't modify, so no session check needed)
router.get("/courses/:courseId", getExamsByCourse);
router.get("/templates/:format", downloadTemplate);

module.exports = router;
