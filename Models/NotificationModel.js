const { Schema, model } = require('mongoose')

const NotificationSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, required: true },
    referenceId: { type: Schema.Types.ObjectId },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    forRole: { type: String },
    createdAt: { type: Date, default: Date.now }
})

const Notification = model('Notification', NotificationSchema)
module.exports = Notification
