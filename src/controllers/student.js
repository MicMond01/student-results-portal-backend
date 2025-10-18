const getLoggedInStudentResults = (req, res) => {
  res.send("Get all Results");
};

const getOwnProfile = (req, res) => {
  res.send("Get own profile");
};

const updateProfile = (req, res) => {
  res.send("Update profile");
};

module.exports = {
  getLoggedInStudentResults,
  getOwnProfile,
  updateProfile,
};
