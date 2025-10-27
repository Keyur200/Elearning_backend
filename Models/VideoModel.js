const { Schema, model } = require('mongoose');

const VideoSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  videoUrl: { type: String, required: true },

  // 👇 Store as string so formats like "05:30" or "1:20:15" work
  duration: { type: String },

  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },

  order: { type: Number, default: 0 },
  isPreview: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// ✅ Optional helper: convert duration string (HH:MM:SS or MM:SS) to total seconds
VideoSchema.methods.getDurationInSeconds = function () {
  const parts = this.duration.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
};

const Video = model('Video', VideoSchema);
module.exports = Video;
