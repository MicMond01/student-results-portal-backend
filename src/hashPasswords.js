require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("DB connection failed", err);
    process.exit(1);
  }
};

const resetLecturerPasswords = async () => {
  await connectDB();

  try {
    // Find all lecturers first
    const lecturers = await User.find({ role: "lecturer" });
    console.log(`Found ${lecturers.length} lecturers`);

    // Hash the password once
    const hashedPassword = await bcrypt.hash("123456", 10);
    console.log("Hashed password:", hashedPassword);
    
    // Update all lecturers with the properly hashed password
    const result = await User.updateMany(
      { role: "lecturer" },
      { $set: { password: hashedPassword } }
    );

    console.log("Update result:", result);
    console.log(`✅ Updated ${result.matchedCount || result.n} lecturer passwords`);
    
    // Verify one lecturer
    const testLecturer = await User.findOne({ role: "lecturer" });
    console.log("\nTest lecturer password:", testLecturer.password);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

resetLecturerPasswords();

