const mongoose = require("mongoose");

const EnrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    session: {
      type: String,
      required: true,
    },
    semester: {
      type: String,
      enum: ["First", "Second"],
      required: true,
    },
    level: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

EnrollmentSchema.index({ student: 1, course: 1, session: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", EnrollmentSchema);
