const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  questionType: {
    type: String,
    enum: ["objective", "theory"],
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  marks: {
    type: Number,
    required: true,
    min: 1,
  },
  // For objective questions
  options: {
    type: [String],
    validate: {
      validator: function(v) {
        return this.questionType === "objective" ? v.length >= 2 : true;
      },
      message: "Objective questions must have at least 2 options",
    },
  },
  correctAnswer: {
    type: String,
    required: function() {
      return this.questionType === "objective";
    },
  },
  // For theory questions (optional model answer)
  modelAnswer: {
    type: String,
  },
});

const ExamSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    examType: {
      type: String,
      enum: ["objective", "theory", "mixed"],
      required: true,
    },
    duration: {
      type: Number, // in minutes
      required: true,
      min: 30,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    passingMarks: {
      type: Number,
      required: true,
    },
    instructions: {
      type: String,
      default: "Read all questions carefully before answering.",
    },
    questions: [QuestionSchema],
    session: {
      type: String,
      required: true,
      match: [/^\d{4}\/\d{4}$/, "Invalid session format (e.g., 2024/2025)"],
    },
    semester: {
      type: String,
      enum: ["First", "Second"],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Index for faster queries
ExamSchema.index({ course: 1, session: 1, semester: 1 });

module.exports = mongoose.model("Exam", ExamSchema);