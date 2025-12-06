const express = require('express');
const { createOrder, getTotalRevenue, getCourseWiseRevenue, getInstructorTotalRevenue, getInstructorCourseWiseRevenue } = require('../Controller/OrderController');
const router = express.Router();

router.post("/createorder", createOrder)
router.get("/total-revenue", getTotalRevenue)
router.get("/course-revenue", getCourseWiseRevenue)
router.get("/instructor/total-revenue/:id", getInstructorTotalRevenue)
router.get("/instructor/course-revenue/:id", getInstructorCourseWiseRevenue)
module.exports = router

