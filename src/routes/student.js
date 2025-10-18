const express = require("express");
const router = express.Router();

const {
  getLoggedInStudentResults,
  getOwnProfile,
  updateProfile,
} = require("../controllers/student");

router.route("/results").get(getLoggedInStudentResults);
router.route("/profile").get(getOwnProfile).patch(updateProfile);

module.exports = router;
