const { Schema, model } = require('mongoose')

const CourseRatingSchema = new Schema({
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5, required: true },
    review: { type: String },
    createdAt: { type: Date, default: Date.now }
})

const CourseRating = model('CourseRating', CourseRatingSchema)
module.exports = CourseRating
