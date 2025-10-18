require("dotenv").config();
require("express-async-errors");

const express = require("express");
const app = express();
const authRouter = require("./routes/authRoutes");
const adminRouter = require("./routes/admin");
const lecturerRouter = require("./routes/lecturer");
const studentRouter = require("./routes/student");
const authenticationMiddleware = require("./middleware/authMiddleware");
const {
  adminOnly,
  lecturerOrAdmin,
  studentOnly,
} = require("./middleware/authorizeRoles");

//extra security packages
// const helmet = require("helmet");
// const cors = require("cors");
// const xss = require("xss-clean");
// const rateLimiter = require("express-rate-limit");

// error handler
const notFoundMiddleware = require("./middleware/notFound");
const errorHandlerMiddleware = require("./middleware/errorHandler");

// app.set("trust proxy", 1);
// app.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }));

app.use(express.json());
// app.use(helmet());
// app.use(cors());
// app.use(xss());
// extra packages

const connectDB = require("./config/db");

app.get("/", (req, res) => {
  res.send("Admin dashbaord");
});
// routes
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
    app.listen(port, console.log(`Server is listening on port ${port}...`));
  } catch (error) {
    console.log(error);
  }
};

start();
