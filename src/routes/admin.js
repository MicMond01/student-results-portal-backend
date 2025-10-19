const express = require("express");
const router = express.Router();

const userRoutes = require("./userRoutes");
const courseRoutes = require("./courseRoutes");
const resultRoutes = require("./resultRoutes");

// Mount sub-routers
router.use("/users", userRoutes);
router.use("/courses", courseRoutes);
router.use("/results", resultRoutes);

module.exports = router;
