require("dotenv").config();
require("express-async-errors");

const express = require("express");
const app = express();
const adminRouter = require("./routes/admin/index");
const lecturerRouter = require("./routes/lecturer/index");
const authRouter = require("./routes/auth/authRoutes");
const studentRouter = require("./routes/student/student");
const authenticationMiddleware = require("./middleware/authMiddleware");
const {
  adminOnly,
  lecturerOrAdmin,
  studentOnly,
} = require("./middleware/authorizeRoles");

//extra security packages
// const helmet = require("helmet");
const cors = require("cors");
// const xss = require("xss-clean");
// const rateLimiter = require("express-rate-limit");
// const mongoSanitize = require("express-mongo-sanitize");
// const hpp = require("hpp");

// error handler
const notFoundMiddleware = require("./middleware/notFound");
const errorHandlerMiddleware = require("./middleware/errorHandler");

// app.set("trust proxy", 1);
// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'"],
//         styleSrc: ["'self'", "'unsafe-inline'"],
//       },
//     },
//   })
// );

const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
// app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// app.use(mongoSanitize);
// app.use(xss());
// app.use(hpp());

// const authLimiter = rateLimiter({
//   windowMs: 15 * 60 * 1000,
//   max: 5,
//   message: "Too many login attempts, please try again after 15 minutes",
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// const generalLimiter = rateLimiter({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   message: "Too many requests, please try again later",
//   standardHeaders: true,
//   legacyHeaders: false,
// });

const connectDB = require("./config/db");

// routes
app.use("/api/v1/test", (req, res) => {
  res.json({ data: "This is a test route and its working bro" });
});
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/admin", authenticationMiddleware, adminOnly, adminRouter);
app.use(
  "/api/v1/lecturer",
  authenticationMiddleware,
  lecturerOrAdmin,
  lecturerRouter
);
app.use(
  "/api/v1/student",
  authenticationMiddleware,
  studentOnly,
  studentRouter
);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔒 CORS origin: ${process.env.CORS_ORIGIN}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("👋 SIGINT received, shutting down gracefully");
  process.exit(0);
});

start();
