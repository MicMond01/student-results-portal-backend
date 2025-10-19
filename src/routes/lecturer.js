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
const { canModifyResult } = require("../middleware/resourceAuthorization");

router
  .route("/results")
  .get(getAllResultsUplodedByLecturer)
  .post(uploadResultForStudent);
router
  .route("/results/:id")
  .patch(canModifyResult, editStudentResult)
  .delete(canModifyResult, deleteResult);
router.route("/results/my-course").get(getAllResultsForMyCourses);
router.route("/courses").get(viewCoursesAssignedToLecturer);
router.route("/profile").get(viewOwnProfile).patch(updateProfileInfo);

module.exports = router;
