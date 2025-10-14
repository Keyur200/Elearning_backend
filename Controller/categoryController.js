const Category = require('../Models/CategoryModel');
const cloudinary = require('cloudinary').v2;

// ✅ Create Category
exports.createCategory = async (req, res) => {
  try {
    const { name, description, imageUrl } = req.body;
    let finalImage;

    // Handle file upload or URL
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "categories",
        resource_type: "image",
      });
      finalImage = uploadResult.secure_url;
    } else if (imageUrl) {
      finalImage = imageUrl;
    } else {
      return res.status(400).json({ message: "Image is required (file or URL)" });
    }

    const newCategory = new Category({ name, description, image: finalImage });
    await newCategory.save();
    res.status(201).json({ message: 'Category created successfully', category: newCategory });
  } catch (error) {
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

// ✅ Get All Categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

// ✅ Get Single Category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching category', error: error.message });
  }
};

// ✅ Update Category
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, imageUrl } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    // Handle file upload or URL
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "categories",
        resource_type: "image",
      });
      category.image = uploadResult.secure_url;
    } else if (imageUrl) {
      category.image = imageUrl;
    }

    category.name = name || category.name;
    category.description = description || category.description;

    await category.save();
    res.status(200).json({ message: 'Category updated successfully', category });
  } catch (error) {
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
};

// ✅ Delete Category
exports.deleteCategory = async (req, res) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    if (!deletedCategory) return res.status(404).json({ message: 'Category not found' });
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
};
