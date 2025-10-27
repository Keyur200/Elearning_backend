const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const User = require("./Models/UserModel");
const Role = require("./Models/RoleModel");

// 🔹 Routes
const UserRoute = require("./Routes/UserRoute");
const CourseRoute = require("./Routes/CourseRoute");
const VideoRoute = require("./Routes/VideoRoutes");
const SectionRoute = require("./Routes/SectionRoutes");
const categoryRoutes = require("./Routes/categoryRoutes");
const profileRoutes = require("./Routes/ProfileRoutes");

// 🔹 Initialize App
const app = express();
dotenv.config();

// 🔹 Middlewares
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// 🔹 MongoDB Connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err.message));

// 🔹 Route Registration
app.use("/auth", UserRoute);
app.use("/api", CourseRoute);
app.use("/api", VideoRoute);
app.use("/api", SectionRoute);
app.use("/api/categories", categoryRoutes);
app.use("/api", profileRoutes);

// 🔹 Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
