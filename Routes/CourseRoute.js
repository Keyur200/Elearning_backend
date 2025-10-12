const express = require('express');
const router = express.Router();
const {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  publishCourse,
  createVideo,
  deleteVideo,
  previewCourse
} = require('../Controller/CourseController');

const { uploadImage, uploadVideo } = require('../Config/Multer');
const { requireLogin } = require('../Middleware/authMiddleware');
const { isAdminOrInstructor } = require('../Middleware/roleMiddleware');

// Only Admin or Instructor can create a course
router.post("/course", requireLogin, isAdminOrInstructor, uploadImage.single('thumbnail'), createCourse);

// Anyone can get all courses
router.get("/courses", getAllCourses);

// Anyone can get single course
router.get("/course/:id", getCourseById);

// Only Admin or Instructor can update a course
router.put("/course/:id", requireLogin, isAdminOrInstructor, uploadImage.single('thumbnail'), updateCourse);

// Only Admin or Instructor can publish/unpublish
router.patch("/coursepublish/:id", requireLogin, isAdminOrInstructor, publishCourse);

// ================== VIDEO ROUTES ==================

// Only Admin or Instructor can add video
router.post("/video", requireLogin, isAdminOrInstructor, uploadVideo.single('video'), createVideo);

// Only Admin or Instructor can delete video
router.delete("/video/:id", requireLogin, isAdminOrInstructor, deleteVideo);

// ================== PREVIEW ROUTE ==================

// Anyone can preview published course
router.get("/preview/:id", previewCourse);

module.exports = router;
