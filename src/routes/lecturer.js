const express = require("express");
const router = express.Router();

const {
  getAllResultsUplodedByLecturer,
  getAllResultsForMyCourses,
  uploadResultForStudent,
  editStudentResult,
  deleteResult,
  viewCoursesAssignedToLecturer,
  getMyCoursesAnalytics,
  viewOwnProfile,
  updateProfileInfo,
  getResultWithStudentInfo,
} = require("../controllers/lecturer");
const { canModifyResult } = require("../middleware/resourceAuthorization");

router
  .route("/results")
  .get(getAllResultsUplodedByLecturer)
  .post(uploadResultForStudent);
router
  .route("/results/:id")
  .get(getResultWithStudentInfo)
  .patch(canModifyResult, editStudentResult)
  .delete(canModifyResult, deleteResult);
router.route("/course-results").get(getAllResultsForMyCourses);
router.route("/courses").get(viewCoursesAssignedToLecturer);
router.route("/profile").get(viewOwnProfile).patch(updateProfileInfo);
router.route("/analytics").get(getMyCoursesAnalytics);

module.exports = router;
