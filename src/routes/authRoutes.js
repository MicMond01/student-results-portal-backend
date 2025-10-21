const express = require("express");
const router = express.Router();

const {
  register,
  login,
  loggedInUser,
} = require("../controllers/authController");
const authenticationMiddleware = require("../middleware/authMiddleware");

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/myInfo").get(authenticationMiddleware, loggedInUser);

module.exports = router;
