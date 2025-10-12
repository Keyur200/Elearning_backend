const Course = require('../Models/CourseModel');
const Video = require('../Models/VideoModel');

const createCourse = async (req, res) => {
    try {
        const { title, description, categoryId, price, estimatedPrice, tags, level, benefits, instructorId } = req.body;

        if (!req.file) return res.status(400).json({ message: "Thumbnail is required" });

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
            thumbnail: req.file.path,
        });

        await course.save();
        res.status(201).json({ message: "Course created successfully", course });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}


const createVideo = async (req, res) => {
    try {
        const { title, description, duration, courseId, order, isPreview } = req.body;

        if (!req.file) return res.status(400).json({ message: "Video file is required" });

        const video = new Video({
            title,
            description,
            duration,
            courseId,
            order,
            isPreview,
            videoUrl: req.file.path,
        });

        await video.save();
        res.status(201).json({ message: "Video uploaded successfully", video });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

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
}

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
}
module.exports = { createCourse, createVideo, deleteVideo, publishCourse }