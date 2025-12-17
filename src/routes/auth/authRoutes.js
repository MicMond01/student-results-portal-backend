const express = require("express");
const router = express.Router();
const {
  login,
  loggedInUser,
  verifyIdentity,
  changePassword,
} = require("../../controllers/authController");

const authenticationMiddleware = require("../../middleware/authMiddleware");

router.route("/myInfo").get(authenticationMiddleware, loggedInUser);

// Step 1: Login
router.post("/login", login);

// Step 2: Verify identity (protected - requires token from login)
router.post("/verify-identity", authenticationMiddleware, verifyIdentity);

// Step 3: Change password (protected - requires token)
router.post("/change-password", authenticationMiddleware, changePassword);

module.exports = router;
