const { Schema, model } = require('mongoose')

const VideoSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    videoUrl: { type: String, required: true },
    duration: { type: Number },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    order: { type: Number },
    isPreview: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
})

const Video = model('Video', VideoSchema)
module.exports = Video
