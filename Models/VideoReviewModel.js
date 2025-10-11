const { Schema, model } = require('mongoose')

const VideoReviewSchema = new Schema({
    videoId: { type: Schema.Types.ObjectId, ref: 'Video' },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: String, required: true },
    reply: { type: String },
    resolved: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
})

const VideoReview = model('VideoReview', VideoReviewSchema)
module.exports = VideoReview
