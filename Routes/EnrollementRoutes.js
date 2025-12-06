const express = require("express");
const { requireLogin } = require('../Middleware/authMiddleware');

const {
    UserAccess,
    GetEnrolledCourse,
    AddVideoReview,
    ReplyToReview,
    GetMyEnrollments,
    MarkVideoComplete,  // <-- new function
    GetCourseWithAllUser,
    GetInstructorCourseWithUsers
} = require("../Controller/EnrollmentController");

const router = express.Router();

/**
 * -----------------------------------------------
 * ENROLLMENT / COURSE ACCESS ROUTES
 * -----------------------------------------------
 */

// ✔ Check if user has access to a course
router.get("/course/:id/access", requireLogin, UserAccess);

// ✔ Get enrolled course details (sections + videos + progress)
router.get("/course/:id/enrolled", requireLogin, GetEnrolledCourse);

// ✔ Mark a video as completed and update progress
router.post("/video/:videoId/complete", requireLogin, MarkVideoComplete);

/**
 * -----------------------------------------------
 * VIDEO REVIEWS / COMMENTS
 * -----------------------------------------------
 */

// ✔ Add a new review/comment to a video
router.post("/video/:videoId/review", requireLogin, AddVideoReview);

// ✔ Instructor replies to student's review
router.post("/review/:reviewId/reply", requireLogin, ReplyToReview);


router.get("/my/enrollments", requireLogin, GetMyEnrollments);

router.get("/courses/enrollments", GetCourseWithAllUser)
router.get("/inst/:id/courses/enrollments", GetInstructorCourseWithUsers)

module.exports = router;
