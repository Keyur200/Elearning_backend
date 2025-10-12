const express = require('express');
const router = express.Router();
const categoryController = require('../Controller/categoryController');
const { requireLogin } = require('../Middleware/authMiddleware');
const { isAdmin } = require('../Middleware/roleMiddleware');

// ✅ Create Category — Admin only
router.post('/', requireLogin, isAdmin, categoryController.createCategory);

// ✅ Get All Categories — Public (anyone can see)
router.get('/', categoryController.getAllCategories);

// ✅ Get Single Category — Public (anyone can see)
router.get('/:id', categoryController.getCategoryById);

// ✅ Update Category — Admin only
router.put('/:id', requireLogin, isAdmin, categoryController.updateCategory);

// ✅ Delete Category — Admin only
router.delete('/:id', requireLogin, isAdmin, categoryController.deleteCategory);

module.exports = router;
