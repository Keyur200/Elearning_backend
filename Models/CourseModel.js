const { Schema, model } = require('mongoose')

const CourseSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    price: { type: Number, required: true },
    estimatedPrice: { type: Number },
    thumbnail: { type: String, required: true },
    tags: [{ type: String }],
    level: { type: String, required: true },
    benefits: [{ type: String }],
    instructorId: { type: Schema.Types.ObjectId, ref: 'User' },
    isPublished: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
})

const Course = model('Course', CourseSchema)
module.exports = Course
