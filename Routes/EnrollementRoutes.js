const express = require("express");
const { requireLogin } = require('../Middleware/authMiddleware');
const { isAdminOrInstructor } = require('../Middleware/roleMiddleware');

const {
    UserAccess,
    GetEnrolledCourse,
    AddVideoReview,
    ReplyToReview,
    GetMyEnrollments,
    MarkVideoComplete,
    GetCourseWithAllUser,
    GetInstructorCourseWithUsers,
    GetInstructorReviews // <--- Import the new controller
} = require("../Controller/EnrollmentController");

const router = express.Router();

/**
 * -----------------------------------------------
 * ENROLLMENT / COURSE ACCESS ROUTES
 * -----------------------------------------------
 */

// ✔ Check if user has access to a course
router.get("/course/:id/access", requireLogin, UserAccess);

// ✔ Get enrolled course details
router.get("/course/:id/enrolled", requireLogin, GetEnrolledCourse);

// ✔ Mark a video as completed
router.post("/video/:videoId/complete", requireLogin, MarkVideoComplete);

/**
 * -----------------------------------------------
 * VIDEO REVIEWS / COMMENTS (FAQ)
 * -----------------------------------------------
 */

// ✔ Add a new review/comment to a video
router.post("/video/:videoId/review", requireLogin, AddVideoReview);

// ✔ Instructor replies to student's review
router.post("/review/:reviewId/reply", requireLogin, ReplyToReview);

// ✔ 🟢 NEW: Get all reviews for the instructor's dashboard
router.get("/instructor/reviews", requireLogin, GetInstructorReviews);


router.get("/my/enrollments", requireLogin, GetMyEnrollments);
router.get("/courses/enrollments", GetCourseWithAllUser);
router.get("/inst/:id/courses/enrollments", GetInstructorCourseWithUsers);

module.exports = router;