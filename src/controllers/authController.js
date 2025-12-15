const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const { BadRequestError, UnauthenticatedError } = require("../errors");

// ==================== STAGE 1: LOGIN ====================
const login = async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    throw new BadRequestError("Please provide identifier and password");
  }

  const user = await User.findOne({ identifier });

  if (!user) {
    throw new UnauthenticatedError("Invalid credentials");
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError("Invalid credentials");
  }

  if (user.accountStatus === "suspended") {
    throw new UnauthenticatedError(
      "Your account has been suspended. Contact admin."
    );
  }

  const token = user.createJWT();

  const isStudentOrLecturer =
    user.role === "student" || user.role === "lecturer";

  let nextStep = "dashboard";

  if (isStudentOrLecturer) {
    if (!user.isVerified) {
      nextStep = "verification";
    } else if (user.isUsingDefaultPassword) {
      nextStep = "change-password";
    } else if (user.isFirstLogin) {
      nextStep = "dashboard";
      user.isFirstLogin = false;
      await user.save();
    }
  }

  res.status(StatusCodes.OK).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      identifier: user.identifier,
      role: user.role,
      accountStatus: user.accountStatus,
    },
    nextStep,
    requiresVerification: !user.isVerified && isStudentOrLecturer,
    requiresPasswordChange: user.isUsingDefaultPassword && isStudentOrLecturer,
  });
};

// ==================== STAGE 2: VERIFY IDENTITY ====================
const verifyIdentity = async (req, res) => {
  const userId = req.user.userId;
  const { dateOfBirth, phone, jambNo, staffId } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    throw new UnauthenticatedError("User not found");
  }

  if (user.isVerified) {
    throw new BadRequestError("Account already verified");
  }

  const isStudentOrLecturer =
    user.role === "student" || user.role === "lecturer";

  const normalizeDate = (d) => new Date(d).toISOString().split("T")[0];
  const normalizePhone = (p) => p.replace(/\s/g, "");
  const normalize = (s) => (s || "").trim();

  if (!dateOfBirth || !phone) {
    throw new BadRequestError("Please provide date of birth and phone number");
  }

  const dobMatch = normalizeDate(user.dateOfBirth) === dateOfBirth;
  const phoneMatch = normalizePhone(user.phone) === normalizePhone(phone);

  if (!dobMatch || !phoneMatch) {
    throw new BadRequestError(
      "Verification failed. Your personal details do not match our records."
    );
  }

  if (user.role === "student") {
    if (!jambNo) throw new BadRequestError("Please provide your JAMB number");
    const jambMatch = normalize(jambNo) === normalize(user.jambNo);
    if (!jambMatch)
      throw new BadRequestError(
        "Verification failed. JAMB number does not match our records."
      );
  }

  if (user.role === "lecturer") {
    if (!staffId) throw new BadRequestError("Please provide your Staff ID");
    const staffMatch = normalize(staffId) === normalize(user.staffId);
    if (!staffMatch)
      throw new BadRequestError(
        "Verification failed. Staff ID does not match our records."
      );
  }

  user.isVerified = true;
  user.accountStatus = "active";
  user.verifiedAt = new Date();
  await user.save();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Identity verified successfully",
    nextStep: user.isUsingDefaultPassword ? "change-password" : "dashboard",
    requiresPasswordChange: user.isUsingDefaultPassword && isStudentOrLecturer,
  });
};

// ==================== STAGE 3: CHANGE PASSWORD ====================
const changePassword = async (req, res) => {
  const userId = req.user.userId;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new BadRequestError("Please provide all required fields");
  }

  if (newPassword !== confirmPassword) {
    throw new BadRequestError("New passwords do not match");
  }

  if (newPassword.length < 6) {
    throw new BadRequestError("Password must be at least 6 characters");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new UnauthenticatedError("User not found");
  }

  if (!user.isVerified && user.role === "student") {
    throw new BadRequestError("Please verify your identity first");
  }

  // ✅ Verify current password
  const isPasswordCorrect = await user.comparePassword(currentPassword);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError("Current password is incorrect");
  }

  // ✅ Check if new password is same as current
  const isSameAsCurrent = await user.comparePassword(newPassword);
  if (isSameAsCurrent) {
    throw new BadRequestError(
      "New password cannot be the same as current password"
    );
  }

  // ✅ Check if password was used before
  const wasUsedBefore = await user.wasPasswordUsedBefore(newPassword);
  if (wasUsedBefore) {
    throw new BadRequestError(
      "You cannot reuse a previous password. Please choose a different one."
    );
  }

  // ✅ Store current password in history before changing
  user.previousPasswords = user.previousPasswords || [];
  user.previousPasswords.push(user.password); // Already hashed

  // Keep only last 5 passwords
  if (user.previousPasswords.length > 5) {
    user.previousPasswords.shift();
  }

  // ✅ Update password
  user.password = newPassword; // Will be hashed by pre-save hook
  user.isUsingDefaultPassword = false;
  user.isFirstLogin = false;
  user.lastPasswordChange = new Date();
  await user.save();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Password changed successfully. You can now access your account.",
    nextStep: "dashboard",
  });
};

const loggedInUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password -__v");

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: "User not found" });
    }

    // Send only relevant user info
    res.status(StatusCodes.OK).json({
      user: {
        id: user._id,
        name: user.name,
        identifier: user.identifier,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Something went wrong" });
  }
};

module.exports = {
  login,
  verifyIdentity,
  changePassword,
  loggedInUser,
};
