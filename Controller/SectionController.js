const Section = require("../Models/SectionModel");
const Course = require("../Models/CourseModel");
const Video = require("../Models/VideoModel");

/* --------------------------------
 🟩 SECTION CONTROLLERS
---------------------------------- */

// ✅ Create Section
const createSection = async (req, res) => {
  try {
    const { title, order, courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const section = new Section({
      title,
      order,
      courseId,
    });

    await section.save();
    res.status(201).json({ message: "Section created successfully", section });
  } catch (err) {
    console.error("Error creating section:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get All Sections by Course (with videos)
const getSectionsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const sections = await Section.find({ courseId }).sort({ order: 1 }).lean();

    // Populate videos under each section
    for (const section of sections) {
      section.videos = await Video.find({ sectionId: section._id }).select(
        "title url isPreview duration"
      );
    }

    res.json({ total: sections.length, sections });
  } catch (err) {
    console.error("Error fetching sections:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get Single Section by ID (with videos)
const getSectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const section = await Section.findById(id);

    if (!section) return res.status(404).json({ message: "Section not found" });

    const videos = await Video.find({ sectionId: id }).select(
      "title url isPreview duration"
    );

    res.json({ section, videos });
  } catch (err) {
    console.error("Error fetching section:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Update Section
const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, order } = req.body;

    const section = await Section.findById(id);
    if (!section) return res.status(404).json({ message: "Section not found" });

    if (title) section.title = title;
    if (order !== undefined) section.order = order;

    await section.save();
    res.json({ message: "Section updated successfully", section });
  } catch (err) {
    console.error("Error updating section:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Delete Section (with detailed debug logging)
const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🟡 Request to delete section ID:", id);

    const section = await Section.findById(id);
    if (!section) {
      console.log("❌ Section not found");
      return res.status(404).json({ message: "Section not found" });
    }

    console.log("✅ Found section:", section.title, "Course:", section.courseId);

    const videos = await Video.find({ sectionId: id });
    console.log(`📹 Found ${videos.length} videos in this section`);

    if (videos.length > 0) {
      console.log("🔍 Finding previous or next section...");

      // find previous
      let targetSection = await Section.findOne({
        courseId: section.courseId,
        order: { $lt: section.order ?? 0 },
      }).sort({ order: -1 });

      // find next if no previous
      if (!targetSection) {
        targetSection = await Section.findOne({
          courseId: section.courseId,
          order: { $gt: section.order ?? 0 },
        }).sort({ order: 1 });
      }

      if (targetSection) {
        console.log(
          `✅ Moving videos to target section: ${targetSection.title}`
        );
        await Video.updateMany(
          { sectionId: id },
          { $set: { sectionId: targetSection._id } }
        );
      } else {
        console.log("⚠️ No other section found — deleting videos");
        await Video.deleteMany({ sectionId: id });
      }
    }

    console.log("🗑️ Deleting section:", section.title);
    await section.deleteOne();

    res.json({
      message: "Section deleted successfully",
      videosHandled:
        videos.length > 0
          ? "Videos moved or deleted based on available sections"
          : "No videos in section",
    });
  } catch (err) {
    console.error("❌ Error deleting section:", err);
    res.status(500).json({
      message: err.message || "Internal Server Error",
      errorStack: err.stack,
    });
  }
};

module.exports = {
  createSection,
  getSectionsByCourse,
  getSectionById,
  updateSection,
  deleteSection,
};
