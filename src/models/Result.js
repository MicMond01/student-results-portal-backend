const mongoose = require("mongoose");

const ResultSchema = new mongoose.Schema(
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
    ca: {
      type: Number,
      required: true,
      min: 0,
      max: 40,
    },
    exam: {
      type: Number,
      required: true,
      min: 0,
      max: 60,
    },
    total: {
      type: Number,
      min: 0,
      max: 100,
    },
    grade: {
      type: String,
      enum: ["A", "B", "C", "D", "E", "F"],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Automatically calculate total & grade before saving
ResultSchema.pre("save", async function () {
  this.total = this.ca + this.exam;

  if (this.total >= 70) this.grade = "A";
  else if (this.total >= 60) this.grade = "B";
  else if (this.total >= 50) this.grade = "C";
  else if (this.total >= 45) this.grade = "D";
  else if (this.total >= 40) this.grade = "E";
  else this.grade = "F";

  // next();
});

ResultSchema.index({ student: 1, course: 1, session: 1 }, { unique: true });

module.exports = mongoose.model("Result", ResultSchema);
