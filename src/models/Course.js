const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide course title"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Please provide course code"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    creditUnit: {
      type: Number,
      required: [true, "Please provide credit unit"],
      min: 1,
      max: 6,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Please provide department"],
    },
    lecturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please assign a lecturer"],
    },
    level: {
      type: Number,
      enum: [100, 200, 300, 400, 500],
      required: [true, "Please provide course level"],
    },
    semester: {
      type: String,
      enum: ["First", "Second"],
      required: [true, "Please provide semester"],
    },
    session: {
      type: String,
      required: [true, "Please provide session"],
      match: [/^\d{4}\/\d{4}$/, "Invalid session format (e.g., 2024/2025)"],
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    description: {
      type: String,
      trim: true,
      default: null,
    },
    courseType: {
      type: String,
      enum: ["Core", "Elective", "General"],
      default: "Core",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    maxStudents: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
CourseSchema.index({ department: 1, level: 1, semester: 1 });
CourseSchema.index({ lecturer: 1, session: 1 });
CourseSchema.index({ session: 1, semester: 1, level: 1 });

module.exports = mongoose.model("Course", CourseSchema);
