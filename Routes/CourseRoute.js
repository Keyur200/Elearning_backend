const express = require('express');
const router = express.Router();
const {
  // COURSE
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  publishCourse,
  getMyCourses,
  previewCourse,

  // VIDEO
  createVideo,
  getVideosByCourse,
  updateVideo,
  deleteVideo,
  makeVideoPreview,
  unlockAllVideosForUser
} = require('../Controller/CourseController');

const { uploadImage, uploadVideo } = require('../Config/Multer');
const { requireLogin } = require('../Middleware/authMiddleware');
const { isAdminOrInstructor } = require('../Middleware/roleMiddleware');

// ==================== COURSE ROUTES ====================

// Create a new course (Admin/Instructor)
router.post(
  "/course",
  requireLogin,
  isAdminOrInstructor,
  uploadImage.single('thumbnail'),
  createCourse
);

// Get all courses (Public)
router.get("/courses", getAllCourses);

// Get single course by ID (Public)
router.get("/course/:id", getCourseById);

// Update course by ID (Admin/Instructor)
router.put(
  "/course/:id",
  requireLogin,
  isAdminOrInstructor,
  uploadImage.single('thumbnail'),
  updateCourse
);

// Publish / Unpublish course (Admin/Instructor)
router.patch(
  "/coursepublish/:id",
  requireLogin,
  isAdminOrInstructor,
  publishCourse
);

// Get courses for logged-in instructor
router.get("/mycourses", requireLogin, isAdminOrInstructor, getMyCourses);

// Preview course videos (Public or Instructor)
router.get("/preview/:id", requireLogin, previewCourse);

// ==================== VIDEO ROUTES ====================

// Create a new video for a course (Admin/Instructor)
router.post(
  "/video",
  requireLogin,
  isAdminOrInstructor,
  uploadVideo.single('video'),
  createVideo
);

// Get all videos for a particular course (Admin/Instructor)
router.get(
  "/course/:courseId/videos",
  requireLogin,
  isAdminOrInstructor,
  getVideosByCourse
);

// Update a video by ID (Admin/Instructor)
router.put(
  "/video/:id",
  requireLogin,
  isAdminOrInstructor,
  uploadVideo.single('video'),
  updateVideo
);

// Delete a video by ID (Admin/Instructor)
router.delete(
  "/video/:id",
  requireLogin,
  isAdminOrInstructor,
  deleteVideo
);

// Make a single video preview (Admin/Instructor)
router.patch(
  "/video/:id/preview",
  requireLogin,
  isAdminOrInstructor,
  makeVideoPreview
);

// Unlock all videos of a course for a user after purchase (Internal/Server)
router.patch(
  "/course/:courseId/unlock",
  requireLogin,
  unlockAllVideosForUser
);

module.exports = router;
