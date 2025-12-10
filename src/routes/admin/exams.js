const express = require("express");
const router = express.Router();
const {
  getAllExams,
  updateExam,
  deleteExam,
} = require("../../controllers/admin/exams");

router.get("/", getAllExams);
router.route("/:id").patch(updateExam).delete(deleteExam);
router.route("/:id/toggle-status").patch(updateExam)

module.exports = router;
