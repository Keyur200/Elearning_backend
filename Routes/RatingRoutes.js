const express = require('express');
const { getRatingsByCourse,createRatings, getAverage } = require('../Controller/RatingController');

const router = express.Router();

router.post("/rating/:courseId/:userId", createRatings)
router.get("/rating/course/:courseId", getRatingsByCourse)
router.get("/rating/average/:courseId", getAverage)
module.exports = router