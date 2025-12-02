const express = require('express');
const router = express.Router();

const {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  publishCourse,
  getMyCourses,
  previewCourse,
  getAllPublishedCourses,
  userCourseDetails,
  deleteCourse,
  enrolledCourseDetails,
} = require('../Controller/CourseController');

const { uploadImage } = require('../Config/Multer');
const { requireLogin } = require('../Middleware/authMiddleware');
const { isAdminOrInstructor } = require('../Middleware/roleMiddleware');

/* ----------------------------------------
 🟢 COURSE ROUTES
---------------------------------------- */

// ✅ Create a new course
router.post(
  '/course',
  requireLogin,
  isAdminOrInstructor,
  uploadImage.single('thumbnail'),
  createCourse
);

// ✅ Get all courses (for admin/instructors)
router.get('/courses', getAllCourses);

// ✅ Get all published courses (for students)
router.get('/courses/published', getAllPublishedCourses);

// ✅ Get single course (basic details)
router.get('/course/:id', getCourseById);

// ✅ Update a course
router.put(
  '/course/:id',
  requireLogin,
  isAdminOrInstructor,
  uploadImage.single('thumbnail'),
  updateCourse
);

// ✅ Publish / Unpublish a course
router.patch(
  '/course/publish/:id',
  requireLogin,
  isAdminOrInstructor,
  publishCourse
);

// ✅ Get all instructor’s courses
router.get('/mycourses', requireLogin, isAdminOrInstructor, getMyCourses);

router.delete('/course/:id', requireLogin, isAdminOrInstructor, deleteCourse);

// ✅ Instructor/Admin preview of course (with sections & videos)
router.get('/courses/preview/:id', requireLogin, previewCourse);

// ✅ User course details (with restricted video access)
router.get('/courses/details/:id',  userCourseDetails);

router.get("/courses/enrolled/:id", requireLogin, enrolledCourseDetails);

module.exports = router;
