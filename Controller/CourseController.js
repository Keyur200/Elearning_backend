const Course = require("../Models/CourseModel");
const Video = require("../Models/VideoModel");
const Section = require("../Models/SectionModel");
const Order = require("../Models/OrderModel");
const Enrollment = require("../Models/EnrollmentModel");
const cloudinary = require("cloudinary").v2;
const Notification = require("../Models/NotificationModel");

/* --------------------------------
 🟢 COURSE CONTROLLERS
---------------------------------- */

// ✅ Create Course
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

    const instructorId = req.user?._id;
    if (!instructorId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Instructor not found" });
    }

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

    const tagsArray = Array.isArray(tags)
      ? tags
      : tags?.split(",").map((t) => t.trim()) || [];

    const benefitsArray = Array.isArray(benefits)
      ? benefits
      : benefits?.split(",").map((b) => b.trim()) || [];

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

    /* --------------------------------------------------
     🔔 CREATE ADMIN NOTIFICATION (NO SOCKET.IO)
    -------------------------------------------------- */
    await Notification.create({
      userId: instructorId,
      type: "course_created",
      referenceId: course._id,
      message: `A new course was added: ${course.title}`,
      forRole: "admin",
      isRead: false,
    });

    res.status(201).json({
      message: "Course created successfully & admin notified",
      course,
    });
  } catch (err) {
    console.error("Error creating course:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/* --------------------------------
 🟢 Get All Courses (Detailed)
---------------------------------- */
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("categoryId", "name")
      .populate("instructorId", "name email");

    if (!courses.length) {
      return res.status(404).json({ message: "No courses found" });
    }

    const detailedCourses = await Promise.all(
      courses.map(async (course) => {
        const sections = await Section.find({ courseId: course._id }).sort({
          order: 1,
        });

        const totalSections = sections.length;
        let totalVideos = 0;
        let totalDurationSeconds = 0;

        for (const section of sections) {
          const videos = await Video.find({ sectionId: section._id }).sort({
            order: 1,
          });
          totalVideos += videos.length;

          videos.forEach((video) => {
            const d = video.duration;
            if (typeof d === "number") {
              totalDurationSeconds += d;
            } else if (typeof d === "string") {
              const parts = d.split(":").map(Number);
              if (parts.length === 3) {
                totalDurationSeconds +=
                  parts[0] * 3600 + parts[1] * 60 + parts[2];
              } else if (parts.length === 2) {
                totalDurationSeconds += parts[0] * 60 + parts[1];
              } else {
                totalDurationSeconds += parseInt(d) || 0;
              }
            }
          });
        }

        const formatDuration = (seconds) => {
          const h = Math.floor(seconds / 3600);
          const m = Math.floor((seconds % 3600) / 60);
          return h > 0 ? `${h}h ${m}m` : `${m}m`;
        };

        return {
          ...course.toObject(),
          totalSections,
          totalVideos,
          totalDuration: formatDuration(totalDurationSeconds),
        };
      })
    );

    res.json({ courses: detailedCourses });
  } catch (err) {
    console.error("❌ Error fetching all courses:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/* --------------------------------
 🟢 Get Course by ID
---------------------------------- */
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

/* --------------------------------
 🟢 Update Course
---------------------------------- */
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

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "courses/thumbnails",
        resource_type: "image",
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
    course.tags = tags ? tags.split(",") : course.tags;
    course.level = level || course.level;
    course.benefits = benefits ? benefits.split(",") : course.benefits;

    await course.save();
    res.json({ message: "Course updated successfully", course });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* --------------------------------
 🟢 Publish / Unpublish Course
---------------------------------- */
const publishCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    course.isPublished = isPublished;
    await course.save();

    res.json({
      message: `Course ${
        isPublished ? "published" : "unpublished"
      } successfully`,
      course,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* --------------------------------
 🟢 Delete Course (with Sections & Videos)
---------------------------------- */
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Find and delete sections & videos
    const sections = await Section.find({ courseId: id });
    for (const section of sections) {
      await Video.deleteMany({ sectionId: section._id });
    }

    await Section.deleteMany({ courseId: id });
    await Course.findByIdAndDelete(id);

    res.json({ message: "Course and all related data deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting course:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/* --------------------------------
 🟢 Instructor's Courses
---------------------------------- */
const getMyCourses = async (req, res) => {
  try {
    const instructorId = req.user._id;

    const courses = await Course.find({ instructorId })
      .populate("categoryId", "name")
      .populate("instructorId", "name email");

    if (!courses.length) {
      return res
        .status(404)
        .json({ message: "No courses found for this instructor" });
    }

    const detailedCourses = await Promise.all(
      courses.map(async (course) => {
        const sections = await Section.find({ courseId: course._id }).sort({
          order: 1,
        });

        const totalSections = sections.length;
        let totalVideos = 0;
        let totalDurationSeconds = 0;

        for (const section of sections) {
          const videos = await Video.find({ sectionId: section._id }).sort({
            order: 1,
          });
          totalVideos += videos.length;

          videos.forEach((video) => {
            const d = video.duration;
            if (typeof d === "number") {
              totalDurationSeconds += d;
            } else if (typeof d === "string") {
              const parts = d.split(":").map(Number);
              if (parts.length === 3) {
                totalDurationSeconds +=
                  parts[0] * 3600 + parts[1] * 60 + parts[2];
              } else if (parts.length === 2) {
                totalDurationSeconds += parts[0] * 60 + parts[1];
              } else {
                totalDurationSeconds += parseInt(d) || 0;
              }
            }
          });
        }

        const formatDuration = (seconds) => {
          const h = Math.floor(seconds / 3600);
          const m = Math.floor((seconds % 3600) / 60);
          return h > 0 ? `${h}h ${m}m` : `${m}m`;
        };

        return {
          ...course.toObject(),
          totalSections,
          totalVideos,
          totalDuration: formatDuration(totalDurationSeconds),
        };
      })
    );

    res.json({ courses: detailedCourses });
  } catch (err) {
    console.error("❌ Error fetching instructor courses:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/* --------------------------------
 🟢 Preview Course
---------------------------------- */
const previewCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id)
      .populate("categoryId", "name")
      .populate("instructorId", "name email");

    if (!course) return res.status(404).json({ message: "Course not found" });

    const sections = await Section.find({ courseId: id }).sort({ order: 1 });

    const sectionData = await Promise.all(
      sections.map(async (section) => {
        const videos = await Video.find({ sectionId: section._id }).sort({
          order: 1,
        });
        return { ...section.toObject(), videos };
      })
    );

    res.json({ course, sections: sectionData });
  } catch (err) {
    console.error("Error fetching preview course:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/* --------------------------------
🟢 User Course Details (For Learners)
---------------------------------- */
const userCourseDetails = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const userId = req.user?._id;

    const course = await Course.findById(courseId)
      .populate("categoryId", "name")
      .populate("instructorId", "name email");

    if (!course) return res.status(404).json({ message: "Course not found" });

    const isEnrolled = await Enrollment.findOne({ userId, courseId });

    const sections = await Section.find({ courseId }).sort({ order: 1 });

    let totalVideos = 0;
    let totalDurationSeconds = 0;

    const sectionData = await Promise.all(
      sections.map(async (section) => {
        const videos = await Video.find({ sectionId: section._id }).sort({
          order: 1,
        });

        const visibleVideos = videos.map((v) => {
          // COUNT ALL VIDEOS
          totalVideos += 1;

          // Parse duration for ALL videos
          let durationSec = 0;
          if (typeof v.duration === "number") {
            durationSec = v.duration;
          } else if (typeof v.duration === "string") {
            const parts = v.duration.split(":").map(Number);
            if (parts.length === 3) {
              durationSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
            } else if (parts.length === 2) {
              durationSec = parts[0] * 60 + parts[1];
            } else {
              durationSec = parseInt(v.duration) || 0;
            }
          }

          // Add to total course duration
          totalDurationSeconds += durationSec;

          // ACCESS LOGIC (unchanged)
          if (isEnrolled || v.isPreview) {
            return { ...v.toObject() };
          } else {
            return {
              _id: v._id,
              title: v.title,
              duration: v.duration,
              isPreview: v.isPreview,
              locked: true,
              message: "Purchase required to access this video",
            };
          }
        });

        return { ...section.toObject(), videos: visibleVideos };
      })
    );

    // Format total duration
    const formatDuration = (seconds) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      if (h > 0) return `${h}h ${m}m`;
      if (m > 0) return `${m}m ${s}s`;
      return `${s}s`;
    };

    res.json({
      course,
      purchased: !!isEnrolled,
      sections: sectionData,
      totalSections: sections.length,
      totalVideos,
      totalDuration: formatDuration(totalDurationSeconds),
    });
  } catch (err) {
    console.error("Error fetching user course details:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/* --------------------------------
 🟢 Get All Published Courses
---------------------------------- */
const getAllPublishedCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .populate("categoryId", "name")
      .populate("instructorId", "name email");

    if (!courses.length)
      return res.status(404).json({ message: "No published courses found" });

    return res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ----------------------------------------------------
 🟢 Get Full Course Only For Enrolled Users
---------------------------------------------------- */
const enrolledCourseDetails = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const userId = req.user?._id; // must come from auth middleware

    // Check enrollment
    const isEnrolled = await Enrollment.findOne({ userId, courseId });

    if (!isEnrolled) {
      return res.status(403).json({
        message: "You must purchase this course to access full content.",
      });
    }

    // Fetch course
    const course = await Course.findById(courseId)
      .populate("categoryId", "name")
      .populate("instructorId", "name email");

    if (!course) return res.status(404).json({ message: "Course not found" });

    // Fetch all sections
    const sections = await Section.find({ courseId }).sort({ order: 1 });

    // Fetch all videos without locking ANY
    const sectionData = await Promise.all(
      sections.map(async (section) => {
        const videos = await Video.find({ sectionId: section._id }).sort({
          order: 1,
        });

        return { ...section.toObject(), videos };
      })
    );

    res.json({
      course,
      enrolled: true,
      sections: sectionData,
    });
  } catch (err) {
    console.error("🔥 Error loading enrolled course:", err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  publishCourse,
  deleteCourse,
  getMyCourses,
  previewCourse,
  getAllPublishedCourses,
  userCourseDetails,
  enrolledCourseDetails,
};
