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

router.post("/course", requireLogin, isAdminOrInstructor, uploadImage.single('thumbnail'), createCourse);

router.get("/courses", getAllCourses);

router.get("/course/:id", getCourseById);

router.put("/course/:id", requireLogin, isAdminOrInstructor, uploadImage.single('thumbnail'), updateCourse);

router.patch("/coursepublish/:id", requireLogin, isAdminOrInstructor, publishCourse);

router.post("/video", requireLogin, isAdminOrInstructor, uploadVideo.single('video'), createVideo);

router.delete("/video/:id", requireLogin, isAdminOrInstructor, deleteVideo);


router.get("/preview/:id", previewCourse);

module.exports = router;
