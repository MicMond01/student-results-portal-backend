const express = require("express");
const router = express.Router();
const {
  login,
  loggedInUser,
  verifyIdentity,
  changePassword,
} = require("../../controllers/authController");

const authenticationMiddleware = require("../../middleware/authMiddleware");
const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many login attempts, please try again after 15 minutes",
    });
  },
});

// Step 1: Login
router.post("/login", loginLimiter, login);

// Step 2: Verify identity (protected - requires token from login)
router.post(
  "/verify-identity",
  authenticationMiddleware,
  verifyIdentity,
);

// Step 3: Change password (protected - requires token)
router.post(
  "/change-password",
  authenticationMiddleware,
  changePassword,
);

router.route("/myInfo").get(authenticationMiddleware, loggedInUser);
module.exports = router;
