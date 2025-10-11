const { Schema, model } = require('mongoose')

const EnrollmentSchema = new Schema({
    courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    enrollDate: { type: Date, default: Date.now },
    progress: { type: Number, default: 0 },
    isComplete: { type: Boolean, default: false }
})

const Enrollment = model('Enrollment', EnrollmentSchema)
module.exports = Enrollment
