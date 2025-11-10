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
} = require("../../controllers/lecturerExamController");

// Get lecturer's courses (for creating exams)
// router.get("/courses", getMyCourses);

// Main exam routes (lecturer-specific)
router
  .route("/")
  .get(getMyExams) // Get only MY exams
  .post(createExam); // Create exam for MY course

router
  .route("/:id")
  .get(getExam) // Get exam (if the lecturer own the course)
  .patch(updateExam) // Update exam (if the lecturer own the course)
  .delete(deleteExam); // Delete exam (if the lecturer own the course)

// Question management (lecturer-specific)
router.post("/:id/questions", addQuestion);
router.patch("/:examId/questions/:questionId", updateQuestion);
router.delete("/:examId/questions/:questionId", deleteQuestion);

// Get exams by course (only lecturer's courses)
router.get("/courses/:courseId", getExamsByCourse);

// Bulk upload questions
router.post(
  "/:examId/questions/bulk",
  upload.single("file"),
  bulkUploadQuestions
);

// Download templates
router.get("/templates/:format", downloadTemplate);

module.exports = router;
