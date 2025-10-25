const Course = require("../Models/CourseModel");
const Video = require("../Models/VideoModel");
const cloudinary = require("cloudinary").v2;

/* --------------------------------
 🟢 COURSE CONTROLLERS
---------------------------------- */

// ✅ Create Course
// const createCourse = async (req, res) => {
//   try {
//     const {
//       title,
//       description,
//       categoryId,
//       price,
//       estimatedPrice,
//       tags,
//       level,
//       benefits,
//       instructorId,
//       thumbnailUrl,
//     } = req.body;

//     let finalThumbnail;
//     if (req.file) {
//       const uploadResult = await cloudinary.uploader.upload(req.file.path, {
//         folder: "courses/thumbnails",
//         resource_type: "image",
//       });
//       finalThumbnail = uploadResult.secure_url;
//     } else if (thumbnailUrl) {
//       finalThumbnail = thumbnailUrl;
//     } else {
//       return res
//         .status(400)
//         .json({ message: "Thumbnail is required (file or URL)" });
//     }

//     const course = new Course({
//       title,
//       description,
//       categoryId,
//       price,
//       estimatedPrice,
//       tags: tags ? tags.split(",") : [],
//       level,
//       benefits: benefits ? benefits.split(",") : [],
//       instructorId,
//       thumbnail: finalThumbnail,
//     });

//     await course.save();
//     res.status(201).json({ message: "Course created successfully", course });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
// ✅ Create Course (updated)
const createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      categoryId,
      price,
      estimatedPrice,
      tags,
      level,
      benefits,
      thumbnailUrl,
    } = req.body;

    // Assign instructorId from logged-in user (JWT)
    const instructorId = req.user?._id;
    if (!instructorId) {
      return res.status(401).json({ message: "Unauthorized: Instructor not found" });
    }

    // Handle thumbnail (file or URL)
    let finalThumbnail;
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "courses/thumbnails",
        resource_type: "image",
      });
      finalThumbnail = uploadResult.secure_url;
    } else if (thumbnailUrl) {
      finalThumbnail = thumbnailUrl;
    } else {
      return res
        .status(400)
        .json({ message: "Thumbnail is required (file or URL)" });
    }

    // Parse tags and benefits (ensure array)
    const tagsArray = tags
      ? typeof tags === "string"
        ? tags.split(",").map((t) => t.trim())
        : tags
      : [];
    const benefitsArray = benefits
      ? typeof benefits === "string"
        ? benefits.split(",").map((b) => b.trim())
        : benefits
      : [];

    const course = new Course({
      title,
      description,
      categoryId,
      price,
      estimatedPrice,
      tags: tagsArray,
      level,
      benefits: benefitsArray,
      instructorId,
      thumbnail: finalThumbnail,
    });

    await course.save();
    res.status(201).json({ message: "Course created successfully", course });
  } catch (err) {
    console.error("Error creating course:", err.message);
    res.status(500).json({ message: err.message });
  }
};


// ✅ Get All Courses
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("categoryId", "name")
      .populate("instructorId", "name email");
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get Single Course by ID
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("categoryId", "name")
      .populate("instructorId", "name email");

    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Update Course
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      categoryId,
      price,
      estimatedPrice,
      tags,
      level,
      benefits,
      thumbnailUrl,
    } = req.body;

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Handle thumbnail update
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "courses/thumbnails",
        resource_type: "image",
      });
      course.thumbnail = uploadResult.secure_url;
    } else if (thumbnailUrl) {
      course.thumbnail = thumbnailUrl;
    }

    // Update course details
    course.title = title || course.title;
    course.description = description || course.description;
    course.categoryId = categoryId || course.categoryId;
    course.price = price || course.price;
    course.estimatedPrice = estimatedPrice || course.estimatedPrice;
    course.tags = tags ? tags.split(",") : course.tags;
    course.level = level || course.level;
    course.benefits = benefits ? benefits.split(",") : course.benefits;

    await course.save();
    res.json({ message: "Course updated successfully", course });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Publish / Unpublish Course
const publishCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    course.isPublished = isPublished;
    await course.save();

    res.json({
      message: `Course ${isPublished ? "published" : "unpublished"} successfully`,
      course,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get Instructor's Courses
const getMyCourses = async (req, res) => {
  try {
    const instructorId = req.user._id;
    const courses = await Course.find({ instructorId })
      .populate("categoryId", "name")
      .populate("instructorId", "name email");

    res.json({ courses });
  } catch (err) {
    console.error("Error fetching instructor courses:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Preview Course (show videos including previews)
const previewCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id)
      .populate("categoryId", "name")
      .populate("instructorId", "name email");

    if (!course) return res.status(404).json({ message: "Course not found" });

    const videos = await Video.find({ courseId: id }).sort({ order: 1 });

    res.json({ course, videos });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: err.message });
  }
};

const getAllPublishedCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true }) 
      .populate("categoryId", "name")
      .populate("instructorId", "name email");

    if (!courses) return res.status(404).json({ message: "Course not found" });

    return res.json(courses);
  }catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* --------------------------------
 🔵 VIDEO CONTROLLERS
---------------------------------- */

// ✅ Create Video (file or URL)
const createVideo = async (req, res) => {
  try {
    const { title, description, duration, courseId, order, isPreview, videoUrl } =
      req.body;

    let finalVideoUrl;
    let cloudinaryId;

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "courses/videos",
        resource_type: "video",
      });
      finalVideoUrl = uploadResult.secure_url;
      cloudinaryId = uploadResult.public_id;
    } else if (videoUrl) {
      finalVideoUrl = videoUrl;
      cloudinaryId = null;
    } else {
      return res
        .status(400)
        .json({ message: "Video is required (file or URL)" });
    }

    const video = new Video({
      title,
      description,
      duration,
      courseId,
      order,
      isPreview,
      videoUrl: finalVideoUrl,
      cloudinaryId,
    });

    await video.save();
    res.status(201).json({ message: "Video uploaded successfully", video });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get All Videos for a Specific Course
const getVideosByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId).select("title");
    if (!course)
      return res.status(404).json({ message: "Course not found" });

    const videos = await Video.find({ courseId })
      .sort({ order: 1 })
      .select("title description duration order isPreview videoUrl");

    res.json({
      courseTitle: course.title,
      totalVideos: videos.length,
      videos,
    });
  } catch (err) {
    console.error("Error fetching videos:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Update Video
const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, duration, order, isPreview, videoUrl } = req.body;

    const video = await Video.findById(id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    // Handle video file update
    if (req.file) {
      if (video.cloudinaryId) {
        await cloudinary.uploader.destroy(video.cloudinaryId, {
          resource_type: "video",
        });
      }
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "courses/videos",
        resource_type: "video",
      });
      video.videoUrl = uploadResult.secure_url;
      video.cloudinaryId = uploadResult.public_id;
    } else if (videoUrl) {
      video.videoUrl = videoUrl;
      video.cloudinaryId = null;
    }

    // Update details
    video.title = title || video.title;
    video.description = description || video.description;
    video.duration = duration || video.duration;
    video.order = order || video.order;
    video.isPreview = isPreview !== undefined ? isPreview : video.isPreview;

    await video.save();
    res.json({ message: "Video updated successfully", video });
  } catch (err) {
    console.error("Error updating video:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Delete Video
const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    if (video.cloudinaryId) {
      await cloudinary.uploader.destroy(video.cloudinaryId, {
        resource_type: "video",
      });
    }

    await video.deleteOne();
    res.json({ message: "Video deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Make All Videos Preview True (After Course Purchase)
const unlockAllVideosForUser = async (req, res) => {
  try {
    const { courseId } = req.params;

    const updated = await Video.updateMany(
      { courseId },
      { $set: { isPreview: true } }
    );

    res.json({
      message: "All course videos unlocked for user successfully",
      updatedCount: updated.modifiedCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Make a Single Video Preview (Intro Video)
const makeVideoPreview = async (req, res) => {
  try {
    const { id } = req.params; // Video ID

    const video = await Video.findById(id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    video.isPreview = true;
    await video.save();

    res.json({ message: "Video marked as preview successfully", video });
  } catch (err) {
    console.error("Error marking video as preview:", err.message);
    res.status(500).json({ message: err.message });
  }
};


module.exports = {
  // COURSE
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  publishCourse,
  getMyCourses,
  previewCourse,
  getAllPublishedCourses,

  // VIDEO
  createVideo,
  getVideosByCourse,
  updateVideo,
  deleteVideo,
  unlockAllVideosForUser,
  makeVideoPreview, 
};
