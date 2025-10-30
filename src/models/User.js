const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { required } = require("joi");

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
    department: {
      type: String,
      trim: true,
    },

    // ==================== PERSONAL INFORMATION ====================
    profilePhoto: {
      type: String,
      default: null,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: null,
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
    address: {
      type: String,
      trim: true,
      default: null,
    },

    // ==================== ACADEMIC/PROFESSIONAL INFO (Lecturers) ====================
    staffId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      default: null,
    },
    faculty: {
      type: String,
      trim: true,
      default: null,
    },
    school: {
      type: String,
      trim: true,
      default: null,
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
  },
  {
    timestamps: true,
  }
);

UserSchema.pre("save", async function (next) {
  try {
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
        return next(error);
      }
    }

    if (this.isModified("password")) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }

    next();
  } catch (error) {
    next(error);
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

module.exports = mongoose.model("User", UserSchema);
