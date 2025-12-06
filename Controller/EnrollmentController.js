const Enrollment = require("../Models/EnrollmentModel.js");
const Course = require("../Models/CourseModel.js");
const Video = require("../Models/VideoModel.js");
const Section = require("../Models/SectionModel.js");
const VideoReview = require("../Models/VideoReviewModel.js");
const Profile = require("../Models/ProfileModel.js");

const { CreateNotification } = require("../services/NotificationService");

// -----------------------------
// Check User Access
// -----------------------------
exports.UserAccess = async (req, res) => {
  try {
    const userId = req.user._id;
    const courseId = req.params.id;

    const enrolled = await Enrollment.findOne({ userId, courseId });
    return res.json({ access: !!enrolled });
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
};

// -----------------------------
// Get Enrolled Course with Sections & Videos
// -----------------------------
exports.GetEnrolledCourse = async (req, res) => {
  try {
    const userId = req.user._id;
    const courseId = req.params.id;

    const enrolled = await Enrollment.findOne({ userId, courseId });
    if (!enrolled)
      return res.status(403).json({ message: "User not enrolled!" });

    const course = await Course.findById(courseId)
      .populate("instructorId", "name avatar");

    // Fetch instructor profile image
    const instructorProfile = await Profile.findOne({
      userId: course.instructorId._id,
    });

    const videos = await Video.find({ courseId }).sort({ order: 1 });
    const sections = await Section.find({ courseId }).sort({ order: 1 });

    const sectionVideos = await Promise.all(
      sections.map(async (section) => {
        const vids = await Promise.all(
          videos
            .filter(v => v.sectionId?.toString() === section._id.toString())
            .map(async (v) => {

              const reviews = await VideoReview.find({ videoId: v._id })
                .populate("userId", "name avatar") 
                .sort({ createdAt: -1 });

              // Add profile image to all reviewers
              const reviewsWithProfile = await Promise.all(
                reviews.map(async (r) => {
                  const profile = await Profile.findOne({ userId: r.userId?._id });

                  return {
                    _id: r._id,
                    comment: r.comment,
                    reply: r.reply,
                    resolved: r.resolved,
                    createdAt: r.createdAt,
                    user: {
                      _id: r.userId?._id,
                      name: r.userId?.name,
                      avatar: r.userId?.avatar,
                      profileImage: profile?.image || null,  // ⭐ NEW
                    }
                  };
                })
              );

              return {
                _id: v._id,
                title: v.title,
                description: v.description,
                videoUrl: v.videoUrl,
                duration: v.duration,
                order: v.order,
                isPreview: v.isPreview,
                reviews: reviewsWithProfile,
              };
            })
        );

        return {
          _id: section._id,
          title: section.title,
          videos: vids
        };
      })
    );

    // -------------------------
    // ⭐ Unassigned Videos Updated
    // -------------------------
    const unassigned = await Promise.all(
      videos
        .filter(v => !v.sectionId)
        .map(async (v) => {

          const reviews = await VideoReview.find({ videoId: v._id })
            .populate("userId", "name avatar")
            .sort({ createdAt: -1 });

          const reviewsWithProfile = await Promise.all(
            reviews.map(async (r) => {
              const profile = await Profile.findOne({ userId: r.userId?._id });

              return {
                _id: r._id,
                comment: r.comment,
                reply: r.reply,
                resolved: r.resolved,
                createdAt: r.createdAt,
                user: {
                  _id: r.userId?._id,
                  name: r.userId?.name,
                  avatar: r.userId?.avatar,
                  profileImage: profile?.image || null, 
                }
              };
            })
          );

          return {
            _id: v._id,
            title: v.title,
            description: v.description,
            videoUrl: v.videoUrl,
            duration: v.duration,
            order: v.order,
            isPreview: v.isPreview,
            reviews: reviewsWithProfile,
          };
        })
    );

    if (unassigned.length > 0) {
      sectionVideos.push({
        _id: null,
        title: "General",
        videos: unassigned
      });
    }

    const totalVideos = videos.length;
    const watchedVideos = Math.floor((enrolled.progress / 100) * totalVideos);

    res.json({
      message: "Enrolled course fetched",
      course: {
        ...course._doc,
        instructorProfileImage: instructorProfile?.image || null  // ⭐ NEW
      },
      sections: sectionVideos,
      progress: {
        percentage: enrolled.progress,
        watchedVideos,
        totalVideos
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", err });
  }
};
// -----------------------------
// Mark Video as Complete & Update Progress
// -----------------------------
exports.MarkVideoComplete = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user._id;

    const video = await Video.findById(videoId);
    if (!video) return res.status(404).json({ message: "Video not found" });

    const enrollment = await Enrollment.findOne({ userId, courseId: video.courseId });
    if (!enrollment) return res.status(403).json({ message: "User not enrolled!" });

    // Initialize if empty
    if (!enrollment.completedVideos) enrollment.completedVideos = [];

    // Convert ObjectIds to strings
    const completedSet = enrollment.completedVideos.map(v => v.toString());

    // Add only once
    if (!completedSet.includes(videoId.toString())) {
      enrollment.completedVideos.push(videoId.toString());
    }

    // Recalculate progress
    const totalVideos = await Video.countDocuments({ courseId: video.courseId });
    const completedCount = enrollment.completedVideos.length;

    enrollment.progress = Math.round((completedCount / totalVideos) * 100);
    enrollment.isComplete = completedCount === totalVideos;

    await enrollment.save();

    res.json({
      message: "Video marked as complete",
      progress: {
        percentage: enrollment.progress,
        completedVideos: completedCount,
        totalVideos,
        isComplete: enrollment.isComplete
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", err });
  }
};

// -----------------------------
// Add Video Review
// -----------------------------
exports.AddVideoReview = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user._id;
    const { comment } = req.body;

    if (!comment) return res.status(400).json({ message: "Comment is required!" });

    const video = await Video.findById(videoId);
    if (!video) return res.status(404).json({ message: "Video not found!" });

    const course = await Course.findById(video.courseId);

    const review = await VideoReview.create({ videoId, userId, comment });

    await CreateNotification({
      userId: course.instructorId,
      type: "video_comment",
      referenceId: review._id,
      message: `New comment on your video: ${comment}`,
      forRole: "instructor",
    });

    res.json({ message: "Review added", review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", err });
  }
};

// -----------------------------
// Reply to Video Review
// -----------------------------
exports.ReplyToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reply } = req.body;

    const review = await VideoReview.findById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found!" });

    review.reply = reply;
    review.resolved = true;
    await review.save();

    await CreateNotification({
      userId: review.userId,
      type: "review_reply",
      referenceId: review._id,
      message: `Instructor replied to your comment: "${reply}"`,
      forRole: "user",
    });

    res.json({
      message: "Reply added & student notified",
      review,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", err });
  }
};

// -----------------------------
// Get All Enrollments of User
// -----------------------------
exports.GetMyEnrollments = async (req, res) => {
  try {
    const userId = req.user._id;

    const enrollments = await Enrollment.find({ userId })
      .populate("courseId", "title thumbnail price level")
      .sort({ enrollDate: -1 });

    res.json({
      success: true,
      totalCourses: enrollments.length,
      enrolledCourses: enrollments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error fetching enrolled courses",
    });
  }
};


exports.GetCourseWithAllUser = async (req, res) => {
    try {
        // Get all courses
        const courses = await Course.find({});

        const result = [];

        for (const course of courses) {

            // find all enrollments for this course
            const enrollments = await Enrollment.find({ courseId: course._id })
                .populate("userId", "name email") // populate user name + email
                .exec();

            const enrolledUsers = enrollments.map(e => e.userId);

            result.push({
                courseId: course._id,
                courseName: course.title,
                enrolledCount: enrolledUsers.length,
                enrolledUsers
            });
        }

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

exports.GetInstructorCourseWithUsers = async (req, res) => {
    try {
        const instructorId = req.params.id; 
        
        // Get courses created by this instructor
        const courses = await Course.find({ instructorId });
        console.log(instructorId)
        const result = [];

        for (const course of courses) {

            // Get all enrollments for this course  
            const enrollments = await Enrollment.find({ courseId: course._id })
                .populate("userId", "name email")     // user info
                .populate("completedVideos", "title") // video titles (optional)
                .exec();

            // Shape response data
            const enrolledUsers = enrollments.map(e => ({
                userId: e.userId._id,
                name: e.userId.name,
                email: e.userId.email,
                enrollDate: e.enrollDate,
                progress: e.progress,
                isComplete: e.isComplete,
                completedVideos: e.completedVideos
            }));

            result.push({
                courseId: course._id,
                courseName: course.title,
                thumbnail: course.thumbnail,
                enrolledCount: enrolledUsers.length,
                enrolledUsers
            });
        }

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
