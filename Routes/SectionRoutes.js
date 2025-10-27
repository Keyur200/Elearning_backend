// routes/SectionRoutes.js
const express = require("express");
const router = express.Router();
const {
  createSection,
  getSectionsByCourse,
  getSectionById,
  updateSection,
  deleteSection,
} = require("../Controller/SectionController");
const { requireLogin } = require("../Middleware/authMiddleware");
const { isAdminOrInstructor } = require("../Middleware/roleMiddleware");

/* --------------------------------
 🟩 SECTION ROUTES
---------------------------------- */

// ✅ Create Section
router.post("/section", requireLogin, isAdminOrInstructor, createSection);

// ✅ Get All Sections by Course
router.get(
  "/course/sections/:courseId",
  requireLogin,
  isAdminOrInstructor,
  getSectionsByCourse
);

// ✅ Get Single Section
router.get(
  "/section/:id",
  requireLogin,
  isAdminOrInstructor,
  getSectionById
);

// ✅ Update Section
router.put("/section/:id", requireLogin, isAdminOrInstructor, updateSection);

// ✅ Delete Section
router.delete("/section/:id", requireLogin, isAdminOrInstructor, deleteSection);

module.exports = router;
