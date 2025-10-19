const express = require("express");
const router = express.Router();

const {
  getAllResultsUplodedByLecturer,
  getAllResultsForMyCourses,
  uploadResultForStudent,
  editStudentResult,
  deleteResult,
  viewCoursesAssignedToLecturer,
  viewOwnProfile,
  updateProfileInfo,
} = require("../controllers/lecturer");

router
  .route("/results")
  .get(getAllResultsUplodedByLecturer)
  .post(uploadResultForStudent);
router.route("/results/:id").patch(editStudentResult).delete(deleteResult);
router.route("/results/my-course").get(getAllResultsForMyCourses);
router.route("/courses").get(viewCoursesAssignedToLecturer);
router.route("/profile").get(viewOwnProfile).patch(updateProfileInfo);

module.exports = router;
