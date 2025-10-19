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
} = require("../controllers/userController");

router.get("/lecturers", getAllLecturers);
router.get("/students", getAllStudents);

// Base user routes
router.route("/").get(getAllUsers).post(createNewUser); 

router
  .route("/:id")
  .get(getUser)
  .patch(updateUserDetails) 
  .delete(deleteUser);

module.exports = router;
