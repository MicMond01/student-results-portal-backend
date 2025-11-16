const express = require("express");
const router = express.Router();

const {
  createDepartment,
  getAllDepartments,
  getDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../../controllers/admin/department");

router.route("/").post(createDepartment).get(getAllDepartments);

router
  .route("/:id")
  .get(getDepartment)
  .patch(updateDepartment)
  .delete(deleteDepartment);

module.exports = router;
