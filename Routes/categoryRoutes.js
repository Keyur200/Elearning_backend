const express = require('express');
const router = express.Router();
const categoryController = require('../Controller/categoryController');
const { requireLogin } = require('../Middleware/authMiddleware');
const { isAdmin } = require('../Middleware/roleMiddleware');
const { uploadImage } = require('../Config/Multer'); // Multer + Cloudinary

// ✅ Create Category — Admin only (supports file upload or image URL)
router.post(
  '/',
  requireLogin,
  isAdmin,
  uploadImage.single('image'), // 'image' is the field name for uploaded file
  categoryController.createCategory
);

// ✅ Get All Categories — Public
router.get('/', categoryController.getAllCategories);

// ✅ Get Single Category — Public
router.get('/:id', categoryController.getCategoryById);

// ✅ Update Category — Admin only (supports file upload or image URL)
router.put(
  '/:id',
  requireLogin,
  isAdmin,
  uploadImage.single('image'),
  categoryController.updateCategory
);

// ✅ Delete Category — Admin only
router.delete('/:id', requireLogin, isAdmin, categoryController.deleteCategory);

module.exports = router;
