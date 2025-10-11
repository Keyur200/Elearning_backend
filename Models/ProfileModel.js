const { Schema, model } = require('mongoose')

const ProfileSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true },
    phone: { type: String },
    gitHubUsername: { type: String },
    bio: { type: String },
    image: { type: String },
    createdAt: { type: Date, default: Date.now }
})

const Profile = model('Profile', ProfileSchema)
module.exports = Profile
