const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./Cloudinary');

// Storage for images
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ELearning-thumbnail',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

// Storage for videos
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ELearning-videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi'],
  },
});

const uploadImage = multer({ storage: imageStorage });
const uploadVideo = multer({ storage: videoStorage });

module.exports = { uploadImage, uploadVideo };
