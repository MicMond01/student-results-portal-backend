const express = require("express");
const router = express.Router();

const { register, login, me } = require("../controllers/authController");

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/me").post(me);

module.exports = router;
