const Enrollment = require("../Models/EnrollmentModel.js");
const Course = require("../Models/CourseModel.js");
const Video = require("../Models/VideoModel.js");
const Section = require("../Models/SectionModel.js");
const VideoReview = require("../Models/VideoReviewModel.js");

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

    const course = await Course.findById(courseId).populate("instructorId");

    const videos = await Video.find({ courseId }).sort({ order: 1 });
    const sections = await Section.find({ courseId }).sort({ order: 1 });

    const sectionVideos = sections.map(section => {
      const vids = videos
        .filter(v => v.sectionId?.toString() === section._id.toString())
        .map(v => ({
          _id: v._id,
          title: v.title,
          description: v.description,
          videoUrl: v.videoUrl,
          duration: v.duration,
          order: v.order,
          isPreview: v.isPreview
        }));

      return {
        _id: section._id,
        title: section.title,
        videos: vids
      };
    });

    const unassignedVideos = videos
      .filter(v => !v.sectionId)
      .map(v => ({
        _id: v._id,
        title: v.title,
        description: v.description,
        videoUrl: v.videoUrl,
        duration: v.duration,
        order: v.order,
        isPreview: v.isPreview
      }));

    if (unassignedVideos.length > 0) {
      sectionVideos.push({
        _id: null,
        title: "General",
        videos: unassignedVideos
      });
    }

    const totalVideos = videos.length;
    const watchedVideos = Math.floor((enrolled.progress / 100) * totalVideos);

    res.json({
      message: "Enrolled course fetched",
      course,
      sections: sectionVideos,
      progress: {
        percentage: enrolled.progress, // <-- use enrolled, not enrollment
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

    // Initialize completedVideos array if missing
    if (!enrollment.completedVideos) enrollment.completedVideos = [];

    // Add video to completedVideos if not already
    if (!enrollment.completedVideos.includes(videoId.toString())) {
      enrollment.completedVideos.push(videoId.toString());

      // Update progress percentage
      const totalVideos = await Video.countDocuments({ courseId: video.courseId });
      const completedCount = enrollment.completedVideos.length;
      enrollment.progress = Math.round((completedCount / totalVideos) * 100);

      // Mark course complete if all videos watched
      enrollment.isComplete = completedCount === totalVideos;

      await enrollment.save();
    }

    res.json({
      message: "Video marked as complete",
      progress: {
        percentage: enrollment.progress,
        completedVideos: enrollment.completedVideos.length,
        totalVideos: await Video.countDocuments({ courseId: video.courseId }),
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
      message: `New comment on your video: ${video.title}`,
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
