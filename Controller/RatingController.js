const { default: mongoose } = require("mongoose");
const CourseRating = require("../Models/CourseRatingModel");

exports.createRatings = async (req, res) => {
    try {
        const { rating, review } = req.body;
        const userId = req.params.userId; 
        const courseId = req.params.courseId;

        let existingRating = await CourseRating.findOne({ userId, courseId });

        if (existingRating) {
            existingRating.rating = rating;
            existingRating.review = review;
            await existingRating.save();

            return res.json({
                success: true,
                message: "Rating updated successfully",
                rating: existingRating
            });
        }

        const newRating = await CourseRating.create({
            userId,
            courseId,
            rating,
            review
        });

        res.json({
            success: true,
            message: "Rating added successfully",
            rating: newRating
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}


exports.getRatingsByCourse = async (req, res) => {
    try {
        const courseId = req.params.courseId;

        const ratings = await CourseRating.find({ courseId })
            .populate("userId", "name email");

        res.json({
            success: true,
            ratings
        });

    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching ratings" });
    }
}

exports.getAverage = async (req, res) => {
     try {
        const courseId = req.params.courseId;

        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.json({
                success: false,
                message: "Invalid courseId"
            });
        }

        const result = await CourseRating.aggregate([
            { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
            { $group: { _id: null, averageRating: { $avg: "$rating" }, count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            average: result[0]?.averageRating || 0,
            totalRatings: result[0]?.count || 0
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error calculating average" });
    }
}
