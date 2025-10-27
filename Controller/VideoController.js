const { Schema, model } = require("mongoose");
const Video = require("../Models/VideoModel");
const Section = require("../Models/SectionModel");
const Course = require("../Models/CourseModel");
const cloudinary = require("cloudinary").v2;
const { getVideoDurationInSeconds } = require("get-video-duration");

/* 🕐 Utility function to format seconds → HH:mm:ss */
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0
    ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    : `${m}:${s.toString().padStart(2, "0")}`;
}

/* --------------------------------
 🔵 VIDEO CONTROLLERS (FINAL VERSION)
---------------------------------- */

// ✅ Create a new video
const createVideo = async (req, res) => {
  try {
    const { title, description, courseId, sectionId, order, isPreview, videoUrl } = req.body;

    if (!courseId || !sectionId)
      return res.status(400).json({ message: "Both courseId and sectionId are required" });

    // Validate course & section
    const [course, section] = await Promise.all([
      Course.findById(courseId),
      Section.findById(sectionId),
    ]);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!section) return res.status(404).json({ message: "Section not found" });

    let finalVideoUrl, cloudinaryId, durationSeconds;

    // ✅ Case 1: Upload from file
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "courses/videos",
        resource_type: "video",
      });
      finalVideoUrl = uploadResult.secure_url;
      cloudinaryId = uploadResult.public_id;
      durationSeconds = Math.round(uploadResult.duration || 0);
    }

    // ✅ Case 2: Provided video URL
    else if (videoUrl) {
      finalVideoUrl = videoUrl;
      cloudinaryId = null;

      // Try to get metadata from Cloudinary
      const match = videoUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
      if (match) {
        try {
          const info = await cloudinary.api.resource(match[1], { resource_type: "video" });
          durationSeconds = Math.round(info.duration || 60);
        } catch {
          durationSeconds = 60;
        }
      } else {
        try {
          const seconds = await getVideoDurationInSeconds(videoUrl);
          durationSeconds = Math.round(seconds);
        } catch {
          durationSeconds = 60;
        }
      }
    } else {
      return res.status(400).json({ message: "Video file or videoUrl is required" });
    }

    // ✅ Convert duration to formatted string
    const formattedDuration = formatDuration(durationSeconds);

    // ✅ Create video
    const video = await Video.create({
      title,
      description,
      duration: formattedDuration,
      courseId,
      sectionId,
      order,
      isPreview: isPreview || false,
      videoUrl: finalVideoUrl,
      cloudinaryId,
    });

    res.status(201).json({
      message: "🎥 Video uploaded successfully",
      video,
    });
  } catch (err) {
    console.error("❌ Error uploading video:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ✅ Get all sections + videos for a course */
const getCourseContent = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId).select("title isPublished");
    if (!course) return res.status(404).json({ message: "Course not found" });

    const sections = await Section.find({ courseId }).sort({ order: 1 });

    const content = await Promise.all(
      sections.map(async (section) => {
        const videos = await Video.find({ sectionId: section._id })
          .sort({ order: 1 })
          .select("title description duration order isPreview videoUrl");
        return { sectionId: section._id, sectionTitle: section.title, videos };
      })
    );

    res.json({
      courseTitle: course.title,
      totalSections: sections.length,
      content,
    });
  } catch (err) {
    console.error("❌ Error fetching course content:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ✅ Update existing video */
const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, order, isPreview, sectionId, videoUrl } = req.body;

    const video = await Video.findById(id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    // ✅ Section update if provided
    if (sectionId) {
      const section = await Section.findById(sectionId);
      if (!section) return res.status(404).json({ message: "Section not found" });
      video.sectionId = sectionId;
    }

    let durationSeconds;

    // ✅ Case 1: New file upload
    if (req.file) {
      if (video.cloudinaryId) {
        await cloudinary.uploader.destroy(video.cloudinaryId, { resource_type: "video" });
      }

      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "courses/videos",
        resource_type: "video",
      });

      video.videoUrl = uploadResult.secure_url;
      video.cloudinaryId = uploadResult.public_id;
      durationSeconds = Math.round(uploadResult.duration || 0);
    }

    // ✅ Case 2: New video URL
    else if (videoUrl) {
      video.videoUrl = videoUrl;
      video.cloudinaryId = null;

      const match = videoUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
      if (match) {
        try {
          const info = await cloudinary.api.resource(match[1], { resource_type: "video" });
          durationSeconds = Math.round(info.duration || 60);
        } catch {
          durationSeconds = 60;
        }
      } else {
        try {
          const seconds = await getVideoDurationInSeconds(videoUrl);
          durationSeconds = Math.round(seconds);
        } catch {
          durationSeconds = 60;
        }
      }
    }

    // ✅ Apply duration + other updates
    if (durationSeconds > 0) {
      video.duration = formatDuration(durationSeconds);
    }
    if (title) video.title = title;
    if (description) video.description = description;
    if (order !== undefined) video.order = order;
    if (typeof isPreview !== "undefined") video.isPreview = isPreview;

    await video.save();
    res.json({ message: "✅ Video updated successfully", video });
  } catch (err) {
    console.error("❌ Error updating video:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ✅ Delete video */
const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findById(id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    if (video.cloudinaryId) {
      await cloudinary.uploader.destroy(video.cloudinaryId, { resource_type: "video" });
    }

    await video.deleteOne();
    res.json({ message: "🗑️ Video deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting video:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ✅ Toggle preview (true/false) */
const makeVideoPreview = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPreview } = req.body;

    const video = await Video.findById(id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    video.isPreview =
      typeof isPreview === "boolean" ? isPreview : !video.isPreview;

    await video.save();

    res.json({
      message: `Preview status set to ${video.isPreview}`,
      video,
    });
  } catch (err) {
    console.error("❌ Error updating preview:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ✅ Unlock all course videos (for paid user) */
const unlockAllVideosForUser = async (req, res) => {
  try {
    const { courseId } = req.params;

    const updated = await Video.updateMany(
      { courseId },
      { $set: { isPreview: true } }
    );

    res.json({
      message: "✅ All course videos unlocked successfully",
      updatedCount: updated.modifiedCount,
    });
  } catch (err) {
    console.error("❌ Error unlocking videos:", err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createVideo,
  getCourseContent,
  updateVideo,
  deleteVideo,
  makeVideoPreview,
  unlockAllVideosForUser,
};
