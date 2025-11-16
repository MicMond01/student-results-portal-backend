const mongoose = require("mongoose");

const AcademicSessionSchema = new mongoose.Schema(
  {
    session: {
      type: String,
      required: true,
      unique: true,
      match: [/^\d{4}\/\d{4}$/, "Invalid session format (e.g., 2024/2025)"],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AcademicSession", AcademicSessionSchema);
