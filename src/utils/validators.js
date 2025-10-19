const emailRegex =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const matricRegex = /^\d{11}$/;
const courseCodeRegex = /^[A-Z]{3}\d{3}$/;
const sessionRegex = /^\d{4}\/\d{4}$/;

const isValidEmail = (email) => emailRegex.test(email);
const isValidMatric = (matric) => matricRegex.test(matric);
const isValidCourseCode = (code) => courseCodeRegex.test(code);
const isValidSession = (session) => sessionRegex.test(session);

const validateIdentifierForRole = (identifier, role) => {
  if (isValidMatric(identifier) && role !== "student") {
    throw new Error("Matric numbers can only be assigned to students.");
  }

  if (isValidEmail(identifier) && role !== "lecturer") {
    throw new Error("Email identifiers can only be assigned to lecturers.");
  }

  if (!isValidMatric(identifier) && !isValidEmail(identifier)) {
    throw new Error(
      "Identifier must be a valid matric number (11 digits) or email."
    );
  }
};

module.exports = {
  isValidEmail,
  isValidMatric,
  isValidCourseCode,
  isValidSession,
  validateIdentifierForRole,
};
