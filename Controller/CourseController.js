const Course = require('../Models/CourseModel');
const Video = require('../Models/VideoModel');
const cloudinary = require('cloudinary').v2;

// ✅ Create Course
const createCourse = async (req, res) => {
  try {
    const { title, description, categoryId, price, estimatedPrice, tags, level, benefits, instructorId, thumbnailUrl } = req.body;

    let finalThumbnail;
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "courses/thumbnails",
        resource_type: "image"
      });
      finalThumbnail = uploadResult.secure_url;
    } else if (thumbnailUrl) {
      finalThumbnail = thumbnailUrl;
    } else {
      return res.status(400).json({ message: "Thumbnail is required (file or URL)" });
    }

    const course = new Course({
      title,
      description,
      categoryId,
      price,
      estimatedPrice,
      tags: tags ? tags.split(',') : [],
      level,
      benefits: benefits ? benefits.split(',') : [],
      instructorId,
      thumbnail: finalThumbnail
    });

    await course.save();
    res.status(201).json({ message: "Course created successfully", course });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get All Courses
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('categoryId', 'name')
      .populate('instructorId', 'name email');
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get Single Course
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('categoryId', 'name')
      .populate('instructorId', 'name email');

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
    const { title, description, categoryId, price, estimatedPrice, tags, level, benefits, thumbnailUrl } = req.body;

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "courses/thumbnails",
        resource_type: "image"
      });
      course.thumbnail = uploadResult.secure_url;
    } else if (thumbnailUrl) {
      course.thumbnail = thumbnailUrl;
    }

    course.title = title || course.title;
    course.description = description || course.description;
    course.categoryId = categoryId || course.categoryId;
    course.price = price || course.price;
    course.estimatedPrice = estimatedPrice || course.estimatedPrice;
    course.tags = tags ? tags.split(',') : course.tags;
    course.level = level || course.level;
    course.benefits = benefits ? benefits.split(',') : course.benefits;

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
      course
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Create Video (file or URL)
const createVideo = async (req, res) => {
  try {
    const { title, description, duration, courseId, order, isPreview, videoUrl } = req.body;

    let finalVideoUrl;
    let cloudinaryId;

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "courses/videos",
        resource_type: "video"
      });
      finalVideoUrl = uploadResult.secure_url;
      cloudinaryId = uploadResult.public_id;
    } else if (videoUrl) {
      finalVideoUrl = videoUrl;
      cloudinaryId = null;
    } else {
      return res.status(400).json({ message: "Video is required (file or URL)" });
    }

    const video = new Video({
      title,
      description,
      duration,
      courseId,
      order,
      isPreview,
      videoUrl: finalVideoUrl,
      cloudinaryId
    });

    await video.save();
    res.status(201).json({ message: "Video uploaded successfully", video });

  } catch (err) {
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
      await cloudinary.uploader.destroy(video.cloudinaryId, { resource_type: "video" });
    }

    await video.deleteOne();
    res.json({ message: "Video deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Preview Course - fetch all videos regardless of isPreview and optionally show unpublished if instructor
const previewCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id)
      .populate('categoryId', 'name')
      .populate('instructorId', 'name email');

    if (!course) return res.status(404).json({ message: "Course not found" });

    const videos = await Video.find({ courseId: id }).sort({ order: 1 });

    res.json({ course, videos });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get courses for logged-in instructor
const getMyCourses = async (req, res) => {
  try {
    const instructorId = req.user._id; // from requireLogin middleware
    const courses = await Course.find({ instructorId })
      .populate('categoryId', 'name')
      .populate('instructorId', 'name email');

    res.json({ courses });
  } catch (err) {
    console.error("Error fetching instructor courses:", err.message);
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

    // If a new file is uploaded, replace the old video in Cloudinary
    if (req.file) {
      if (video.cloudinaryId) {
        await cloudinary.uploader.destroy(video.cloudinaryId, { resource_type: "video" });
      }
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "courses/videos",
        resource_type: "video"
      });
      video.videoUrl = uploadResult.secure_url;
      video.cloudinaryId = uploadResult.public_id;
    } else if (videoUrl) {
      // Update video URL if provided
      video.videoUrl = videoUrl;
      video.cloudinaryId = null;
    }

    // Update other fields
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

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  publishCourse,
  createVideo,
  deleteVideo,
  previewCourse,
  getMyCourses,
  updateVideo
};
