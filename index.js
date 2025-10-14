const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./Models/UserModel");
const Role = require("./Models/RoleModel");
const UserRoute = require("./Routes/UserRoute");
const CourseRoute = require("./Routes/CourseRoute");
const categoryRoutes = require("./Routes/categoryRoutes");
const profileRoutes = require("./Routes/ProfileRoutes");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();
dotenv.config();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.use("/auth/", UserRoute);
app.use("/api/", CourseRoute);
app.use('/api/categories', categoryRoutes);
app.use('/api/', profileRoutes);

app.listen(5000, () => console.log("Port connected on 5000"));
