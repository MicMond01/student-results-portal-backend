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

const hashPasswords = async () => {
  await connectDB();

  try {
    // Find all lecturers with plain text passwords
    const lecturers = await User.find({ role: "lecturer" });
    
    console.log(`Found ${lecturers.length} lecturers to update`);

    for (const lecturer of lecturers) {
      // Check if password is already hashed (bcrypt hashes start with $2a$ or $2b$)
      if (!lecturer.password.startsWith("$2")) {
        const hashedPassword = await bcrypt.hash(lecturer.password, 10);
        lecturer.password = hashedPassword;
        await lecturer.save();
        console.log(`✅ Hashed password for ${lecturer.name}`);
      } else {
        console.log(`⏭️  Password already hashed for ${lecturer.name}`);
      }
    }

    console.log("\n✅ All lecturer passwords have been hashed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error hashing passwords:", error);
    process.exit(1);
  }
};

hashPasswords();