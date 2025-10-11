const { Schema, model } = require('mongoose')

const CategorySchema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    createdAt: { type: Date, default: Date.now }
})

const Category = model('Category', CategorySchema)
module.exports = Category
