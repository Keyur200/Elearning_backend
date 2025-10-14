const express = require("express");
const router = express.Router();
const { createProfile, updateProfile, getProfileById } = require("../Controller/ProfileController");
const { requireLogin } = require("../Middleware/authMiddleware");
const { uploadImage } = require("../Config/Multer"); // Multer + Cloudinary

// Create Profile
router.post("/profile", requireLogin, uploadImage.single('image'), createProfile);

// Update Profile
router.put("/profile", requireLogin, uploadImage.single('image'), updateProfile);

// Get Profile
router.get("/profile", requireLogin, getProfileById);

module.exports = router;
