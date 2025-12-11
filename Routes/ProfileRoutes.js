const express = require("express");
const router = express.Router();

const {
  createProfile,
  updateProfile,
  getProfileById,
  getProfilePublic
} = require("../Controller/ProfileController");

const { requireLogin } = require("../Middleware/authMiddleware");
const { uploadImage } = require("../Config/Multer"); // Multer for single img upload

// CREATE PROFILE  ---> expects form-data field: image
router.post(
  "/profile",
  requireLogin,
  uploadImage.single("image"),   // <-- field name must be 'image'
  createProfile
);

// UPDATE PROFILE  ---> expects form-data field: image
router.put(
  "/profile",
  requireLogin,
  uploadImage.single("image"),   // <-- same field name
  updateProfile
);

// GET PROFILE (logged in user)
router.get("/profile", requireLogin, getProfileById);

// PUBLIC PROFILE (with userId)
router.get("/profile/:userId", getProfilePublic);

module.exports = router;
