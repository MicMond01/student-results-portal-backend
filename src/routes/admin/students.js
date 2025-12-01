const express = require("express");
const router = express.Router();

const {
  createStudent,
  getAllStudents,
  bulkCreateStudents,
  getStudentsByDepartment,
  updateStudent,
  deleteStudent,
  getStudentDetails,
  getStudentUploadTemplate,
} = require("../../controllers/admin/students");
const upload = require("../../middleware/fileUpload");

router.route("/").post(createStudent).get(getAllStudents);

router.post("/bulk", upload.single("file"), bulkCreateStudents);

router.get("/department/:deptId", getStudentsByDepartment);
router.get("/template/:format", getStudentUploadTemplate);

router
  .route("/:id")
  .get(getStudentDetails)
  .patch(updateStudent)
  .delete(deleteStudent);

module.exports = router;
