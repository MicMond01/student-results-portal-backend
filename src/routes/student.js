const express = require("express");
const router = express.Router();

const {
  getMyResults,
  getOwnProfile,
  updateOwnProfile,
  getMyCourses,
} = require("../controllers/student");

router.route("/results").get(getMyResults);
router.route("/courses").get(getMyCourses);
router.route("/profile").get(getOwnProfile).patch(updateOwnProfile);

module.exports = router;
