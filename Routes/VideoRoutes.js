const express = require("express");
const router = express.Router();
const {
  createVideo,
  getCourseContent,   // ✅ unified: fetch sections + videos
  updateVideo,
  deleteVideo,
  makeVideoPreview,
  unlockAllVideosForUser,
} = require("../Controller/VideoController");

const { uploadVideo } = require("../Config/Multer");
const { requireLogin } = require("../Middleware/authMiddleware");
const { isAdminOrInstructor } = require("../Middleware/roleMiddleware");

/* ------------------------------
 🔵 VIDEO ROUTES (Final Version)
------------------------------- */

// ✅ 1️⃣ Create a new video (Instructor/Admin only)
router.post(
  "/video",
  requireLogin,
  isAdminOrInstructor,
  uploadVideo.single("video"),
  createVideo
);

// ✅ 2️⃣ Get full course content (Sections + Videos)
//    → Used for instructor edit page OR student viewing
router.get(
  "/course/content/:courseId",
  requireLogin,
  getCourseContent
);

// ✅ 3️⃣ Update video details (Instructor/Admin)
router.put(
  "/video/:id",
  requireLogin,
  isAdminOrInstructor,
  uploadVideo.single("video"),
  updateVideo
);

// ✅ 4️⃣ Delete a video (Instructor/Admin)
router.delete(
  "/video/:id",
  requireLogin,
  isAdminOrInstructor,
  deleteVideo
);

// ✅ 5️⃣ Mark video as preview (publicly visible)
router.patch(
  "/video/preview/:id",
  requireLogin,
  isAdminOrInstructor,
  makeVideoPreview
);

// ✅ 6️⃣ Unlock all course videos (after user purchase)
router.patch(
  "/course/unlock/:courseId",
  requireLogin,
  unlockAllVideosForUser
);

module.exports = router;
