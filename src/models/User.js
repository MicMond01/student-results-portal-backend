const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const emailRegex =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const matricRegex = /^\d{11}$/;

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide name"],
      trim: true,
    },
    identifier: {
      type: String,
      required: [true, "Please provide identifier"],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please provide password"],
    },
    role: {
      type: String,
      enum: ["student", "lecturer", "admin"],
      required: true,
    },

    // ==================== STUDENT SPECIFIC FIELDS ====================
    matricNo: {
      type: String,
      sparse: true,
      trim: true,
      default: null,
    },
    faculty: {
      type: String,
      trim: true,
      default: null,
    },
    department: {
      type: String,
      trim: true,
      default: null,
    },
    level: {
      type: Number,
      enum: [100, 200, 300, 400, 500],
      default: null,
    },
    program: {
      type: String,
      trim: true,
      default: null,
    },
    admissionYear: {
      type: Number,
      default: null,
    },
    session: {
      type: String,
      match: [/^\d{4}\/\d{4}$/, "Invalid session format (e.g., 2024/2025)"],
      default: null,
    },
    academicAdvisor: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Graduated", "Suspended"],
      default: "Active",
    },
    school: {
      type: String,
      trim: true,
      default: null,
    },

    // ==================== PERSONAL INFORMATION ====================
    profilePhoto: {
      type: String,
      default: null,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    address: {
      type: String,
      trim: true,
      default: null,
    },
    placeOfBirth: {
      type: String,
      trim: true,
      default: null,
    },
    stateOfOrigin: {
      type: String,
      trim: true,
      default: null,
    },

    // ==================== VERIFICATION FIELDS ====================
    jambNo: {
      type: String,
      trim: true,
      default: null,
    },

    // ==================== LECTURER FIELDS ====================
    staffId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
    rank: {
      type: String,
      enum: [
        "Graduate Assistant",
        "Assistant Lecturer",
        "Lecturer II",
        "Lecturer I",
        "Senior Lecturer",
        "Associate Professor",
        "Professor",
        null,
      ],
      default: null,
    },
    specialization: {
      type: String,
      trim: true,
      default: null,
    },
    yearsOfExperience: {
      type: Number,
      min: 0,
      default: null,
    },
    officeLocation: {
      type: String,
      trim: true,
      default: null,
    },
    highestDegree: {
      type: String,
      trim: true,
      default: null,
    },
    institution: {
      type: String,
      trim: true,
      default: null,
    },

    // ==================== ACCOUNT STATUS ====================
    accountStatus: {
      type: String,
      enum: ["pending", "active", "suspended"],
      default: "pending",
    },
    isFirstLogin: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: Date,
    lastPasswordChange: Date,
    isUsingDefaultPassword: {
      type: Boolean,
      default: true,
    },
    previousPasswords: [
      {
        type: String,
      },
    ], // Store hashed passwords to prevent reuse

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    // For backward compatibility
    departmentName: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre("save", async function () {
  try {
    // Auto-detect role on creation
    if (this.isNew && !this.role) {
      if (this.identifier === process.env.ADMIN_SECRET) {
        this.role = "admin";
      } else if (matricRegex.test(this.identifier)) {
        this.role = "student";
      } else if (emailRegex.test(this.identifier)) {
        this.role = "lecturer";
      } else {
        const error = new Error(
          "Identifier must be a valid matric number or email"
        );
        return error;
      }
    }

    // Hash password if modified
    if (this.isModified("password")) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }

    return;
  } catch (error) {
    throw error;
  }
});

UserSchema.methods.createJWT = function () {
  return jwt.sign(
    { userId: this._id, name: this.name, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_LIFETIME }
  );
};

UserSchema.methods.comparePassword = async function (candidatePassword) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch;
};

// Check if password was used before
UserSchema.methods.wasPasswordUsedBefore = async function (newPassword) {
  if (!this.previousPasswords || this.previousPasswords.length === 0) {
    return false;
  }

  for (const oldHashedPassword of this.previousPasswords) {
    const isMatch = await bcrypt.compare(newPassword, oldHashedPassword);
    if (isMatch) return true;
  }

  return false;
};

module.exports = mongoose.model("User", UserSchema);
