const express = require('express');
const router = express.Router();
const {createCourse, createVideo, deleteVideo, publishCourse} = require('../Controller/CourseController')
const {uploadImage, uploadVideo} = require('../Config/Multer')

router.post("/course", uploadImage.single('thumbnail'), createCourse)
router.post("/video", uploadVideo.single('video'), createVideo)
router.delete("/deletevideo/:id", deleteVideo)
router.patch("/coursepublish/:id", publishCourse)

module.exports = router;