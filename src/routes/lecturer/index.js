const express = require("express");
const router = express.Router();

// Import separated route modules
const examRoutes = require("./exams");
const profileRoutes = require("./profile");
const resultRoutes = require("./results");
const courseRoutes = require("./courses");

// Mount routes with clear prefixes
router.use("/exams", examRoutes);
router.use("/profile", profileRoutes);
router.use("/results", resultRoutes);
router.use("/courses", courseRoutes);

module.exports = router;
