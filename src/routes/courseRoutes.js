const express = require("express");
const router = express.Router();

const {
  addNewCourse,
  listAllCourse,
  getCourse,
  updateACourse,
  deleteACourse,
} = require("../controllers/courseController");

router.route("/").post(addNewCourse).get(listAllCourse);

router.route("/:id").get(getCourse).patch(updateACourse).delete(deleteACourse);

module.exports = router;
