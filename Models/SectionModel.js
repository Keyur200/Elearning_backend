const { Schema, model } = require('mongoose');

const SectionSchema = new Schema({
  title: { type: String, required: true },     // e.g. "Introduction", "HTML Basics"
  order: { type: Number, default: 0 },         // order of the section in the course
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  createdAt: { type: Date, default: Date.now }
});

const Section = model('Section', SectionSchema);
module.exports = Section;
