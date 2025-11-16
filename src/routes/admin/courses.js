const express = require("express");
const router = express.Router();

const {
  createCourse,
  getAllCourses,
  getCoursesByDepartment,
  updateCourse,
  deleteCourse,
} = require("../../controllers/admin/courses");

router.route("/").post(createCourse).get(getAllCourses);

router.get("/department/:deptId", getCoursesByDepartment);

router.route("/:id").patch(updateCourse).delete(deleteCourse);

module.exports = router;
