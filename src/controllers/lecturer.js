const getAllResultsUplodedByLecturer = (req, res) => {
  res.send("Get all results uploaded by this lecturer");
};
const uploadResultForStudent = (req, res) => {
  res.send("Upload result for a student");
};
const editStudentResult = (req, res) => {
  res.send("Edit a student’s result");
};
const deleteResult = (req, res) => {
  res.send("Delete a result");
};
const viewCoursesAssignedToLecturer = (req, res) => {
  res.send("View courses assigned to lecturer");
};
const viewOwnProfile = (req, res) => {
  res.send("View own profile");
};
const updateProfileInfo = (req, res) => {
  res.send("Update profile info");
};

module.exports = {
  getAllResultsUplodedByLecturer,
  uploadResultForStudent,
  editStudentResult,
  deleteResult,
  viewCoursesAssignedToLecturer,
  viewOwnProfile,
  updateProfileInfo,
};
