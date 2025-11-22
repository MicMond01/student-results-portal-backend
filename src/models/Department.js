const mongoose = require("mongoose");

const DepartmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide department name"],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Please provide department code"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    faculty: {
      type: String,
      required: [true, "Please provide faculty name"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    hod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    hodName: {
      type: String,
      trim: true,
      default: null,
    },
    hodEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    officeLocation: {
      type: String,
      trim: true,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

DepartmentSchema.index({ faculty: 1, isActive: 1 });

module.exports = mongoose.model("Department", DepartmentSchema);
