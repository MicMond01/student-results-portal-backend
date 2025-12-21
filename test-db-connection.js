// test-db-connection.js
require("dotenv").config(); // Loads .env file

const mongoose = require("mongoose");

const mongoUri = process.env.MONGO_URI

if (!mongoUri) {
  console.error("❌ MONGO_URI is not defined in .env file");
  process.exit(1);
}
console.log()

console.log("Attempting to connect to MongoDB...");
// console.log("URI (hidden password):", mongoUri.replace(/:([^:@]{1,})@/, ":****@"));

mongoose
  .connect(mongoUri, {
    // These options are recommended for newer MongoDB drivers
    // useNewUrlParser: true,     // deprecated
    // useUnifiedTopology: true, // deprecated
  })
  .then(() => {
    console.log("✅ Successfully connected to MongoDB!");
    console.log("Database name:", mongoose.connection.db.databaseName);
    mongoose.connection.close(); // Close after successful connection
  })
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB");
    console.error("Error:", err.message);

    // Extra helpful info if it's a URI parse error
    // if (err.message.includes("URI malformed")) {
    //   console.error("\n💡 Tip: Your password likely contains special characters (like @).");
    //   console.error("   Make sure the @ in the password is URL-encoded as %40");
    //   console.error("   Example: password@123 → password%40123");
    // }

    process.exit(1);
  });