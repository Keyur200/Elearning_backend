const express = require('express');
const router = express.Router();
const { 
    getDashboardStats, 
    getDailySales, 
    getRevenueByCategory, 
    getRecentUsers,
    getInstructorStats,
    getInstructorDailySales,
    getInstructorCourseRevenue,
    getInstructorRecentStudents
} = require('../Controller/ReportController');

const { requireLogin } = require('../Middleware/authMiddleware');
const { isAdminOrInstructor } = require('../Middleware/roleMiddleware');

/* ----------------------------------------
   🟢 ADMIN DASHBOARD ROUTES
   (Global Data - usually protected by Admin middleware)
---------------------------------------- */
router.get("/stats", getDashboardStats);
router.get("/daily-sales", getDailySales);
router.get("/category-revenue", getRevenueByCategory);
router.get("/recent-users", getRecentUsers);

/* ----------------------------------------
   🟢 INSTRUCTOR DASHBOARD ROUTES
   (Requires Login: uses req.user._id to filter data)
---------------------------------------- */

// 1. Instructor Stats (Total Students, Lifetime Revenue, My Courses)
router.get(
    "/instructor/stats", 
    requireLogin, 
    isAdminOrInstructor, 
    getInstructorStats
);

// 2. Instructor Daily Sales Chart
router.get(
    "/instructor/daily-sales", 
    requireLogin, 
    isAdminOrInstructor, 
    getInstructorDailySales
);

// 3. Instructor Course Revenue Pie Chart
router.get(
    "/instructor/course-revenue", 
    requireLogin, 
    isAdminOrInstructor, 
    getInstructorCourseRevenue
);

// 4. Instructor Recent Student Enrollments Table
router.get(
    "/instructor/recent-students", 
    requireLogin, 
    isAdminOrInstructor, 
    getInstructorRecentStudents
);

module.exports = router;