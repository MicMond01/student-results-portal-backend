const express = require("express");
const router = express.Router();

const {
  viewOwnProfile,
  updateProfileInfo,
  updateProfilePhoto,
  changePassword,
} = require("../../controllers/lecturer/lecturer");

router.route("/").get(viewOwnProfile).patch(updateProfileInfo);

router.patch("/photo", updateProfilePhoto);
router.patch("/change-password", changePassword);

module.exports = router;
