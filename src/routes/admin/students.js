const express = require("express");
const router = express.Router();

const {
  createStudent,
  getAllStudents,
  bulkCreateStudents,
  getStudentsByDepartment,
  updateStudent,
  deleteStudent,
} = require("../../controllers/admin/students");

router.route("/").post(createStudent).get(getAllStudents);

router.post("/bulk", bulkCreateStudents);

router.get("/department/:deptId", getStudentsByDepartment);

router.route("/:id").patch(updateStudent).delete(deleteStudent);

module.exports = router;
