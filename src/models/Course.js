const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
      minlength: [3, "Course title must be at least 3 characters long"],
    },

    code: {
      type: String,
      required: [true, "Course code is required"],
      unique: true,
      uppercase: true,
      match: [/^[A-Z]{3}\d{3}$/, "Invalid course code format (e.g., CSC101)"],
    },

    // The lecturer or instructor assigned to the course
    lecturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Lecturer is required"],
    },

    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
      default: "Department of Computing",
    },

    level: {
      type: Number,
      required: [true, "Level is required"],
      enum: [100, 200, 300, 400, 500],
    },

    creditUnit: {
      type: Number,
      required: [true, "Credit unit is required"],
      min: [1, "Credit unit must be at least 1"],
      max: [6, "Credit unit cannot exceed 6"],
    },

    // List of students registered for this course
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    semester: {
      type: String,
      required: [true, "Semester is required"],
      enum: ["First", "Second"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    session: {
      type: String,
      required: [true, "Session is required"],
      match: [/^\d{4}\/\d{4}$/, "Invalid session format (e.g., 2024/2025)"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", CourseSchema);
