const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  getUser,
  createNewUser,
  updateUserDetails,
  deleteUser,
  getAllLecturers,
  getAllStudents,
  addNewCourse,
  listAllCourse,
  updateACourse,
  deleteACourse,
} = require("../controllers/admin");

router.route("/users").get(getAllUsers).post(createNewUser);
router
  .route("/users/:id")
  .get(getUser)
  .patch(updateUserDetails)
  .delete(deleteUser);
router.route("/lecturers").get(getAllLecturers);
router.route("/students").get(getAllStudents);
router.route("/courses").post(addNewCourse).get(listAllCourse);
router.route("/courses/:id").patch(updateACourse).delete(deleteACourse);

module.exports = router;
