const express = require("express");
const router = express.Router();

// Import separated route modules
const academicSession = require("./academicSession");
const courses = require("./courses");
const department = require("./department");
const lecturers = require("./lecturers");
const results = require("./results");
const statistics = require("./statistics");
const students = require("./students");
const exams = require("./exams");

// Mount routes with clear prefixes
router.use("/sessions", academicSession);
router.use("/courses", courses);
router.use("/departments", department);
router.use("/lecturers", lecturers);
router.use("/results", results);
router.use("/dashboard", statistics);
router.use("/students", students);
router.use("/exams", exams);

module.exports = router;

module.exports = router;
